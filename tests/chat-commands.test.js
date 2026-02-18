/**
 * chat-commands.test.js
 *
 * Tests the chatMessage hook routing logic in isolation.
 * The pool functions (getPool / spendMisfortune / resetPool) are replaced with
 * vi.fn() stubs so this suite only verifies command dispatch, not pool math.
 */

// vi.mock is hoisted above imports by Vitest, so the mock is in place when
// chat-commands.js is first imported.
import { vi } from 'vitest';

vi.mock('../scripts/misfortune-pool.js', () => ({
  getPool: vi.fn(() => 3),
  spendMisfortune: vi.fn(async () => true),
  resetPool: vi.fn(async () => undefined),
}));

import { describe, it, expect, beforeEach } from 'vitest';
import { setupFoundryMocks } from './helpers.js';
import { registerChatCommand } from '../scripts/chat-commands.js';
import { getPool, spendMisfortune, resetPool } from '../scripts/misfortune-pool.js';

/** Register the chatMessage hook and return the listener for direct invocation. */
function registerAndGetHandler() {
  registerChatCommand();
  return Hooks._listeners['chatMessage']?.[0];
}

describe('chat-commands', () => {
  setupFoundryMocks();

  // After vi.resetAllMocks() runs in setupFoundryMocks, the pool mock return
  // values are cleared. Re-apply them so tests relying on getPool() = 3 pass.
  beforeEach(() => {
    getPool.mockReturnValue(3);
    spendMisfortune.mockResolvedValue(true);
    resetPool.mockResolvedValue(undefined);
  });

  // ── /misfortune and /mf (pool status) ───────────────────────────────────

  describe.each([['/misfortune'], ['/mf']])('%s', (cmd) => {
    it('posts a status message and returns false', () => {
      const handler = registerAndGetHandler();
      const result = handler(null, cmd, {});

      expect(result).toBe(false);
      expect(ChatMessage.create).toHaveBeenCalledOnce();

      const { content } = ChatMessage.create.mock.calls[0][0];
      expect(content).toContain('3'); // current pool value from mock
    });
  });

  // ── /misfortune spend and /mf spend ────────────────────────────────────

  describe.each([['/misfortune spend'], ['/mf spend']])('%s', (cmd) => {
    it('calls spendMisfortune and returns false when user is GM', () => {
      const handler = registerAndGetHandler();
      game.user.isGM = true;

      const result = handler(null, cmd, {});

      expect(result).toBe(false);
      expect(spendMisfortune).toHaveBeenCalledOnce();
    });

    it('warns and returns false (without spending) when user is not GM', () => {
      const handler = registerAndGetHandler();
      game.user.isGM = false;

      const result = handler(null, cmd, {});

      expect(result).toBe(false);
      expect(ui.notifications.warn).toHaveBeenCalledWith(
        'Only the GM can spend Misfortune points!'
      );
      expect(spendMisfortune).not.toHaveBeenCalled();
    });
  });

  // ── /misfortune reset and /mf reset ────────────────────────────────────

  describe.each([['/misfortune reset'], ['/mf reset']])('%s', (cmd) => {
    it('calls resetPool and returns false when user is GM', () => {
      const handler = registerAndGetHandler();
      game.user.isGM = true;

      const result = handler(null, cmd, {});

      expect(result).toBe(false);
      expect(resetPool).toHaveBeenCalledOnce();
    });

    it('warns and returns false (without resetting) when user is not GM', () => {
      const handler = registerAndGetHandler();
      game.user.isGM = false;

      const result = handler(null, cmd, {});

      expect(result).toBe(false);
      expect(ui.notifications.warn).toHaveBeenCalledWith(
        'Only the GM can reset the Misfortune pool!'
      );
      expect(resetPool).not.toHaveBeenCalled();
    });
  });

  // ── /misfortune help and /mf help ───────────────────────────────────────

  describe.each([['/misfortune help'], ['/mf help']])('%s', (cmd) => {
    it('posts a help message listing available commands and returns false', () => {
      const handler = registerAndGetHandler();
      const result = handler(null, cmd, {});

      expect(result).toBe(false);
      expect(ChatMessage.create).toHaveBeenCalledOnce();

      const { content } = ChatMessage.create.mock.calls[0][0];
      expect(content).toContain('/mf spend');
      expect(content).toContain('/mf reset');
    });
  });

  // ── Unrecognised commands ───────────────────────────────────────────────

  it('does not intercept unrecognised commands', () => {
    const handler = registerAndGetHandler();
    const result = handler(null, '/roll 1d6', {});

    expect(result).toBeUndefined();
    expect(ChatMessage.create).not.toHaveBeenCalled();
  });

  it('is case-insensitive (commands are lowercased before matching)', () => {
    const handler = registerAndGetHandler();
    const result = handler(null, '/MF', {});

    expect(result).toBe(false);
    expect(ChatMessage.create).toHaveBeenCalledOnce();
  });
});
