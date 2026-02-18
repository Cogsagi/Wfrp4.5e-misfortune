import { MODULE_ID, SETTING_LOG } from '../constants.js';

export class MisfortuneLogViewer extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'wfrp4e-misfortune--log-viewer',
      title: '⛧ Misfortune Log',
      template: `modules/${MODULE_ID}/templates/log-viewer.hbs`,
      width: 400,
      height: 500,
      resizable: true
    });
  }

  getData() {
    const log = game.settings.get(MODULE_ID, SETTING_LOG);
    return {
      entries: [...log].reverse().map(entry => ({
        ...entry,
        formattedTime: new Date(entry.timestamp).toLocaleString(),
        isEarned: entry.type === 'earned',
        isSpent: entry.type === 'spent'
      }))
    };
  }
}
