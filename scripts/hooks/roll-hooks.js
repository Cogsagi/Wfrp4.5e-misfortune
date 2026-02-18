import {
  MODULE_ID,
  SETTING_TRIGGER_VALUE,
  SETTING_CHAT_FLAVOR,
  SOCKET_NAME,
  MISFORTUNE_MESSAGES
} from '../constants.js';
import { getPool, addMisfortune } from '../misfortune-pool.js';

const WFRP_ROLL_HOOKS = [
  'wfrp4e:rollTest',
  'wfrp4e:rollWeaponTest',
  'wfrp4e:rollCastTest',
  'wfrp4e:rollChannelTest',
  'wfrp4e:rollPrayerTest',
  'wfrp4e:rollTraitTest',
  'wfrp4e:rollIncomeTest'
];

export function registerRollHooks() {
  for (const hookName of WFRP_ROLL_HOOKS) {
    Hooks.on(hookName, (test, cardOptions) => {
      handleRollTest(test, cardOptions);
    });
  }
}

async function handleRollTest(test, cardOptions) {
  // Only process on GM client to avoid duplicates
  if (!game.user.isGM) return;

  // Determine the rolling user
  let rollingUser = null;

  if (cardOptions?.user) {
    rollingUser = game.users.get(cardOptions.user);
  }

  if (!rollingUser && test?.actor) {
    rollingUser = game.users.find(u =>
      !u.isGM && test.actor.testUserPermission(u, 'OWNER')
    );
  }

  // Bail if user is unknown or is a GM/Assistant
  if (!rollingUser || rollingUser.isGM) return;

  // Extract the d100 roll result (check multiple paths for compatibility)
  let rollValue = null;

  if (test?.result?.roll !== undefined) {
    rollValue = test.result.roll;
  } else if (test?.roll !== undefined) {
    rollValue = test.roll;
  } else if (test?.result?.dice !== undefined) {
    rollValue = test.result.dice;
  }

  if (rollValue === null || rollValue === undefined) {
    console.warn(`${MODULE_ID} | Could not extract roll value from test:`, test);
    return;
  }

  // Check against trigger value
  const triggerValue = game.settings.get(MODULE_ID, SETTING_TRIGGER_VALUE);
  if (rollValue !== triggerValue) return;

  // ========== MISFORTUNE TRIGGERED! ==========
  console.log(`${MODULE_ID} | Misfortune triggered! ${rollingUser.name} rolled ${rollValue}`);

  await addMisfortune(rollingUser.name, rollValue);

  // Post dramatic chat message
  if (game.settings.get(MODULE_ID, SETTING_CHAT_FLAVOR)) {
    const msg = MISFORTUNE_MESSAGES[Math.floor(Math.random() * MISFORTUNE_MESSAGES.length)];

    ChatMessage.create({
      content: `
        <div class="wfrp4e-misfortune--chat wfrp4e-misfortune--chat-earned">
          <div class="wfrp4e-misfortune--chat-icon">⛧</div>
          <div class="wfrp4e-misfortune--chat-body">
            <h4 class="wfrp4e-misfortune--chat-title">Misfortune!</h4>
            <p class="wfrp4e-misfortune--chat-text">${msg}</p>
            <p class="wfrp4e-misfortune--chat-detail"><strong>${rollingUser.name}</strong> rolled <strong>${rollValue}</strong>.</p>
            <p class="wfrp4e-misfortune--chat-pool">The GM now has <strong>${getPool()}</strong> Misfortune point(s).</p>
          </div>
        </div>`,
      speaker: { alias: 'The Dark Gods' }
    });
  }

  // Broadcast update to all clients
  game.socket.emit(SOCKET_NAME, {
    action: 'updateTracker',
    pool: getPool()
  });
}
