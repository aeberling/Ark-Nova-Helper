# Chrome Extension Architecture

## Manifest (MV3)

```json
{
  "manifest_version": 3,
  "name": "Ark Nova Helper",
  "version": "0.1.0",
  "content_scripts": [{
    "matches": [
      "*://boardgamearena.com/*/arknova*",
      "*://boardgamearena.com/table/*"
    ],
    "js": [
      "content/scoring-cards.js",
      "content/card-highlighter.js",
      "content/conservation-tracker.js",
      "content/sidebar.js",
      "content/reminders.js",
      "content/project-cubes.js",
      "content/observer.js",
      "content/content.js"
    ],
    "css": ["content/content.css"],
    "run_at": "document_idle"
  }]
}
```

- **No permissions, no popup, no service worker** -- pure content script injection
- **No module bundler** -- each file is an IIFE that exposes a global object
- **Load order matters** -- dependencies must be loaded before dependents

---

## Module Dependency Graph

```
scoring-cards.js (ArkScoringCards)     -- no dependencies, pure data + DOM readers
conservation-tracker.js (ArkConservationTracker) -- no dependencies, reads DOM
observer.js (ArkObserver)              -- no dependencies, receives callbacks

card-highlighter.js (ArkCardHighlighter)
  depends on: ArkScoringCards, ArkSidebar

sidebar.js (ArkSidebar)
  depends on: ArkConservationTracker, ArkCardHighlighter

reminders.js (ArkReminders)
  depends on: none (reads DOM directly)

project-cubes.js (ArkProjectCubes)
  depends on: ArkConservationTracker, ArkSidebar

content.js (entry point)
  depends on: ALL modules
```

---

## Initialization Flow (`content.js`)

```
1. waitForGame()
   - Polls for #arknova-main-container every 500ms (up to 15s)
   - Waits 1s extra for DOM to settle

2. findPlayerId()
   - Scans #hand-{id} or #scoring-hand-{id} elements

3. ArkSidebar.create(playerId)
   - Builds bottom panel UI, injects into document.body

4. ArkSidebar.onToggleChange(refreshHighlights)
   - Wires checkbox changes to re-highlight

5. ArkCardHighlighter.snapshotPool()
   - Records current pool cards as "known" in localStorage

6. refreshAll()
   - Full cycle: detect scoring cards + highlight + reminders + cubes + sidebar

7. ArkObserver.init(playerId, callbacks)
   - Sets up MutationObservers on all relevant DOM elements
```

---

## Observer Callbacks

| DOM Target | Debounce | Callback | Triggers |
|-----------|----------|----------|----------|
| `#cards-pool` | 250ms | `onPoolChange` | `refreshHighlights()` |
| `#hand-{pId}` | 250ms | `onHandChange` | `refreshHighlights()` |
| `#floating-hand` | 250ms | `onHandChange` | `refreshHighlights()` |
| `#scoring-hand-{pId}` | 300ms | `onScoringChange` | `refreshAll()` (re-detects scoring cards) |
| All conservation/appeal counters | 300ms | `onCounterChange` | `ArkSidebar.updateConservationRace()` |
| All `inPlay-animals/sponsors` | 300ms | `onInPlayChange` | `refreshHighlights()` |
| `#base-projects-holder` + `#projects-holder` | 300ms | `onProjectChange` | `refreshHighlights()` |

---

## Refresh Functions

### `refreshHighlights()`
```
ArkCardHighlighter.highlightCards(playerId, scoringCards)
ArkReminders.refresh(playerId)
ArkProjectCubes.refresh()
ArkProjectCubes.highlightHandProjects(playerId)
```

### `refreshAll()`
```
scoringCards = ArkScoringCards.detectScoringCards(playerId)
refreshHighlights()
ArkSidebar.refresh()
ArkReminders.refresh(playerId)  // note: called twice in this path
```

---

## Module Public APIs

### ArkScoringCards
```js
.DEFINITIONS           // all scoring card definitions
.detectScoringCards(playerId)  // -> [{id, definition, element}]
.readProgress(playerId, definition)  // -> number (current count)
.computeScore(scoreMap, count)  // -> {earned, nextThreshold, nextPoints}
```

### ArkCardHighlighter
```js
.highlightCards(playerId, scoringCards)  // -> count of highlighted cards
.clearHighlights()
.snapshotPool()
.resetNewCards()
.HIGHLIGHT_CLASS        // 'ank-highlight'
```

### ArkConservationTracker
```js
.readAllPlayers()  // -> [{id, name, color, conservation, appeal, gap}] sorted by conservation desc
```

### ArkSidebar
```js
.create(playerId)
.onToggleChange(fn)
.getToggles()           // -> {scoring, projects, newCards}
.updateConservationRace()
.refresh()
```

### ArkReminders
```js
.refresh(playerId)
.clear()
```

### ArkProjectCubes
```js
.refresh()
.highlightHandProjects(playerId)
```

### ArkObserver
```js
.init(playerId, callbacks)  // callbacks: {onPoolChange, onHandChange, onScoringChange, onCounterChange, onInPlayChange, onProjectChange}
.destroy()
```

---

## CSS Class Conventions

All extension classes use the `ank-` prefix to avoid conflicts with BGA styles.

| Class | Purpose |
|-------|---------|
| `ank-highlight` | Gold border on scoring-card-matching cards |
| `ank-project-highlight` | Blue border on project-matching cards |
| `ank-project-multi-highlight` | Pulsing blue for cards matching 2+ projects |
| `ank-label` | Base class for all card labels |
| `ank-scoring-label` | Gold pill label (scoring card name) |
| `ank-project-label` | Blue pill label (project match) |
| `ank-new-badge` | Green "NEW" badge on pool cards |
| `ank-reminder` | Dark reminder badge base |
| `ank-reminder-action` | Reminder on action cards |
| `ank-reminder-map` | Reminder on zoo map |
| `ank-reminder-card` | Green reminder on cards |
| `ank-reminder-earn` | Green earn badge (listening sponsors) |
| `ank-reminder-migration` | Purple migration reminder |
| `ank-support-label` | Green "Can support" label |
| `ank-pcube-row` | Project cube row container |
| `ank-pcube` | Individual colored cube indicator |
| `ank-sidebar` | The sidebar panel |
| `ank-collapsed` | Sidebar collapsed state |

---

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `ank-known-pool-{tableId}` | Set of card IDs currently known in pool (for "NEW" badges) |

`tableId` extracted from URL path.
