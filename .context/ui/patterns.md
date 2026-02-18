# UI: Implementation Patterns

> Forms, modals, sheet injection, canvas interaction, notifications, and data display patterns for Foundry VTT modules.

## Form Patterns

### Standard Form with Validation

```handlebars
{{!-- templates/config-form.hbs --}}
<section class="fvtt-prototypes--form">
  <div class="form-group">
    <label for="variant">{{localize "FVTT_PROTOTYPES.Fields.Variant"}}</label>
    <div class="form-fields">
      <input type="text" name="variant" id="variant"
             value="{{variant}}" maxlength="100"
             placeholder="{{localize 'FVTT_PROTOTYPES.Fields.VariantPlaceholder'}}" />
    </div>
    <p class="hint">{{localize "FVTT_PROTOTYPES.Fields.VariantHint"}}</p>
  </div>

  <div class="form-group">
    <label for="iterations">{{localize "FVTT_PROTOTYPES.Fields.Iterations"}}</label>
    <div class="form-fields">
      <input type="number" name="iterations" id="iterations"
             value="{{iterations}}" min="1" max="100" step="1" />
      <span class="sep">&mdash;</span>
      <select name="displayMode">
        {{#each displayModes as |label key|}}
        <option value="{{key}}" {{#if (eq key ../displayMode)}}selected{{/if}}>
          {{localize label}}
        </option>
        {{/each}}
      </select>
    </div>
  </div>

  <div class="form-group">
    <label>{{localize "FVTT_PROTOTYPES.Fields.Config"}}</label>
    <div class="form-fields">
      <label class="checkbox">
        <input type="checkbox" name="config.autoRoll"
               {{#if config.autoRoll}}checked{{/if}} />
        {{localize "FVTT_PROTOTYPES.Fields.AutoRoll"}}
      </label>
    </div>
  </div>

  <div class="form-group">
    <label for="opacity">{{localize "FVTT_PROTOTYPES.Fields.Opacity"}}</label>
    <div class="form-fields">
      <input type="range" name="config.opacity" id="opacity"
             value="{{config.opacity}}" min="0" max="1" step="0.1" />
      <span class="range-value">{{config.opacity}}</span>
    </div>
  </div>
</section>
```

### Live Range Slider Update

```js
// In an ApplicationV2 subclass
_onRender(context, options) {
  super._onRender(context, options);
  const form = this.element;

  // Live-update the range value display
  const rangeInput = form.querySelector('input[name="config.opacity"]');
  const rangeDisplay = form.querySelector('.range-value');
  rangeInput?.addEventListener('input', (e) => {
    rangeDisplay.textContent = parseFloat(e.target.value).toFixed(1);
  });
}
```

## Dialog Patterns

### Confirmation Dialog

```js
// Reusable confirmation dialog using Foundry's Dialog API
async function confirmAction(title, content, yesLabel = 'Confirm') {
  return foundry.applications.api.DialogV2.confirm({
    window: { title },
    content: `<p>${content}</p>`,
    yes: {
      label: yesLabel,
      icon: 'fas fa-check'
    },
    no: {
      label: game.i18n.localize('Cancel'),
      icon: 'fas fa-times'
    }
  });
}

// Usage
const confirmed = await confirmAction(
  game.i18n.localize('FVTT_PROTOTYPES.Dialog.ResetTitle'),
  game.i18n.localize('FVTT_PROTOTYPES.Dialog.ResetConfirm')
);
if (confirmed) await resetPrototypeData(actor);
```

### Prompt Dialog with Input

```js
async function promptForVariantName(currentName = '') {
  return foundry.applications.api.DialogV2.prompt({
    window: {
      title: game.i18n.localize('FVTT_PROTOTYPES.Dialog.VariantTitle')
    },
    content: `
      <div class="form-group">
        <label>${game.i18n.localize('FVTT_PROTOTYPES.Fields.Variant')}</label>
        <input type="text" name="variant" value="${currentName}"
               autofocus maxlength="100" />
      </div>
    `,
    ok: {
      label: game.i18n.localize('Save'),
      icon: 'fas fa-save',
      callback: (event, button, dialog) => {
        return button.form.elements.variant.value;
      }
    }
  });
}
```

## Sheet Injection Patterns

### Adding a Tab to an Existing Sheet

```js
export function onRenderActorSheet(app, html, data) {
  const actor = app.document;
  if (!actor.testUserPermission(game.user, 'LIMITED')) return;

  const protoData = actor.getFlag('fvtt-prototypes', 'prototypeData') ?? {};

  // Create tab button
  const tabBtn = document.createElement('a');
  tabBtn.classList.add('item');
  tabBtn.dataset.tab = 'prototypes';
  tabBtn.dataset.group = 'primary';
  tabBtn.innerHTML = `<i class="fas fa-flask"></i> Prototypes`;

  // Create tab content
  const tabContent = document.createElement('div');
  tabContent.classList.add('tab', 'fvtt-prototypes--tab');
  tabContent.dataset.tab = 'prototypes';
  tabContent.dataset.group = 'primary';
  tabContent.innerHTML = buildTabHTML(protoData, actor.isOwner);

  // Inject into sheet
  const nav = html[0].querySelector('.sheet-tabs');
  const body = html[0].querySelector('.sheet-body');
  if (nav && body) {
    nav.appendChild(tabBtn);
    body.appendChild(tabContent);
  }

  // Bind event listeners on injected content
  bindPrototypeListeners(tabContent, actor);
}

function buildTabHTML(data, canEdit) {
  return `
    <div class="fvtt-prototypes--panel">
      <div class="fvtt-prototypes--panel__header">
        <h3>Prototype Data</h3>
        ${canEdit ? '<button type="button" class="fvtt-prototypes--edit-btn"><i class="fas fa-edit"></i></button>' : ''}
      </div>
      <div class="fvtt-prototypes--panel__content">
        <div class="fvtt-prototypes--field">
          <span class="fvtt-prototypes--field__label">Variant</span>
          <span class="fvtt-prototypes--field__value">${data.variant || '—'}</span>
        </div>
        <div class="fvtt-prototypes--field">
          <span class="fvtt-prototypes--field__label">Iterations</span>
          <span class="fvtt-prototypes--field__value">${data.iterations ?? 0}</span>
        </div>
      </div>
    </div>
  `;
}
```

### Adding Header Buttons

```js
Hooks.on('getActorSheetHeaderButtons', (app, buttons) => {
  if (!game.user.isGM) return;

  buttons.unshift({
    class: 'fvtt-prototypes--header-btn',
    icon: 'fas fa-flask',
    label: 'Prototypes',
    onclick: () => {
      new PrototypeConfig(app.document).render(true);
    }
  });
});
```

## Notification Patterns

```js
// Informational — auto-dismisses after 4 seconds
ui.notifications.info('Prototype saved successfully.');

// Warning — stays longer, yellow accent
ui.notifications.warn('No prototype data found on this actor.');

// Error — stays until dismissed, red accent
ui.notifications.error('Failed to save prototype data. Check the console for details.');

// With localization
ui.notifications.info(
  game.i18n.format('FVTT_PROTOTYPES.Notify.Saved', { name: actor.name })
);
```

## Data Display Patterns

### Read-Only Data Table

```handlebars
{{!-- templates/data-table.hbs --}}
<table class="fvtt-prototypes--table">
  <thead>
    <tr>
      <th>{{localize "FVTT_PROTOTYPES.Table.Name"}}</th>
      <th>{{localize "FVTT_PROTOTYPES.Table.Variant"}}</th>
      <th>{{localize "FVTT_PROTOTYPES.Table.Status"}}</th>
      {{#if isGM}}<th>{{localize "FVTT_PROTOTYPES.Table.Actions"}}</th>{{/if}}
    </tr>
  </thead>
  <tbody>
    {{#each prototypes}}
    <tr data-actor-id="{{this.actorId}}">
      <td>
        <img src="{{this.img}}" width="24" height="24" class="fvtt-prototypes--table__img" />
        {{this.name}}
      </td>
      <td>{{this.variant}}</td>
      <td>
        <span class="fvtt-prototypes--badge fvtt-prototypes--badge--{{this.status}}">
          {{this.status}}
        </span>
      </td>
      {{#if ../isGM}}
      <td>
        <button type="button" data-action="editPrototype" data-actor-id="{{this.actorId}}">
          <i class="fas fa-edit"></i>
        </button>
      </td>
      {{/if}}
    </tr>
    {{/each}}
  </tbody>
</table>
```

### Badge Styles

```css
.fvtt-prototypes--badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.fvtt-prototypes--badge--active {
  background: rgba(46, 204, 113, 0.2);
  color: #27ae60;
}

.fvtt-prototypes--badge--draft {
  background: rgba(241, 196, 15, 0.2);
  color: #f39c12;
}

.fvtt-prototypes--badge--archived {
  background: rgba(149, 165, 166, 0.2);
  color: #7f8c8d;
}
```

## Canvas Interaction

### Token HUD Extension

```js
Hooks.on('renderTokenHUD', (hud, html, data) => {
  const token = hud.object;
  const actor = token.actor;
  if (!actor?.getFlag('fvtt-prototypes', 'prototypeData')) return;

  const btn = document.createElement('div');
  btn.classList.add('control-icon', 'fvtt-prototypes--token-btn');
  btn.dataset.action = 'togglePrototype';
  btn.setAttribute('aria-label', 'Toggle Prototype');
  btn.innerHTML = '<i class="fas fa-flask"></i>';

  btn.addEventListener('click', () => {
    new PrototypeConfig(actor).render(true);
  });

  html[0].querySelector('.col.right').appendChild(btn);
});
```

## Decision History & Trade-offs

### Handlebars vs. Lit/JSX Templates

**Chosen**: Handlebars templates.
**Why**: Foundry's Application V2 framework is built around Handlebars. Using an alternative templating engine requires fighting the framework and adds build complexity.
**Trade-off**: Handlebars lacks reactive data binding — re-renders replace the full template output. For dynamic UIs, use `_onRender()` to attach vanilla JS event listeners.

### Injecting into Existing Sheets vs. Replacing Sheets

**Chosen**: Injection via render hooks.
**Why**: Non-destructive. Works with any game system's sheets. Users keep their preferred sheet and the module adds to it. If the module is disabled, sheets return to normal.
**Trade-off**: Injected content can break if the base sheet's DOM structure changes between system versions. Test against target system updates.

## Related Documents

| Document | Relevance |
|----------|-----------|
| [overview.md](overview.md) | Component architecture and design tokens |
| [../api/examples.md](../api/examples.md) | Full ApplicationV2 class implementation |
| [../auth/integration.md](../auth/integration.md) | Permission-conditional rendering |
| [../architecture/patterns.md](../architecture/patterns.md) | Debounced handlers, error patterns |
