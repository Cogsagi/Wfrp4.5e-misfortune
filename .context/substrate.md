# fvtt-prototypes — Substrate

> Entry point for project documentation. Start here, then navigate by domain.

## What Is This Project?

fvtt-prototypes is a Foundry Virtual Tabletop module for prototyping and experimenting with custom VTT functionality. It extends Foundry's core platform through the Hooks API, Application V2 class framework, and Module API. The module is built with JavaScript (ES6+) using ES modules, with optional TypeScript support via Foundry VTT Types. Vite handles development builds and hot-module replacement during local development.

## Navigation

### Core Domains

| Document | Purpose |
|----------|---------|
| [`architecture/overview.md`](architecture/overview.md) | System architecture, lifecycle hooks, Mermaid diagrams |
| [`architecture/dependencies.md`](architecture/dependencies.md) | Dependency management, Vite config, Foundry VTT Types |
| [`architecture/patterns.md`](architecture/patterns.md) | Code organization, error handling, design patterns |
| [`api/endpoints.md`](api/endpoints.md) | Foundry Document API, Settings API, Socket API reference |
| [`api/headers.md`](api/headers.md) | Module manifest configuration and metadata |
| [`api/examples.md`](api/examples.md) | Practical integration examples with Foundry APIs |
| [`database/schema.md`](database/schema.md) | Foundry document schema and data model ERDs |
| [`database/models.md`](database/models.md) | Custom DataModel definitions and validation |
| [`database/migrations.md`](database/migrations.md) | Data migration strategy across Foundry versions |
| [`auth/overview.md`](auth/overview.md) | Foundry permission model and user roles |
| [`auth/integration.md`](auth/integration.md) | Permission checks in module code |
| [`auth/security.md`](auth/security.md) | Security model and threat mitigation |
| [`ui/overview.md`](ui/overview.md) | Application V2, design tokens, component architecture |
| [`ui/patterns.md`](ui/patterns.md) | Forms, dialogs, sheet injection, canvas layers |
| [`seo/overview.md`](seo/overview.md) | Module discoverability, manifest metadata, package listing |
| [`guidelines.md`](guidelines.md) | Git workflow, testing, deployment procedures |

### Quick Reference

```bash
# Read the architecture overview
cat .context/architecture/overview.md

# Check API patterns for Document manipulation
cat .context/api/examples.md

# Review permission model before adding user-facing features
cat .context/auth/overview.md

# Understand data model before creating custom documents
cat .context/database/schema.md
```

## Using as AI Context

### Code Generation

When generating new module features, load these files first:

```
.context/substrate.md          → Module identity and conventions
.context/architecture/patterns.md → Code patterns and error handling
.context/api/examples.md       → API integration examples
.context/ui/patterns.md        → UI implementation patterns
```

### Code Review

When reviewing changes to this module:

```
.context/guidelines.md         → Coding standards and commit conventions
.context/auth/security.md      → Security requirements
.context/architecture/overview.md → Architectural constraints
```

### Architecture Decisions

When evaluating design choices:

```
.context/architecture/overview.md    → System design rationale
.context/database/schema.md          → Data model decisions
.context/architecture/dependencies.md → Dependency choices
```

## Key Concepts

- **Module Manifest** (`module.json`): Declares the module's identity, compatibility range, entry scripts, styles, languages, and dependencies to Foundry VTT.
- **Hooks API**: Foundry's event system. Modules use `Hooks.on()` and `Hooks.once()` to react to lifecycle events (`init`, `setup`, `ready`) and application events (`renderApplication`, `updateActor`).
- **Documents & DataModel**: Foundry's persistence layer. Actors, Items, Scenes, and JournalEntries are "Documents" backed by a schema-driven `DataModel` class.
- **Application V2 (AppV2)**: Foundry's modern UI framework for rendering sheets, dialogs, and sidebars using Handlebars templates with reactive data binding.
- **Flags**: Key-value storage scoped to a module on any Document, accessed via `document.getFlag()` / `document.setFlag()`.

## Module Identity

| Property | Value |
|----------|-------|
| Module ID | `fvtt-prototypes` |
| Namespace prefix | `fvtt-prototypes` |
| Target platform | Foundry VTT V12+ |
| Build tool | Vite |
| Type support | `@league-of-foundry-developers/foundry-vtt-types` |

## Conventions

- All module scripts use ES module syntax (`import`/`export`).
- CSS classes are prefixed with the module ID: `.fvtt-prototypes--element`.
- Flags use the module ID as scope: `doc.getFlag('fvtt-prototypes', 'key')`.
- Socket events are namespaced: `module.fvtt-prototypes`.
- Hook callbacks registered by this module use descriptive names prefixed with the module ID.
- Localization keys follow `FVTT_PROTOTYPES.Section.Key` format.

## Recommended Reading Order

### For New Contributors

1. This file (substrate.md)
2. `architecture/overview.md` — understand the lifecycle
3. `architecture/patterns.md` — learn the code conventions
4. `guidelines.md` — development workflow

### For Feature Development

1. `api/endpoints.md` — available Foundry APIs
2. `database/models.md` — data model patterns
3. `ui/patterns.md` — UI implementation
4. `auth/integration.md` — permission checks

### For Security Review

1. `auth/overview.md` — permission model
2. `auth/security.md` — threat model
3. `api/headers.md` — manifest and trust boundaries

## Extending This Documentation

When adding a new domain:

1. Create a directory under `.context/` with an `overview.md` entry point.
2. Add the domain to the Navigation table above.
3. Cross-reference related documents at the bottom of each new file.
4. Include a "Decision History & Trade-offs" section explaining architectural choices.
5. Update `CLAUDE.md` to reflect the new documentation index.
