# CLAUDE.md

## Project Overview

wfrp4e-misfortune is a Foundry Virtual Tabletop (VTT) module that implements a homebrew GM metacurrency for Warhammer Fantasy Roleplay 4th Edition. When a non-GM player rolls an 88 on a d100 test, the GM gains a Misfortune point that can be spent to reroll any NPC test.

## Tech Stack

- **Language**: JavaScript (ES Modules)
- **Platform**: Foundry VTT V13+ (module)
- **Game System**: WFRP4e v9.0.0+

## Documentation Index

| File | Purpose |
|------|---------|
| `.context/substrate.md` | **Start here.** Project overview, key concepts, and conventions. |
| `.context/architecture/overview.md` | Module lifecycle, directory layout, and component patterns. |

## Project Structure

```
/
├── .context/                  # Structured project documentation
│   ├── substrate.md           # Entry point — project overview
│   └── architecture/
│       └── overview.md        # Architecture and patterns
├── module.json                # Foundry VTT module manifest
├── scripts/
│   ├── main.js                # Entry point — hook registration and API
│   ├── constants.js           # Module ID, setting keys, thematic messages
│   ├── settings.js            # Game settings registration
│   ├── misfortune-pool.js     # Pool management (get, add, spend, reset)
│   ├── chat-commands.js       # /misfortune and /mf commands
│   ├── socket.js              # Cross-client socket sync
│   ├── hooks/
│   │   └── roll-hooks.js      # WFRP4e roll test listeners (88 detection)
│   └── apps/
│       ├── tracker.js         # Floating tracker widget
│       └── log-viewer.js      # Event log Application class
├── styles/
│   └── module.css             # Grimdark-themed styles
├── templates/
│   └── log-viewer.hbs         # Handlebars template for event log
├── languages/
│   └── en.json                # English localization strings
└── CLAUDE.md
```

## Development

### Foundry VTT Module Basics

- `module.json` is the module manifest — it declares the module ID, compatibility, scripts, styles, and dependencies.
- Scripts are loaded by Foundry via the manifest; no build step is required for plain JS.
- Use Foundry's Hook system (`Hooks.on`, `Hooks.once`) to integrate with the application lifecycle.
- The WFRP4e system provides roll hooks (`wfrp4e:rollTest`, etc.) that this module listens to.

### Code Conventions

- Use ES module syntax (`import`/`export`).
- Follow Foundry VTT API patterns and naming conventions.
- Prefix CSS classes with the module ID: `.wfrp4e-misfortune--element`.
- All shared constants live in `scripts/constants.js`.
- Only the GM client processes roll hooks to prevent duplicate triggers.

## Instructions for Claude Code

### Before Generating Code
1. Read any relevant existing source files before making changes.
2. Follow patterns already established in the codebase.
3. Respect Foundry VTT API conventions and lifecycle hooks.

### Do Not
- Generate code without reading relevant source files first.
- Create new architectural patterns without documenting them.
- Ignore Foundry VTT API conventions or module namespacing.
- Assume implementation details not documented in the codebase.

### When Making Changes
- Keep `wfrp4e-misfortune--` prefix consistent across CSS classes.
- Ensure `module.json` stays in sync with any new scripts, styles, or dependencies.
- Update `scripts/constants.js` when adding new setting keys or message arrays.
- Test changes manually in a local Foundry VTT instance with the WFRP4e system.

## Testing

No automated test framework is configured. Test manually by loading the module in a local Foundry VTT instance with the WFRP4e system active.

## Useful Links

- [Foundry VTT API Documentation](https://foundryvtt.com/api/)
- [Foundry VTT Module Development Guide](https://foundryvtt.wiki/en/development/guides/getting-started)
- [WFRP4e System Repository](https://github.com/moo-man/WFRP4e-FoundryVTT)
