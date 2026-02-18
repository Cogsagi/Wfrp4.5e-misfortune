import {
  MODULE_ID,
  SETTING_POOL,
  SETTING_LOG,
  SETTING_SHOW_PLAYERS,
  SETTING_TRIGGER_VALUE,
  SETTING_CHAT_FLAVOR
} from './constants.js';
import { updateTrackerDisplay, renderTracker } from './apps/tracker.js';

export function registerSettings() {
  // The Misfortune pool counter (world-scoped, GM-only write)
  game.settings.register(MODULE_ID, SETTING_POOL, {
    name: 'Misfortune Pool',
    hint: 'Current number of Misfortune points available to the GM.',
    scope: 'world',
    config: false,
    type: Number,
    default: 0,
    onChange: (value) => {
      updateTrackerDisplay(value);
    }
  });

  // Log of Misfortune events
  game.settings.register(MODULE_ID, SETTING_LOG, {
    name: 'Misfortune Log',
    hint: 'History of earned and spent Misfortune points.',
    scope: 'world',
    config: false,
    type: Array,
    default: []
  });

  // Whether to show the tracker to players
  game.settings.register(MODULE_ID, SETTING_SHOW_PLAYERS, {
    name: 'WFRP4E-MISFORTUNE.Settings.ShowPlayers',
    hint: 'WFRP4E-MISFORTUNE.Settings.ShowPlayersHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    onChange: () => {
      renderTracker();
    }
  });

  // Configurable trigger value (default 88)
  game.settings.register(MODULE_ID, SETTING_TRIGGER_VALUE, {
    name: 'WFRP4E-MISFORTUNE.Settings.TriggerValue',
    hint: 'WFRP4E-MISFORTUNE.Settings.TriggerValueHint',
    scope: 'world',
    config: true,
    type: Number,
    default: 88
  });

  // Chat flavor toggle
  game.settings.register(MODULE_ID, SETTING_CHAT_FLAVOR, {
    name: 'WFRP4E-MISFORTUNE.Settings.ChatFlavor',
    hint: 'WFRP4E-MISFORTUNE.Settings.ChatFlavorHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });
}
