import { SOCKET_NAME } from './constants.js';
import { updateTrackerDisplay } from './apps/tracker.js';

export function registerSocketListeners() {
  game.socket.on(SOCKET_NAME, (data) => {
    switch (data.action) {
      case 'updateTracker':
        updateTrackerDisplay(data.pool);
        break;
    }
  });
}
