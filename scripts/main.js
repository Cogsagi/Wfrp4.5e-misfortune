// ============================================================================
// WFRP4e Misfortune — GM Fortune Pool Module
// ============================================================================
// When a non-GM player rolls an 88 on a d100 test, the GM gains a Misfortune
// point. These can be spent to reroll any NPC test. The Dark Gods are watching.
// ============================================================================

import { MODULE_ID } from './constants.js';
import { registerSettings } from './settings.js';
import { registerRollHooks } from './hooks/roll-hooks.js';
import { registerSocketListeners } from './socket.js';
import { registerChatCommand } from './chat-commands.js';
import { renderTracker } from './apps/tracker.js';
import { getPool, addMisfortune, spendMisfortune, resetPool } from './misfortune-pool.js';

Hooks.once('init', () => {
  console.log(`${MODULE_ID} | Initializing Misfortune module`);
  registerSettings();
});

Hooks.once('ready', () => {
  console.log(`${MODULE_ID} | Module ready — The Dark Gods are watching...`);

  registerRollHooks();
  registerSocketListeners();
  registerChatCommand();
  renderTracker();

  // Expose API for macros and other modules
  game.modules.get(MODULE_ID).api = {
    getPool,
    addMisfortune,
    spendMisfortune,
    resetPool,
    renderTracker
  };

  console.log(`${MODULE_ID} | API available at game.modules.get("${MODULE_ID}").api`);
});

// Re-render tracker when canvas is ready (handles scene changes)
Hooks.on('canvasReady', () => {
  renderTracker();
});
