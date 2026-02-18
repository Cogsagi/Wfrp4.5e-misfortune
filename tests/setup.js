/**
 * Global Foundry VTT mock shims.
 *
 * This file is loaded by Vitest before every test file (see vitest.config.js
 * setupFiles). It creates minimal stand-ins for the Foundry globals that the
 * module code uses, so tests can run in a plain Node.js environment with no
 * Foundry instance present.
 *
 * Each test file is responsible for:
 *   - resetting mock call history (vi.resetAllMocks / vi.clearAllMocks)
 *   - restoring default mock implementations (see tests/helpers.js)
 *   - clearing the gameSettings store between tests
 */

import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Backing store – a plain object that the settings mock reads/writes.
// Exposed as globalThis.gameSettings so test files can set/inspect values.
// ---------------------------------------------------------------------------
const _settings = {};
globalThis.gameSettings = _settings;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
globalThis.Hooks = {
  /** Collected listeners by hook name – tests can call these directly. */
  _listeners: {},
  on: vi.fn(),
  once: vi.fn(),
  call: vi.fn(),
};

// ---------------------------------------------------------------------------
// game
// ---------------------------------------------------------------------------
globalThis.game = {
  /** Mutable so individual tests can set isGM = false etc. */
  user: { isGM: true, id: 'gm-user-id', name: 'GM' },
  users: {
    get: vi.fn(),
    find: vi.fn(),
  },
  settings: {
    register: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  },
  socket: {
    on: vi.fn(),
    emit: vi.fn(),
  },
  modules: {
    get: vi.fn(() => ({ api: {} })),
  },
};

// ---------------------------------------------------------------------------
// ChatMessage
// ---------------------------------------------------------------------------
globalThis.ChatMessage = {
  create: vi.fn(),
  getWhisperRecipients: vi.fn(),
};

// ---------------------------------------------------------------------------
// ui.notifications
// ---------------------------------------------------------------------------
globalThis.ui = {
  notifications: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
};
