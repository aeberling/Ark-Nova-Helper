# Ark Nova Helper - Claude Code Instructions

## Before Implementing Features

Always consult the reference documentation at `.reference/game/` before making changes:

- **Game rules & mechanics**: `.reference/game/game-rules.md`
- **Card data & scoring definitions**: `.reference/game/card-data.md`
- **BGA DOM selectors & structure**: `.reference/game/bga-dom.md`
- **BGA code architecture**: `.reference/game/bga-code.md`
- **Extension module APIs & architecture**: `.reference/game/extension-architecture.md`
- **Current feature status**: `.reference/game/extension-features.md`
- **How to add features (patterns & recipes)**: `.reference/game/implementation-patterns.md`

See `.reference/game/INDEX.md` for a full index with quick-lookup guide.

## Project Structure

- `ark-nova-helper/` - Chrome extension source (manifest.json + content/ + icons/)
- `BGA-Game-Code/arknova/` - BGA open-source game code (read-only reference)
- `.reference/` - HTML/CSS snapshots, screenshots, and game documentation

## Code Conventions

- All modules use IIFE pattern exposing a single global object (e.g., `ArkScoringCards`)
- All CSS classes use `ank-` prefix to avoid BGA style conflicts
- MutationObserver callbacks are always debounced (250-300ms)
- Per-game localStorage keys use `ank-{key}-{tableId}` pattern
- Always null-check DOM queries since BGA may not have rendered elements yet
