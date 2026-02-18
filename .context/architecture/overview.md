# Architecture: System Overview

> Module architecture, lifecycle hooks, layer boundaries, and system design.

## Architecture Diagram

```mermaid
graph TD
    subgraph "Foundry VTT Core"
        CORE[Foundry Server<br/>Node.js + Express]
        DB[(NeDB / LevelDB<br/>World Data)]
        SOCKET[Socket.io<br/>Real-time Sync]
    end

    subgraph "Client Browser"
        subgraph "Module Layer — fvtt-prototypes"
            MAIN[main.js<br/>Entry Point]
            HOOKS[Hook Handlers<br/>init / setup / ready]
            APPS[Application V2<br/>Sheets & Dialogs]
            DATA[DataModel<br/>Custom Schemas]
            SETTINGS[Settings API<br/>Module Config]
        end

        subgraph "Foundry Client Core"
            GAME[game Object<br/>Global State]
            CANVAS[Canvas<br/>Pixi.js Renderer]
            SIDEBAR[Sidebar<br/>Tab Navigation]
            DOCS[Document Classes<br/>Actor, Item, Scene]
        end
    end

    CORE -->|WebSocket| SOCKET
    SOCKET -->|Document Updates| GAME
    GAME --> DOCS
    GAME --> CANVAS
    GAME --> SIDEBAR

    MAIN -->|Hooks.once init| HOOKS
    HOOKS -->|register| SETTINGS
    HOOKS -->|extend| DOCS
    HOOKS -->|inject| APPS
    APPS -->|read/write| DATA
    DATA -->|flags| DOCS
    APPS -->|render| CANVAS
```

## Architectural Layers

### 1. Entry Layer (`scripts/main.js`)

The single entry point registered in `module.json`. Responsible only for importing sub-modules and registering top-level hooks. No business logic lives here.

```js
// scripts/main.js
import { registerSettings } from './settings.js';
import { registerHooks } from './hooks/index.js';

Hooks.once('init', () => {
  console.log('fvtt-prototypes | Initializing module');
  registerSettings();
  registerHooks();
});
```

### 2. Hook Layer (`scripts/hooks/`)

Handlers organized by lifecycle phase. Each file exports functions that are registered during `init` and invoked by Foundry at the appropriate time.

```js
// scripts/hooks/index.js
import { onReady } from './ready.js';
import { onRenderActorSheet } from './render-actor-sheet.js';

export function registerHooks() {
  Hooks.once('ready', onReady);
  Hooks.on('renderActorSheet', onRenderActorSheet);
}
```

### 3. Application Layer (`scripts/apps/`)

UI components extending `foundry.applications.api.ApplicationV2` (V12+) or `Application` (legacy). Each application class pairs with a Handlebars template in `templates/`.

### 4. Data Layer (`scripts/models/`)

Custom `DataModel` subclasses that define schemas for flags or custom document types. Validation and defaults are declared here.

## Module Lifecycle — Detailed

```mermaid
sequenceDiagram
    participant F as Foundry Core
    participant M as fvtt-prototypes
    participant U as User Browser

    F->>M: Load esmodules (main.js)
    M->>M: Import sub-modules
    F->>M: Fire "init" hook
    M->>M: registerSettings()
    M->>M: registerHooks()
    M->>M: Register DataModels
    F->>M: Fire "setup" hook
    Note over M: World data now available
    M->>M: Configure world-dependent state
    F->>M: Fire "ready" hook
    M->>M: Initialize UI components
    M->>U: Module fully loaded
    U->>F: Open Actor Sheet
    F->>M: Fire "renderActorSheet" hook
    M->>U: Inject custom HTML
```

### Hook Execution Order

| Phase | Hook | Safe To Do | Not Safe Yet |
|-------|------|-----------|-------------|
| 1 | `init` | Register settings, models, sheets | Access `game.actors`, world data |
| 2 | `setup` | Read world config, register based on system | Render UI, access canvas |
| 3 | `ready` | All operations, UI, canvas, documents | N/A — everything is available |
| 4 | `render*` | Modify rendered HTML, inject controls | Change data (causes re-render loop) |

## Build Pipeline

```mermaid
graph LR
    SRC[scripts/*.js<br/>styles/*.css<br/>templates/*.hbs] --> VITE[Vite Dev Server<br/>HMR + Watch]
    VITE --> DIST[dist/<br/>Bundled Output]
    DIST --> FVTT[Foundry VTT<br/>Data/modules/fvtt-prototypes]
    SRC -->|No build needed| FVTT_DEV[Foundry Dev<br/>Symlink to src]
```

Two development modes:

- **Symlink mode** (no build): Symlink `scripts/` directly into Foundry's modules directory. Foundry loads ES modules natively.
- **Vite mode** (bundled): Vite bundles and outputs to `dist/`. Use this when importing npm packages or TypeScript.

## Performance Considerations

- **Hook registration**: Use `Hooks.once()` for one-time setup to avoid repeated execution.
- **Render hooks**: Keep render hook callbacks fast (< 5ms). Defer heavy DOM manipulation with `requestAnimationFrame`.
- **Socket messages**: Minimize payload size. Foundry broadcasts to all clients — large payloads degrade performance for every connected user.
- **Canvas operations**: Batch Pixi.js draw calls. Use `canvas.app.renderer.render()` only when necessary.

## Decision History & Trade-offs

### Hook-Driven Architecture vs. Class Inheritance

**Chosen**: Hook-driven composition.
**Why**: Foundry's extension model is hook-based. Modules cannot subclass core classes directly — they intercept lifecycle events and inject behavior. This is not a choice but a platform constraint.
**Trade-off**: Less control over execution order between modules. Use hook priorities (numeric parameter) when ordering matters.

### ES Modules vs. Global Scripts

**Chosen**: ES modules (`esmodules` in manifest).
**Why**: Provides proper scoping, avoids global namespace pollution, enables `import`/`export` for code organization.
**Trade-off**: Slightly more complex debugging (module scope in browser DevTools), but the isolation benefits far outweigh this.

### Vite vs. No Build Step

**Chosen**: Vite as optional build tool.
**Why**: Enables TypeScript support, npm package imports, and HMR during development. Falls back to native ES modules for simplicity when no build is needed.
**Trade-off**: Adds a build step and `node_modules`. For pure JS prototyping, symlink mode avoids this complexity entirely.

## Related Documents

| Document | Relevance |
|----------|-----------|
| [dependencies.md](dependencies.md) | Vite config, Foundry VTT Types, npm packages |
| [patterns.md](patterns.md) | Code conventions, error handling, design patterns |
| [../api/endpoints.md](../api/endpoints.md) | Available Foundry APIs for each layer |
| [../database/schema.md](../database/schema.md) | Data model architecture and schemas |
