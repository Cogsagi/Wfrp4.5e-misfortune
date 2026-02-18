# CLAUDE.md

## Project Overview

fvtt-prototypes is a Foundry Virtual Tabletop (VTT) module for prototyping custom functionality. Built with JavaScript (ES6+) using ES modules, with optional TypeScript support via Foundry VTT Types and Vite for development builds.

## Tech Stack

- **Language**: JavaScript (ES6+), optional TypeScript via JSDoc + `@league-of-foundry-developers/foundry-vtt-types`
- **Platform**: Foundry VTT V12+ (module)
- **Build Tool**: Vite (optional — symlink mode for pure JS)
- **Architecture**: Hooks API, Application V2, Module API

## Documentation Index

| File | Purpose |
|------|---------|
| `.context/substrate.md` | **Start here.** Project overview, navigation, AI usage patterns. |
| `.context/architecture/overview.md` | System architecture with Mermaid diagrams, lifecycle hooks. |
| `.context/architecture/dependencies.md` | Dependency management, Vite config, Foundry VTT Types. |
| `.context/architecture/patterns.md` | Code organization, error handling, design patterns. |
| `.context/api/endpoints.md` | Foundry Document API, Settings API, Socket API, Hook API. |
| `.context/api/headers.md` | Module manifest (`module.json`) configuration and fields. |
| `.context/api/examples.md` | Practical integration examples: settings, sheets, AppV2, sockets. |
| `.context/database/schema.md` | Foundry document schema, ERD diagrams, flag storage design. |
| `.context/database/models.md` | Custom DataModel definitions, validation, schema fields. |
| `.context/database/migrations.md` | Version-based data migration strategy and runner. |
| `.context/auth/overview.md` | Foundry permission model: roles, ownership, access control. |
| `.context/auth/integration.md` | Permission checks in UI, data, and socket layers. |
| `.context/auth/security.md` | Security model, threat mitigation, defensive coding. |
| `.context/ui/overview.md` | Application V2 framework, design tokens, CSS architecture. |
| `.context/ui/patterns.md` | Forms, dialogs, sheet injection, canvas interaction. |
| `.context/seo/overview.md` | Module discoverability, manifest metadata, publishing. |
| `.context/guidelines.md` | Git workflow, coding standards, testing, deployment. |

## Project Structure

```
/
├── .context/                    # Structured project documentation
│   ├── substrate.md             # Entry point — project overview
│   ├── guidelines.md            # Development workflow & standards
│   ├── architecture/
│   │   ├── overview.md          # System architecture
│   │   ├── dependencies.md      # Dependencies & build config
│   │   └── patterns.md          # Code patterns & error handling
│   ├── api/
│   │   ├── endpoints.md         # Foundry API reference
│   │   ├── headers.md           # Module manifest reference
│   │   └── examples.md          # Integration examples
│   ├── database/
│   │   ├── schema.md            # Document schema & ERDs
│   │   ├── models.md            # DataModel definitions
│   │   └── migrations.md        # Migration strategy
│   ├── auth/
│   │   ├── overview.md          # Permission model
│   │   ├── integration.md       # Permission implementation
│   │   └── security.md          # Security & threat model
│   ├── ui/
│   │   ├── overview.md          # Component architecture
│   │   └── patterns.md          # UI implementation patterns
│   └── seo/
│       └── overview.md          # Module discoverability
├── module.json                  # Foundry VTT module manifest
├── scripts/                     # JavaScript source files
├── styles/                      # CSS stylesheets
├── templates/                   # Handlebars/HTML templates
├── languages/                   # Localization files
└── CLAUDE.md
```

## Development

### Foundry VTT Module Basics

- `module.json` is the module manifest — it declares the module ID, compatibility, scripts, styles, and dependencies.
- Scripts are loaded by Foundry via the manifest; no build step is required for plain JS.
- Use Foundry's Hook system (`Hooks.on`, `Hooks.once`) to integrate with the application lifecycle.

### Code Conventions

- Use ES module syntax (`import`/`export`).
- Follow Foundry VTT API patterns and naming conventions.
- Prefix CSS classes and hook namespaces with the module ID to avoid collisions.
- See `.context/architecture/patterns.md` for detailed coding patterns.
- See `.context/guidelines.md` for git workflow and commit conventions.

## Instructions for Claude Code

### Before Generating Code
1. Read `.context/substrate.md` for project identity and conventions.
2. Read relevant `.context/` domain files for the feature area.
3. Read any relevant existing source files before making changes.
4. Follow patterns established in `.context/architecture/patterns.md`.
5. Respect Foundry VTT API conventions and lifecycle hooks.

### Do Not
- Generate code without reading relevant source files first.
- Create new architectural patterns without documenting them.
- Ignore Foundry VTT API conventions or module namespacing.
- Assume implementation details not documented in the codebase.
- Write to `document.system` — use flags instead (see `.context/database/schema.md`).
- Skip permission checks — see `.context/auth/integration.md`.

### When Making Changes
- Keep module ID prefixes consistent across CSS classes and hook namespaces.
- Ensure `module.json` stays in sync with any new scripts, styles, or dependencies.
- Wrap hook callbacks in try-catch (see `.context/architecture/patterns.md`).
- Validate permissions at UI and data layers (see `.context/auth/integration.md`).
- Test changes manually in a local Foundry VTT instance.

## Testing

No automated test framework is configured yet. Follow the manual testing protocol in `.context/guidelines.md`. Test manually by loading the module in a local Foundry VTT instance.

## Useful Links

- [Foundry VTT API Documentation](https://foundryvtt.com/api/)
- [Foundry VTT Module Development Guide](https://foundryvtt.wiki/en/development/guides/getting-started)
- [Foundry VTT Types](https://github.com/League-of-Foundry-Developers/foundry-vtt-types)
- [Vite Documentation](https://vitejs.dev/)
