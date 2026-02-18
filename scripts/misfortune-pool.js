import {
  MODULE_ID,
  SETTING_POOL,
  SETTING_LOG,
  SETTING_SHOW_PLAYERS,
  SETTING_CHAT_FLAVOR,
  SPEND_MESSAGES
} from './constants.js';

export function getPool() {
  return game.settings.get(MODULE_ID, SETTING_POOL);
}

export async function setPool(value) {
  await game.settings.set(MODULE_ID, SETTING_POOL, Math.max(0, value));
}

export async function addMisfortune(playerName, rollValue) {
  const current = getPool();
  await setPool(current + 1);

  // Log the event (GM client only)
  if (game.user.isGM) {
    const log = game.settings.get(MODULE_ID, SETTING_LOG);
    log.push({
      type: 'earned',
      player: playerName,
      roll: rollValue,
      pool: current + 1,
      timestamp: Date.now()
    });
    // Keep last 50 entries
    if (log.length > 50) log.shift();
    await game.settings.set(MODULE_ID, SETTING_LOG, log);
  }
}

export async function spendMisfortune() {
  const current = getPool();
  if (current <= 0) {
    ui.notifications.warn('No Misfortune points to spend!');
    return false;
  }
  await setPool(current - 1);

  // Log the event
  const log = game.settings.get(MODULE_ID, SETTING_LOG);
  log.push({
    type: 'spent',
    pool: current - 1,
    timestamp: Date.now()
  });
  if (log.length > 50) log.shift();
  await game.settings.set(MODULE_ID, SETTING_LOG, log);

  // Post dramatic chat message
  if (game.settings.get(MODULE_ID, SETTING_CHAT_FLAVOR)) {
    const msg = SPEND_MESSAGES[Math.floor(Math.random() * SPEND_MESSAGES.length)];
    ChatMessage.create({
      content: `
        <div class="wfrp4e-misfortune--chat wfrp4e-misfortune--chat-spent">
          <div class="wfrp4e-misfortune--chat-icon">☠</div>
          <div class="wfrp4e-misfortune--chat-body">
            <h4 class="wfrp4e-misfortune--chat-title">Misfortune Spent</h4>
            <p class="wfrp4e-misfortune--chat-text">${msg}</p>
            <p class="wfrp4e-misfortune--chat-pool">Remaining Misfortune: <strong>${current - 1}</strong></p>
          </div>
        </div>`,
      speaker: { alias: 'The Dark Gods' },
      whisper: game.settings.get(MODULE_ID, SETTING_SHOW_PLAYERS)
        ? []
        : ChatMessage.getWhisperRecipients('GM')
    });
  }

  ui.notifications.info(`Misfortune spent! ${current - 1} points remaining.`);
  return true;
}

export async function resetPool() {
  await setPool(0);
  ui.notifications.info('Misfortune pool has been reset.');

  if (game.settings.get(MODULE_ID, SETTING_CHAT_FLAVOR)) {
    ChatMessage.create({
      content: `
        <div class="wfrp4e-misfortune--chat wfrp4e-misfortune--chat-reset">
          <div class="wfrp4e-misfortune--chat-icon">✦</div>
          <div class="wfrp4e-misfortune--chat-body">
            <p class="wfrp4e-misfortune--chat-text">The balance of fate is restored... for now.</p>
          </div>
        </div>`,
      speaker: { alias: 'The Winds of Fate' },
      whisper: ChatMessage.getWhisperRecipients('GM')
    });
  }
}
