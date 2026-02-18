import { MODULE_ID } from './constants.js';
import { getPool, spendMisfortune, resetPool } from './misfortune-pool.js';

export function registerChatCommand() {
  Hooks.on('chatMessage', (chatLog, messageText, chatData) => {
    const command = messageText.trim().toLowerCase();

    if (command === '/misfortune' || command === '/mf') {
      showPoolStatus();
      return false;
    }

    if (command === '/misfortune spend' || command === '/mf spend') {
      if (!game.user.isGM) {
        ui.notifications.warn('Only the GM can spend Misfortune points!');
        return false;
      }
      spendMisfortune();
      return false;
    }

    if (command === '/misfortune reset' || command === '/mf reset') {
      if (!game.user.isGM) {
        ui.notifications.warn('Only the GM can reset the Misfortune pool!');
        return false;
      }
      resetPool();
      return false;
    }

    if (command === '/misfortune help' || command === '/mf help') {
      showHelp();
      return false;
    }
  });
}

function showPoolStatus() {
  const pool = getPool();
  ChatMessage.create({
    content: `
      <div class="wfrp4e-misfortune--chat wfrp4e-misfortune--chat-status">
        <div class="wfrp4e-misfortune--chat-icon">⛧</div>
        <div class="wfrp4e-misfortune--chat-body">
          <p class="wfrp4e-misfortune--chat-text">The GM has <strong>${pool}</strong> Misfortune point(s).</p>
        </div>
      </div>`,
    speaker: { alias: 'Misfortune' },
    whisper: game.user.isGM ? [] : ChatMessage.getWhisperRecipients('GM')
  });
}

function showHelp() {
  ChatMessage.create({
    content: `
      <div class="wfrp4e-misfortune--chat wfrp4e-misfortune--chat-help">
        <div class="wfrp4e-misfortune--chat-body">
          <h4 class="wfrp4e-misfortune--chat-title">⛧ Misfortune Commands</h4>
          <p><strong>/misfortune</strong> or <strong>/mf</strong> — Show current pool</p>
          <p><strong>/mf spend</strong> — (GM) Spend 1 Misfortune point</p>
          <p><strong>/mf reset</strong> — (GM) Reset pool to 0</p>
          <p><strong>/mf help</strong> — Show this help</p>
        </div>
      </div>`,
    speaker: { alias: 'Misfortune' },
    whisper: [game.user.id]
  });
}
