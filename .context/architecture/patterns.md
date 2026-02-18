# Architecture: Implementation Patterns

> Code organization, error handling, design patterns, and coding conventions.

## Code Organization

### File & Directory Structure

```
scripts/
├── main.js                  # Entry point — imports and hook registration only
├── settings.js              # game.settings.register() calls
├── constants.js             # Module ID, flag keys, socket events
├── hooks/
│   ├── index.js             # Hook registration orchestrator
│   ├── init.js              # init-phase handlers
│   ├── ready.js             # ready-phase handlers
│   └── render-actor-sheet.js
├── apps/
│   ├── PrototypeConfig.js   # ApplicationV2 subclass
│   └── PrototypeDialog.js   # Dialog wrapper
├── models/
│   ├── PrototypeData.js     # DataModel subclass
│   └── fields.js            # Reusable schema field definitions
└── utils/
    ├── dom.js               # DOM manipulation helpers
    └── logging.js           # Namespaced console logging
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `render-actor-sheet.js` |
| Classes | PascalCase | `PrototypeConfig` |
| Functions | camelCase | `registerSettings` |
| Constants | SCREAMING_SNAKE | `MODULE_ID` |
| CSS classes | BEM with module prefix | `.fvtt-prototypes--panel__header` |
| Flags | camelCase keys | `getFlag('fvtt-prototypes', 'prototypeData')` |
| Hooks | camelCase with module prefix | `fvttPrototypes.dataReady` |
| Localization | SCREAMING_SNAKE dotted | `FVTT_PROTOTYPES.Settings.EnableFeature` |

## Constants Module

Centralize magic strings to avoid typos and enable refactoring:

```js
// scripts/constants.js
export const MODULE_ID = 'fvtt-prototypes';
export const SOCKET_NAME = `module.${MODULE_ID}`;

export const FLAGS = {
  PROTOTYPE_DATA: 'prototypeData',
  CONFIG_VERSION: 'configVersion'
};

export const SETTINGS = {
  ENABLE_FEATURE: 'enableFeature',
  DEBUG_MODE: 'debugMode'
};

export const TEMPLATES = {
  CONFIG: `modules/${MODULE_ID}/templates/config.hbs`,
  DIALOG: `modules/${MODULE_ID}/templates/dialog.hbs`
};
```

## Error Handling

### Foundry-Aware Error Pattern

Foundry provides `ui.notifications` for user-facing errors. Use structured error handling that separates developer logging from user feedback:

```js
// scripts/utils/logging.js
import { MODULE_ID } from '../constants.js';

export function log(message, ...args) {
  console.log(`${MODULE_ID} |`, message, ...args);
}

export function warn(message, ...args) {
  console.warn(`${MODULE_ID} |`, message, ...args);
}

export function error(message, ...args) {
  console.error(`${MODULE_ID} |`, message, ...args);
}

export function notifyError(userMessage, devMessage, err) {
  ui.notifications.error(`fvtt-prototypes: ${userMessage}`);
  error(devMessage, err);
}
```

### Safe Hook Execution

Wrap hook callbacks to prevent one module error from breaking Foundry's hook chain:

```js
// scripts/hooks/render-actor-sheet.js
import { notifyError } from '../utils/logging.js';

export function onRenderActorSheet(app, html, data) {
  try {
    injectPrototypeControls(app, html, data);
  } catch (err) {
    notifyError(
      'Failed to render prototype controls.',
      'Error in onRenderActorSheet',
      err
    );
  }
}
```

### Async Operation Pattern

For operations that interact with the server (document updates, socket calls):

```js
async function updatePrototypeFlag(actor, key, value) {
  try {
    await actor.setFlag('fvtt-prototypes', key, value);
    log(`Updated flag "${key}" on actor ${actor.name}`);
  } catch (err) {
    notifyError(
      `Could not save changes to ${actor.name}.`,
      `setFlag failed for ${actor.id}`,
      err
    );
  }
}
```

## Design Patterns

### Module Singleton

Store module-level state in a single namespace to avoid polluting globals:

```js
// scripts/main.js
import { MODULE_ID } from './constants.js';

Hooks.once('init', () => {
  game.modules.get(MODULE_ID).api = {
    getPrototypeData: (actor) => actor.getFlag(MODULE_ID, 'prototypeData'),
    version: '1.0.0'
  };
});
```

Other modules can then access `game.modules.get('fvtt-prototypes').api`.

### Debounced Input Handler

For live-updating UI controls that write to documents:

```js
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// In an Application class
activateListeners(html) {
  super.activateListeners(html);
  const input = html.find('.fvtt-prototypes--search');
  input.on('input', debounce((event) => {
    this.filterResults(event.target.value);
  }));
}
```

### Socket Action Dispatcher

Structure socket messages with typed actions to avoid a monolithic handler:

```js
// scripts/socket.js
import { SOCKET_NAME } from './constants.js';
import { log } from './utils/logging.js';

const handlers = new Map();

export function registerSocketHandler(action, fn) {
  handlers.set(action, fn);
}

export function initSocket() {
  game.socket.on(SOCKET_NAME, ({ action, payload, userId }) => {
    const handler = handlers.get(action);
    if (handler) {
      log(`Socket received: ${action} from ${userId}`);
      handler(payload, userId);
    }
  });
}

export function emitSocket(action, payload) {
  game.socket.emit(SOCKET_NAME, {
    action,
    payload,
    userId: game.user.id
  });
}
```

### Preloading Templates

Register Handlebars templates during `init` so they're cached before first use:

```js
// scripts/hooks/init.js
import { TEMPLATES } from '../constants.js';

export function onInit() {
  loadTemplates(Object.values(TEMPLATES));
}
```

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Do This Instead |
|-------------|-------------|-----------------|
| Modifying `CONFIG` after `init` | Foundry freezes config; changes are ignored | Register during `init` hook |
| Storing state in module-scope variables | Lost on re-render, not synced across clients | Use flags or settings |
| Calling `document.update()` in render hooks | Triggers re-render loop | Use a separate button/action handler |
| Directly mutating `document.system` | Bypasses validation and server sync | Use `document.update({ system: { ... } })` |
| Importing from `node_modules` without Vite | Foundry cannot resolve bare specifiers | Bundle with Vite or use Foundry globals |

## Decision History & Trade-offs

### Constants Module vs. Inline Strings

**Chosen**: Centralized constants module.
**Why**: Eliminates typo-related bugs in flag keys, setting names, and template paths. Single source of truth for all identifiers.
**Trade-off**: One extra import per file. Worth it for any project beyond a single-file script.

### Try-Catch in Hook Callbacks vs. Global Error Handler

**Chosen**: Per-callback try-catch with `notifyError`.
**Why**: Foundry does not expose a module-level error boundary. An unhandled error in a hook callback prevents subsequent hooks from firing for all modules.
**Trade-off**: Boilerplate in every hook handler. Consider a wrapper function like `safeHook(fn)` if callbacks multiply.

### Map-Based Socket Dispatcher vs. Switch Statement

**Chosen**: `Map` with `registerSocketHandler`.
**Why**: Scales cleanly as actions grow. Each feature registers its own handler without modifying a central switch. Testable in isolation.
**Trade-off**: Slightly more indirection than a flat switch. Acceptable given the decoupling benefits.

## Related Documents

| Document | Relevance |
|----------|-----------|
| [overview.md](overview.md) | Architecture layers these patterns implement |
| [dependencies.md](dependencies.md) | Foundry utilities used in patterns |
| [../api/examples.md](../api/examples.md) | API usage following these patterns |
| [../auth/integration.md](../auth/integration.md) | Permission checks in pattern implementations |
