# API: Practical Integration Examples

> Real-world code patterns for common Foundry VTT module tasks, using fvtt-prototypes conventions.

## Example 1: Complete Settings Registration

Register module settings with localization, callbacks, and a custom settings menu.

```js
// scripts/settings.js
import { MODULE_ID, SETTINGS } from './constants.js';

export function registerSettings() {
  // Boolean toggle — appears in module settings UI
  game.settings.register(MODULE_ID, SETTINGS.ENABLE_FEATURE, {
    name: game.i18n.localize('FVTT_PROTOTYPES.Settings.EnableFeature'),
    hint: game.i18n.localize('FVTT_PROTOTYPES.Settings.EnableFeatureHint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    requiresReload: false,
    onChange: (value) => {
      if (value) ui.notifications.info('Prototype feature enabled.');
    }
  });

  // Dropdown choice
  game.settings.register(MODULE_ID, SETTINGS.DEBUG_MODE, {
    name: game.i18n.localize('FVTT_PROTOTYPES.Settings.DebugMode'),
    scope: 'client',
    config: true,
    type: String,
    choices: {
      off: 'Off',
      info: 'Info',
      verbose: 'Verbose'
    },
    default: 'off'
  });

  // Hidden setting — used programmatically
  game.settings.register(MODULE_ID, 'internalState', {
    scope: 'world',
    config: false,
    type: Object,
    default: {}
  });
}
```

## Example 2: Actor Sheet Injection

Add a custom tab and content panel to an existing Actor sheet.

```js
// scripts/hooks/render-actor-sheet.js
import { MODULE_ID, FLAGS } from '../constants.js';
import { log } from '../utils/logging.js';

export function onRenderActorSheet(app, html, data) {
  // Only inject if feature is enabled
  if (!game.settings.get(MODULE_ID, 'enableFeature')) return;

  const actor = app.document;
  const protoData = actor.getFlag(MODULE_ID, FLAGS.PROTOTYPE_DATA) ?? {};

  // Add tab navigation button
  const tabs = html.find('.sheet-tabs');
  tabs.append(`
    <a class="item" data-tab="prototypes">
      <i class="fas fa-flask"></i>
      ${game.i18n.localize('FVTT_PROTOTYPES.Tab.Prototypes')}
    </a>
  `);

  // Add tab content
  const sheetBody = html.find('.sheet-body');
  sheetBody.append(`
    <div class="tab" data-tab="prototypes" data-group="primary">
      <div class="fvtt-prototypes--panel">
        <h3>${game.i18n.localize('FVTT_PROTOTYPES.Panel.Title')}</h3>
        <div class="fvtt-prototypes--panel__content">
          <label>
            ${game.i18n.localize('FVTT_PROTOTYPES.Fields.Variant')}
            <input type="text"
                   class="fvtt-prototypes--variant-input"
                   value="${protoData.variant ?? ''}"
                   placeholder="Enter variant name..." />
          </label>
          <p class="notes">
            ${game.i18n.localize('FVTT_PROTOTYPES.Fields.VariantHint')}
          </p>
        </div>
      </div>
    </div>
  `);

  // Bind save handler
  html.find('.fvtt-prototypes--variant-input').on('change', async (event) => {
    const value = event.target.value;
    await actor.setFlag(MODULE_ID, `${FLAGS.PROTOTYPE_DATA}.variant`, value);
    log(`Saved variant "${value}" for actor ${actor.name}`);
  });
}
```

## Example 3: Application V2 Dialog

Build a custom configuration dialog using Application V2 (Foundry V12+).

```js
// scripts/apps/PrototypeConfig.js
import { MODULE_ID, TEMPLATES } from '../constants.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class PrototypeConfig extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: 'fvtt-prototypes-config',
    tag: 'form',
    form: {
      handler: PrototypeConfig.#onSubmit,
      closeOnSubmit: true
    },
    position: {
      width: 480,
      height: 'auto'
    },
    window: {
      title: 'FVTT_PROTOTYPES.Config.Title',
      icon: 'fas fa-flask'
    }
  };

  static PARTS = {
    form: {
      template: TEMPLATES.CONFIG
    }
  };

  #actor;

  constructor(actor, options = {}) {
    super(options);
    this.#actor = actor;
  }

  async _prepareContext() {
    const flagData = this.#actor.getFlag(MODULE_ID, 'prototypeData') ?? {};
    return {
      actor: this.#actor,
      variant: flagData.variant ?? '',
      iterations: flagData.iterations ?? 1,
      isGM: game.user.isGM
    };
  }

  static async #onSubmit(event, form, formData) {
    const data = foundry.utils.expandObject(formData.object);
    await this.#actor.setFlag(MODULE_ID, 'prototypeData', data);
    ui.notifications.info(
      game.i18n.format('FVTT_PROTOTYPES.Config.Saved', {
        name: this.#actor.name
      })
    );
  }
}
```

Paired Handlebars template:

```handlebars
{{!-- templates/config.hbs --}}
<div class="fvtt-prototypes--config">
  <div class="form-group">
    <label>{{localize "FVTT_PROTOTYPES.Fields.Variant"}}</label>
    <input type="text" name="variant" value="{{variant}}" />
  </div>

  <div class="form-group">
    <label>{{localize "FVTT_PROTOTYPES.Fields.Iterations"}}</label>
    <input type="number" name="iterations" value="{{iterations}}" min="1" max="100" />
  </div>

  {{#if isGM}}
  <div class="form-group">
    <p class="notes">{{localize "FVTT_PROTOTYPES.Config.GMNote"}}</p>
  </div>
  {{/if}}

  <footer class="sheet-footer">
    <button type="submit">
      <i class="fas fa-save"></i>
      {{localize "FVTT_PROTOTYPES.Config.Save"}}
    </button>
  </footer>
</div>
```

## Example 4: Socket-Based Sync

Synchronize module state across connected clients in real time.

```js
// scripts/socket.js
import { MODULE_ID, SOCKET_NAME } from './constants.js';
import { log, notifyError } from './utils/logging.js';

const handlers = new Map();

export function initSocket() {
  game.socket.on(SOCKET_NAME, ({ action, payload, userId }) => {
    if (userId === game.user.id) return;
    const handler = handlers.get(action);
    if (!handler) return;
    try {
      handler(payload, userId);
    } catch (err) {
      notifyError('Socket handler error', `Action "${action}" failed`, err);
    }
  });
}

export function onSocket(action, handler) {
  handlers.set(action, handler);
}

export function emit(action, payload) {
  game.socket.emit(SOCKET_NAME, {
    action,
    payload,
    userId: game.user.id
  });
}

// Usage in feature code:
// import { onSocket, emit } from '../socket.js';
//
// onSocket('highlightToken', ({ tokenId, color }) => {
//   const token = canvas.tokens.get(tokenId);
//   if (token) token.mesh.tint = Color.from(color);
// });
//
// emit('highlightToken', { tokenId: token.id, color: '#ff0000' });
```

## Example 5: Chat Message Integration

Add a custom chat command and render enriched messages.

```js
// scripts/hooks/chat.js
import { MODULE_ID } from '../constants.js';

export function onChatMessage(chatLog, message, chatData) {
  if (!message.startsWith('/proto')) return false;

  const args = message.slice(7).trim().split(' ');
  const command = args.shift();

  switch (command) {
    case 'roll':
      handleProtoRoll(args, chatData);
      return false; // Prevent default message
    case 'status':
      handleProtoStatus(chatData);
      return false;
    default:
      ui.notifications.warn(`Unknown prototype command: ${command}`);
      return false;
  }
}

async function handleProtoRoll(args, chatData) {
  const formula = args.join(' ') || '1d20';
  const roll = await new Roll(formula).evaluate();
  await roll.toMessage({
    speaker: chatData.speaker,
    flavor: `<strong>Prototype Roll</strong>`,
    flags: { [MODULE_ID]: { isProtoRoll: true } }
  });
}
```

## Decision History & Trade-offs

### Sheet Injection vs. Custom Sheet Class

**Chosen**: Sheet injection via render hooks.
**Why**: Works with any game system's sheets without requiring users to change their default sheet. Non-destructive — if the module is disabled, sheets revert to normal.
**Trade-off**: Injected HTML can break if the base sheet's structure changes. Pin to specific system versions when possible.

### Application V2 vs. Legacy Application

**Chosen**: Application V2 (AppV2) for new applications.
**Why**: V2 provides reactive rendering, proper form handling, and modern lifecycle management. Foundry V12+ ships it as the recommended pattern.
**Trade-off**: V2 API is newer with less community documentation. Legacy `Application` class has more examples available but is deprecated.

## Related Documents

| Document | Relevance |
|----------|-----------|
| [endpoints.md](endpoints.md) | API reference for all methods used here |
| [headers.md](headers.md) | Manifest configuration enabling these features |
| [../ui/patterns.md](../ui/patterns.md) | UI implementation patterns for applications |
| [../architecture/patterns.md](../architecture/patterns.md) | Error handling and design patterns |
