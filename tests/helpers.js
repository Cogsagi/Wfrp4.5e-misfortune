/**
 * Shared test helpers.
 *
 * setupFoundryMocks() — call once inside a describe() block. It registers a
 * beforeEach that resets all vi mocks, re-applies the settings store
 * implementations, and restores default game state so every test starts clean.
 *
 * flushAsync() — await this after calling a fire-and-forget async function
 * (e.g. a Hooks listener that does not return the inner Promise) to let all
 * queued microtasks and one macrotask cycle complete.
 */

import { vi, beforeEach } from 'vitest';
import {
  SETTING_POOL,
  SETTING_LOG,
  SETTING_CHAT_FLAVOR,
  SETTING_SHOW_PLAYERS,
  SETTING_TRIGGER_VALUE,
} from '../scripts/constants.js';

export function setupFoundryMocks() {
  beforeEach(() => {
    // ── 1. Reset all mock call history and implementations ──────────────────
    vi.resetAllMocks();

    // ── 2. Reset settings store to safe defaults ────────────────────────────
    for (const k of Object.keys(gameSettings)) delete gameSettings[k];
    Object.assign(gameSettings, {
      [SETTING_POOL]: 0,
      [SETTING_LOG]: [],
      [SETTING_CHAT_FLAVOR]: true,
      [SETTING_SHOW_PLAYERS]: true,
      [SETTING_TRIGGER_VALUE]: 88,
    });

    // ── 3. Clear hook listeners registered in previous tests ────────────────
    for (const k of Object.keys(Hooks._listeners)) delete Hooks._listeners[k];

    // ── 4. Reset game.user to GM defaults ───────────────────────────────────
    game.user.isGM = true;
    game.user.id = 'gm-user-id';
    game.user.name = 'GM';

    // ── 5. Re-apply settings mock implementations ────────────────────────────
    game.settings.get.mockImplementation((_mod, key) => gameSettings[key]);
    game.settings.set.mockImplementation(async (_mod, key, value) => {
      gameSettings[key] = value;
    });
    game.settings.register.mockImplementation(() => {});

    // ── 6. Safe defaults for user lookups ────────────────────────────────────
    game.users.get.mockReturnValue(null);
    game.users.find.mockReturnValue(null);

    // ── 7. ChatMessage helpers ───────────────────────────────────────────────
    ChatMessage.getWhisperRecipients.mockReturnValue([]);

    // ── 8. Hooks implementations (store listeners so tests can invoke them) ──
    Hooks.on.mockImplementation((name, fn) => {
      Hooks._listeners[name] ??= [];
      Hooks._listeners[name].push(fn);
    });
    Hooks.once.mockImplementation((name, fn) => {
      Hooks._listeners[name] ??= [];
      Hooks._listeners[name].push(fn);
    });
  });
}

/**
 * Flush all pending Promises / microtasks by yielding to the event loop once.
 *
 * Use this after triggering a fire-and-forget async hook handler so that the
 * async work inside it completes before you make assertions.
 */
export const flushAsync = () => new Promise((r) => setTimeout(r, 0));
