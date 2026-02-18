import { describe, it, expect } from 'vitest';
import { setupFoundryMocks } from './helpers.js';
import {
  getPool,
  setPool,
  addMisfortune,
  spendMisfortune,
  resetPool,
} from '../scripts/misfortune-pool.js';
import {
  SETTING_POOL,
  SETTING_LOG,
  SETTING_CHAT_FLAVOR,
  SETTING_SHOW_PLAYERS,
} from '../scripts/constants.js';

describe('misfortune-pool', () => {
  setupFoundryMocks();

  // ── getPool ──────────────────────────────────────────────────────────────

  describe('getPool', () => {
    it('returns the current pool value', () => {
      gameSettings[SETTING_POOL] = 5;
      expect(getPool()).toBe(5);
    });

    it('returns 0 when the pool is empty', () => {
      gameSettings[SETTING_POOL] = 0;
      expect(getPool()).toBe(0);
    });
  });

  // ── setPool ──────────────────────────────────────────────────────────────

  describe('setPool', () => {
    it('persists the given value', async () => {
      await setPool(7);
      expect(gameSettings[SETTING_POOL]).toBe(7);
    });

    it('clamps negative values to 0', async () => {
      await setPool(-3);
      expect(gameSettings[SETTING_POOL]).toBe(0);
    });
  });

  // ── addMisfortune ────────────────────────────────────────────────────────

  describe('addMisfortune', () => {
    it('increments the pool by 1', async () => {
      gameSettings[SETTING_POOL] = 2;
      await addMisfortune('Brunhilde', 88);
      expect(gameSettings[SETTING_POOL]).toBe(3);
    });

    it('appends an earned log entry when running on the GM client', async () => {
      game.user.isGM = true;
      await addMisfortune('Brunhilde', 88);

      const log = gameSettings[SETTING_LOG];
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({
        type: 'earned',
        player: 'Brunhilde',
        roll: 88,
        pool: 1,
      });
      expect(typeof log[0].timestamp).toBe('number');
    });

    it('does not write to the log when running on a non-GM client', async () => {
      game.user.isGM = false;
      await addMisfortune('Brunhilde', 88);
      expect(gameSettings[SETTING_LOG]).toHaveLength(0);
    });

    it('trims the log to a maximum of 50 entries', async () => {
      game.user.isGM = true;
      gameSettings[SETTING_LOG] = Array.from({ length: 50 }, (_, i) => ({
        type: 'earned',
        i,
      }));

      await addMisfortune('Brunhilde', 88);

      const log = gameSettings[SETTING_LOG];
      expect(log).toHaveLength(50);
      // Oldest entry was shifted out; newest is at the end
      expect(log[49]).toMatchObject({ type: 'earned', player: 'Brunhilde' });
    });
  });

  // ── spendMisfortune ──────────────────────────────────────────────────────

  describe('spendMisfortune', () => {
    it('returns false and warns when the pool is empty', async () => {
      gameSettings[SETTING_POOL] = 0;
      const result = await spendMisfortune();
      expect(result).toBe(false);
      expect(ui.notifications.warn).toHaveBeenCalledWith(
        'No Misfortune points to spend!'
      );
    });

    it('decrements the pool by 1 and returns true', async () => {
      gameSettings[SETTING_POOL] = 3;
      const result = await spendMisfortune();
      expect(result).toBe(true);
      expect(gameSettings[SETTING_POOL]).toBe(2);
    });

    it('appends a spent log entry', async () => {
      gameSettings[SETTING_POOL] = 2;
      await spendMisfortune();

      const log = gameSettings[SETTING_LOG];
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({ type: 'spent', pool: 1 });
    });

    it('posts a notification with the remaining count', async () => {
      gameSettings[SETTING_POOL] = 3;
      await spendMisfortune();
      expect(ui.notifications.info).toHaveBeenCalledWith(
        'Misfortune spent! 2 points remaining.'
      );
    });

    it('creates a chat message when chat flavor is enabled', async () => {
      gameSettings[SETTING_POOL] = 1;
      gameSettings[SETTING_CHAT_FLAVOR] = true;
      await spendMisfortune();
      expect(ChatMessage.create).toHaveBeenCalledOnce();
    });

    it('omits the chat message when chat flavor is disabled', async () => {
      gameSettings[SETTING_POOL] = 1;
      gameSettings[SETTING_CHAT_FLAVOR] = false;
      await spendMisfortune();
      expect(ChatMessage.create).not.toHaveBeenCalled();
    });

    it('whispers to GM only when showPlayers is false', async () => {
      gameSettings[SETTING_POOL] = 1;
      gameSettings[SETTING_SHOW_PLAYERS] = false;
      ChatMessage.getWhisperRecipients.mockReturnValue(['gm-id']);

      await spendMisfortune();

      const { whisper } = ChatMessage.create.mock.calls[0][0];
      expect(whisper).toEqual(['gm-id']);
    });

    it('sends to all players when showPlayers is true', async () => {
      gameSettings[SETTING_POOL] = 1;
      gameSettings[SETTING_SHOW_PLAYERS] = true;

      await spendMisfortune();

      const { whisper } = ChatMessage.create.mock.calls[0][0];
      expect(whisper).toEqual([]);
    });
  });

  // ── resetPool ────────────────────────────────────────────────────────────

  describe('resetPool', () => {
    it('sets the pool to 0', async () => {
      gameSettings[SETTING_POOL] = 7;
      await resetPool();
      expect(gameSettings[SETTING_POOL]).toBe(0);
    });

    it('shows a reset notification', async () => {
      await resetPool();
      expect(ui.notifications.info).toHaveBeenCalledWith(
        'Misfortune pool has been reset.'
      );
    });

    it('creates a chat message when chat flavor is enabled', async () => {
      gameSettings[SETTING_CHAT_FLAVOR] = true;
      await resetPool();
      expect(ChatMessage.create).toHaveBeenCalledOnce();
    });

    it('omits the chat message when chat flavor is disabled', async () => {
      gameSettings[SETTING_CHAT_FLAVOR] = false;
      await resetPool();
      expect(ChatMessage.create).not.toHaveBeenCalled();
    });
  });
});
