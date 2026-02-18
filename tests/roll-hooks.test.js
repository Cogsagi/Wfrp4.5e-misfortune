import { describe, it, expect, vi } from 'vitest';
import { setupFoundryMocks, flushAsync } from './helpers.js';
import { registerRollHooks } from '../scripts/hooks/roll-hooks.js';
import {
  SETTING_POOL,
  SETTING_CHAT_FLAVOR,
  SETTING_TRIGGER_VALUE,
  SOCKET_NAME,
} from '../scripts/constants.js';

// A non-GM player used across tests
const PLAYER = { id: 'player-1', name: 'Brunhilde', isGM: false };

/**
 * Register hooks then return the first chatMessage listener for wfrp4e:rollTest.
 * All seven WFRP hooks receive the same handler; testing one is sufficient.
 */
function registerAndGetHandler() {
  registerRollHooks();
  return Hooks._listeners['wfrp4e:rollTest']?.[0];
}

// ---------------------------------------------------------------------------
// registerRollHooks — registration behaviour
// ---------------------------------------------------------------------------

describe('registerRollHooks – hook registration', () => {
  setupFoundryMocks();

  it('registers a listener for every WFRP4e roll hook variant', () => {
    registerRollHooks();

    const expected = [
      'wfrp4e:rollTest',
      'wfrp4e:rollWeaponTest',
      'wfrp4e:rollCastTest',
      'wfrp4e:rollChannelTest',
      'wfrp4e:rollPrayerTest',
      'wfrp4e:rollTraitTest',
      'wfrp4e:rollIncomeTest',
    ];

    for (const hook of expected) {
      expect(
        Hooks._listeners[hook],
        `expected listener for ${hook}`
      ).toHaveLength(1);
    }
  });
});

// ---------------------------------------------------------------------------
// handleRollTest — behaviour driven through the registered hook
// ---------------------------------------------------------------------------

describe('handleRollTest', () => {
  setupFoundryMocks();

  // ── Guard: non-GM client ────────────────────────────────────────────────

  it('does nothing when the current user is not the GM', async () => {
    const handler = registerAndGetHandler();
    game.user.isGM = false;

    handler({ result: { roll: 88 } }, { user: PLAYER.id });
    await flushAsync();

    expect(gameSettings[SETTING_POOL]).toBe(0);
    expect(game.users.get).not.toHaveBeenCalled();
  });

  // ── User resolution ─────────────────────────────────────────────────────

  it('resolves the rolling user from cardOptions.user', async () => {
    const handler = registerAndGetHandler();
    game.users.get.mockReturnValue(PLAYER);

    handler({ result: { roll: 88 } }, { user: PLAYER.id });
    await flushAsync();

    expect(gameSettings[SETTING_POOL]).toBe(1);
  });

  it('falls back to actor ownership when cardOptions.user is absent', async () => {
    const handler = registerAndGetHandler();
    // game.users.get returns null (default) — no user from cardOptions
    game.users.find.mockReturnValue(PLAYER);

    const testObj = {
      result: { roll: 88 },
      actor: { testUserPermission: vi.fn(() => true) },
    };

    handler(testObj, {});
    await flushAsync();

    expect(gameSettings[SETTING_POOL]).toBe(1);
  });

  it('does nothing when no rolling user can be determined', async () => {
    const handler = registerAndGetHandler();
    // Both get and find return null (setupFoundryMocks default)

    handler({ result: { roll: 88 } }, {});
    await flushAsync();

    expect(gameSettings[SETTING_POOL]).toBe(0);
  });

  it('does nothing when the rolling user is also a GM', async () => {
    const handler = registerAndGetHandler();
    game.users.get.mockReturnValue({ ...PLAYER, isGM: true });

    handler({ result: { roll: 88 } }, { user: PLAYER.id });
    await flushAsync();

    expect(gameSettings[SETTING_POOL]).toBe(0);
  });

  // ── Roll value extraction ────────────────────────────────────────────────

  it('extracts the roll value from test.result.roll (primary path)', async () => {
    const handler = registerAndGetHandler();
    game.users.get.mockReturnValue(PLAYER);

    handler({ result: { roll: 88 } }, { user: PLAYER.id });
    await flushAsync();

    expect(gameSettings[SETTING_POOL]).toBe(1);
  });

  it('falls back to test.roll when test.result.roll is absent', async () => {
    const handler = registerAndGetHandler();
    game.users.get.mockReturnValue(PLAYER);

    handler({ roll: 88 }, { user: PLAYER.id });
    await flushAsync();

    expect(gameSettings[SETTING_POOL]).toBe(1);
  });

  it('falls back to test.result.dice as a second fallback', async () => {
    const handler = registerAndGetHandler();
    game.users.get.mockReturnValue(PLAYER);

    handler({ result: { dice: 88 } }, { user: PLAYER.id });
    await flushAsync();

    expect(gameSettings[SETTING_POOL]).toBe(1);
  });

  it('warns and bails when no roll value path resolves', async () => {
    const handler = registerAndGetHandler();
    game.users.get.mockReturnValue(PLAYER);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    handler({}, { user: PLAYER.id });
    await flushAsync();

    expect(warnSpy).toHaveBeenCalled();
    expect(gameSettings[SETTING_POOL]).toBe(0);

    warnSpy.mockRestore();
  });

  // ── Trigger value matching ───────────────────────────────────────────────

  it('does nothing when the roll does not match the trigger value', async () => {
    const handler = registerAndGetHandler();
    game.users.get.mockReturnValue(PLAYER);
    gameSettings[SETTING_TRIGGER_VALUE] = 88;

    handler({ result: { roll: 77 } }, { user: PLAYER.id });
    await flushAsync();

    expect(gameSettings[SETTING_POOL]).toBe(0);
  });

  // ── Triggered behaviour ──────────────────────────────────────────────────

  it('increments the pool and emits a socket update when triggered', async () => {
    const handler = registerAndGetHandler();
    game.users.get.mockReturnValue(PLAYER);
    gameSettings[SETTING_CHAT_FLAVOR] = false; // keep side-effects minimal

    handler({ result: { roll: 88 } }, { user: PLAYER.id });
    await flushAsync();

    expect(gameSettings[SETTING_POOL]).toBe(1);
    expect(game.socket.emit).toHaveBeenCalledWith(SOCKET_NAME, {
      action: 'updateTracker',
      pool: 1,
    });
  });

  it('creates a flavour chat message when triggered and chat flavor is on', async () => {
    const handler = registerAndGetHandler();
    game.users.get.mockReturnValue(PLAYER);
    gameSettings[SETTING_CHAT_FLAVOR] = true;

    handler({ result: { roll: 88 } }, { user: PLAYER.id });
    await flushAsync();

    expect(ChatMessage.create).toHaveBeenCalledOnce();
    const { content, speaker } = ChatMessage.create.mock.calls[0][0];
    expect(content).toContain('Misfortune!');
    expect(content).toContain('Brunhilde');
    expect(speaker).toEqual({ alias: 'The Dark Gods' });
  });

  it('skips the chat message when chat flavor is disabled', async () => {
    const handler = registerAndGetHandler();
    game.users.get.mockReturnValue(PLAYER);
    gameSettings[SETTING_CHAT_FLAVOR] = false;

    handler({ result: { roll: 88 } }, { user: PLAYER.id });
    await flushAsync();

    expect(ChatMessage.create).not.toHaveBeenCalled();
  });
});
