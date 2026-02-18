import { MODULE_ID, SETTING_SHOW_PLAYERS, SOCKET_NAME } from '../constants.js';
import { getPool, addMisfortune, spendMisfortune, resetPool } from '../misfortune-pool.js';

export function renderTracker() {
  // Remove existing tracker if present
  const existing = document.getElementById('wfrp4e-misfortune--tracker');
  if (existing) existing.remove();

  // Check visibility settings
  const showToPlayers = game.settings.get(MODULE_ID, SETTING_SHOW_PLAYERS);
  if (!game.user.isGM && !showToPlayers) return;

  const pool = getPool();

  const tracker = document.createElement('div');
  tracker.id = 'wfrp4e-misfortune--tracker';
  tracker.classList.add('wfrp4e-misfortune--tracker');

  let controlsHtml = '';
  if (game.user.isGM) {
    controlsHtml = `
      <div class="wfrp4e-misfortune--tracker-controls">
        <button class="wfrp4e-misfortune--tracker-btn wfrp4e-misfortune--tracker-btn-spend"
                data-tooltip="Spend 1 Misfortune"
                title="Spend 1 Misfortune">
          ☠ Spend
        </button>
        <button class="wfrp4e-misfortune--tracker-btn wfrp4e-misfortune--tracker-btn-add"
                data-tooltip="Manually add 1 Misfortune"
                title="Manually add 1 Misfortune">
          +
        </button>
        <button class="wfrp4e-misfortune--tracker-btn wfrp4e-misfortune--tracker-btn-reset"
                data-tooltip="Reset Misfortune pool"
                title="Reset Misfortune pool">
          ↺
        </button>
      </div>`;
  }

  tracker.innerHTML = `
    <div class="wfrp4e-misfortune--tracker-header">
      <span class="wfrp4e-misfortune--tracker-symbol">⛧</span>
      <span class="wfrp4e-misfortune--tracker-title">Misfortune</span>
    </div>
    <div class="wfrp4e-misfortune--tracker-pool">
      <span class="wfrp4e-misfortune--tracker-count" id="wfrp4e-misfortune--count">${pool}</span>
    </div>
    ${controlsHtml}
  `;

  document.body.appendChild(tracker);

  // Bind GM controls
  if (game.user.isGM) {
    tracker.querySelector('.wfrp4e-misfortune--tracker-btn-spend')
      ?.addEventListener('click', () => spendMisfortune());

    tracker.querySelector('.wfrp4e-misfortune--tracker-btn-add')
      ?.addEventListener('click', async () => {
        await addMisfortune('GM (manual)', 0);
        ui.notifications.info(`Misfortune manually added. Pool: ${getPool()}`);
        game.socket.emit(SOCKET_NAME, {
          action: 'updateTracker',
          pool: getPool()
        });
      });

    tracker.querySelector('.wfrp4e-misfortune--tracker-btn-reset')
      ?.addEventListener('click', () => {
        new Dialog({
          title: 'Reset Misfortune',
          content: '<p>Are you sure you want to reset the Misfortune pool to 0?</p>',
          buttons: {
            yes: {
              icon: '<i class="fas fa-skull"></i>',
              label: 'Reset',
              callback: () => {
                resetPool();
                game.socket.emit(SOCKET_NAME, {
                  action: 'updateTracker',
                  pool: 0
                });
              }
            },
            no: {
              icon: '<i class="fas fa-times"></i>',
              label: 'Cancel'
            }
          },
          default: 'no'
        }).render(true);
      });
  }
}

export function updateTrackerDisplay(newValue) {
  const countEl = document.getElementById('wfrp4e-misfortune--count');
  if (!countEl) {
    renderTracker();
    return;
  }

  const oldValue = parseInt(countEl.textContent) || 0;
  countEl.textContent = newValue;

  if (newValue > oldValue) {
    countEl.classList.remove('wfrp4e-misfortune--pulse-up', 'wfrp4e-misfortune--pulse-down');
    void countEl.offsetWidth; // force reflow to restart animation
    countEl.classList.add('wfrp4e-misfortune--pulse-up');
  } else if (newValue < oldValue) {
    countEl.classList.remove('wfrp4e-misfortune--pulse-up', 'wfrp4e-misfortune--pulse-down');
    void countEl.offsetWidth;
    countEl.classList.add('wfrp4e-misfortune--pulse-down');
  }
}
