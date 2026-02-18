# Architecture: Dependencies

> Dependency management, Vite configuration, Foundry VTT Types, and approved packages.

## Dependency Overview

```mermaid
graph TD
    subgraph "Runtime (loaded by Foundry)"
        FVTT[Foundry VTT Core APIs]
        PIXI[Pixi.js v7 — Canvas Rendering]
        PROSEMIRROR[ProseMirror — Rich Text]
        SOCKETIO[Socket.io — Real-time]
        HANDLEBAR[Handlebars — Templating]
    end

    subgraph "Dev Dependencies (npm)"
        VITE[Vite — Build & HMR]
        FVTT_TYPES[@league-of-foundry-developers<br/>foundry-vtt-types]
        ESLINT[ESLint — Linting]
        PRETTIER[Prettier — Formatting]
    end

    subgraph "Module Code"
        SRC[scripts/*.js]
    end

    SRC -->|imports from| FVTT
    SRC -->|rendered by| HANDLEBAR
    SRC -->|type hints| FVTT_TYPES
    VITE -->|bundles| SRC
```

## Runtime Dependencies

These are provided by Foundry VTT at runtime. **Do not install them via npm** — they exist in the global scope or as Foundry imports.

| Library | Global/Import | Version (V12) | Used For |
|---------|---------------|---------------|----------|
| Pixi.js | `PIXI` | 7.x | Canvas rendering, sprites, containers |
| Socket.io | `game.socket` | 4.x | Client-server real-time communication |
| Handlebars | `Handlebars` | 4.x | Template compilation and rendering |
| ProseMirror | `foundry.prosemirror` | — | Rich text editing in journals/sheets |
| jQuery | `$` / `jQuery` | 3.x | DOM manipulation (legacy, prefer native) |

### Accessing Runtime Libraries

```js
// Canvas rendering — Pixi.js is globally available
const sprite = new PIXI.Sprite(texture);
canvas.stage.addChild(sprite);

// Socket communication — via game object
game.socket.emit('module.fvtt-prototypes', payload);

// Template rendering — Handlebars is globally available
const compiled = Handlebars.compile(templateString);
const html = compiled(data);
```

## Development Dependencies

### Package Configuration

```json
{
  "name": "fvtt-prototypes",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint scripts/",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@league-of-foundry-developers/foundry-vtt-types": "^12.0.0",
    "vite": "^6.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.5.0"
  }
}
```

### Vite Configuration

```js
// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'scripts/main.js'),
      formats: ['es'],
      fileName: 'main'
    },
    rollupOptions: {
      // Foundry globals — do not bundle these
      external: [/^foundry/, /^socket\.io/]
    }
  },
  server: {
    port: 30001,
    proxy: {
      // Proxy to local Foundry instance for HMR
      '/': {
        target: 'http://localhost:30000',
        ws: true
      }
    }
  }
});
```

### Foundry VTT Types

Type definitions provide IntelliSense and type checking without adding runtime overhead.

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "allowJs": true,
    "checkJs": true,
    "noEmit": true,
    "strict": true,
    "types": ["@league-of-foundry-developers/foundry-vtt-types"]
  },
  "include": ["scripts/**/*"]
}
```

Usage in JS files with JSDoc annotations:

```js
/**
 * @param {Actor} actor - The actor document to process
 * @param {string} flagKey - The flag key to read
 * @returns {unknown}
 */
function getPrototypeFlag(actor, flagKey) {
  return actor.getFlag('fvtt-prototypes', flagKey);
}
```

## Approved External Packages

Modules should minimize external dependencies since Foundry provides most utilities. If an npm package is required, it must be bundled via Vite — Foundry cannot resolve `node_modules` imports.

| Package | Status | Rationale |
|---------|--------|-----------|
| `color` | Approved | Color manipulation beyond CSS variables |
| `uuid` | Avoid | Use `foundry.utils.randomID()` instead |
| `lodash` | Avoid | Use `foundry.utils.mergeObject`, `duplicate`, `getProperty` |
| `jquery` | Avoid importing | Already globally available via Foundry |
| `socket.io-client` | Forbidden | Conflicts with Foundry's built-in socket |

### Rule: Prefer Foundry Utilities

Before adding an npm package, check if Foundry provides an equivalent:

```js
// Instead of lodash.merge
foundry.utils.mergeObject(target, source, { recursive: true });

// Instead of structuredClone or lodash.cloneDeep
foundry.utils.duplicate(data);

// Instead of lodash.get
foundry.utils.getProperty(obj, 'nested.path.value');

// Instead of uuid
foundry.utils.randomID();    // 16-char alphanumeric
```

## Module Dependencies

Declare dependencies on other Foundry modules in `module.json`:

```json
{
  "relationships": {
    "requires": [
      {
        "id": "lib-wrapper",
        "type": "module",
        "compatibility": { "minimum": "1.12.0.0" }
      }
    ],
    "recommends": [
      {
        "id": "socketlib",
        "type": "module",
        "reason": "Simplified socket communication patterns"
      }
    ]
  }
}
```

## Decision History & Trade-offs

### Vite Over Webpack/Rollup

**Chosen**: Vite.
**Why**: Fastest HMR in development. Native ES module support aligns with Foundry's module loading. Rollup under the hood produces optimized production builds.
**Trade-off**: Less ecosystem maturity than Webpack for complex configurations, but Foundry modules rarely need complex bundling.

### Optional TypeScript via JSDoc

**Chosen**: JavaScript with JSDoc type annotations checked by TypeScript.
**Why**: Keeps the zero-build-step path viable. Developers get IntelliSense and type checking without committing to a full TypeScript compile step.
**Trade-off**: JSDoc types are more verbose than native TypeScript syntax. Complex generic types are harder to express.

### Minimizing npm Dependencies

**Chosen**: Prefer Foundry built-in utilities over npm packages.
**Why**: Every bundled dependency increases module size and risk of version conflicts. Foundry already ships with robust utilities for common operations.
**Trade-off**: Foundry's utility API surface is smaller than lodash — some operations require more manual code.

## Related Documents

| Document | Relevance |
|----------|-----------|
| [overview.md](overview.md) | Build pipeline and architecture layers |
| [patterns.md](patterns.md) | How dependencies are used in practice |
| [../api/headers.md](../api/headers.md) | Module manifest dependency declarations |
| [../guidelines.md](../guidelines.md) | Dependency approval workflow |
