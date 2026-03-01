# Implementation Patterns

Patterns and recipes for adding new features to the Ark Nova Helper extension.

---

## Adding a New Scoring Card

### 1. Add Definition in `scoring-cards.js`

Add to the `DEFINITIONS` object:

```js
F005_ConservationZoo: {
  id: 'F005_ConservationZoo',
  name: 'Conservation Zoo',
  cardId: 'F005_ConservationZoo',       // matches data-id on the card element
  highlightType: 'badge',               // see highlight types below
  highlightKey: 'Science',              // parameter for the highlight type
  progressType: 'icon-counter',         // see progress types below
  progressKey: 'Science',              // parameter for the progress type
  scoreMap: { 3: 1, 4: 2, 5: 3, 6: 4 }
},
```

### 2. Highlight Types

| Type | `highlightKey` | What It Matches |
|------|---------------|----------------|
| `badge` | Badge `data-type` value (e.g., "Science", "Rock") | Cards with `.badge-icon[data-type="X"]` |
| `card-class` | CSS class name (e.g., "sponsor-card") | Cards with that class |
| `bonus` | Bonus type (e.g., "reputation") | Cards with `.zoo-card-bonus.{type}` |
| `enclosure-min` | Min size number | Animals with enclosure size >= X |
| `enclosure-max` | Max size number | Animals with enclosure size <= X |
| `null` | - | No highlighting (unsupported) |

### 3. Progress Types

| Type | `progressKey` | How It Reads |
|------|--------------|-------------|
| `icon-counter` | Icon name (e.g., "Science") | Reads `#icons-{pId}-{key}` text |
| `counter` | Counter name (e.g., "reputation") | Reads `#counter-{pId}-{key}` text |
| `dom-count` | Size key (e.g., "large-animals") | Reads `#icons-{pId}-{key}` text |
| `played-sponsors` | - | Counts `.sponsor-card` in `#inPlay-sponsors-{pId}` |
| `null` | - | No progress tracking (unsupported) |

### 4. No Other Changes Needed

The detection, highlighting, and progress display are all driven by the definition. Adding a definition with valid types automatically enables the feature.

---

## Adding a New Sponsor Reminder

### Element-Targeted Reminder

In `reminders.js`, add to `ELEMENT_REMINDERS`:

```js
{
  sponsorId: 'S203_Veterinarian',
  target: 'action-card',          // 'action-card' or 'zoo-map'
  actionType: 'Association',      // for action-card target: which action card
  label: 'Projects at 4',
  cssClass: 'ank-reminder-action' // or 'ank-reminder-map'
}
```

### Cost Discount Reminder

Add to `COST_DISCOUNT_SPONSORS`:

```js
{
  sponsorId: 'S229_ExpertInSmallAnimals',
  discount: 3,
  filter: { type: 'enclosure-max', value: 2 }  // matches animal cards with size <= 2
}
```

### Listening Sponsor Earn Label

Add to `LISTENING_SPONSORS`:

```js
{
  sponsorId: 'S236_Primatologist',
  badgeType: 'Primate',
  bonusText: '+3 money'
}
```

---

## Reading Data from the DOM

### Reading an Icon Count
```js
const el = document.getElementById(`icons-${playerId}-Science`);
const count = el ? parseInt(el.textContent, 10) || 0 : 0;
```

### Reading a Counter Value
```js
const el = document.getElementById(`counter-${playerId}-conservation`);
const count = el ? parseInt(el.textContent, 10) || 0 : 0;
```

### Counting Played Cards
```js
const container = document.getElementById(`inPlay-animals-${playerId}`);
const cards = container ? container.querySelectorAll('.animal-card') : [];
const count = cards.length;
```

### Reading Enclosure Size from a Card
```js
function readEnclosureSize(cardEl) {
  const icon = cardEl.querySelector('.icon-enclosure-regular, .icon-enclosure-not-regular');
  return icon ? parseInt(icon.textContent, 10) || 0 : 0;
}
```

### Reading Badge Types from a Card
```js
function getCardBadges(cardEl) {
  return Array.from(cardEl.querySelectorAll('.badge-icon[data-type]'))
    .map(b => b.getAttribute('data-type'));
}
```

### Getting Player Color
```js
function getPlayerColor(playerId) {
  // Method 1: from meeple
  const meeple = document.querySelector(`#player-board-${playerId} [data-color]`);
  if (meeple) return meeple.getAttribute('data-color');

  // Method 2: from player name
  const nameLink = document.querySelector(`#player_name_${playerId} a`);
  if (nameLink) return nameLink.style.color;
}
```

### Finding the Current Player ID
```js
function findPlayerId() {
  // Look for hand elements
  const hand = document.querySelector('[id^="hand-"]');
  if (hand) return hand.id.replace('hand-', '');

  const scoring = document.querySelector('[id^="scoring-hand-"]');
  if (scoring) return scoring.id.replace('scoring-hand-', '');
}
```

### Detecting Played Sponsors
```js
function getPlayedSponsorIds(playerId) {
  const container = document.getElementById(`inPlay-sponsors-${playerId}`);
  if (!container) return [];
  return Array.from(container.querySelectorAll('.sponsor-card[data-id]'))
    .map(el => el.getAttribute('data-id'));
}
```

---

## Adding a New Observer Target

In `observer.js`, add to the `init()` function:

```js
const target = document.getElementById('my-target-id');
if (target) {
  const obs = new MutationObserver(() => {
    debounce('my-key', 300, callbacks.onMyChange);
  });
  obs.observe(target, { childList: true, subtree: true });
  _observers.push(obs);
}
```

Then wire it up in `content.js`:

```js
ArkObserver.init(playerId, {
  // ...existing callbacks...
  onMyChange: () => refreshHighlights(),
});
```

---

## Adding UI to the Sidebar

In `sidebar.js`, add to the `create()` method inside the appropriate section div:

```js
// Add a new toggle
const toggle = createToggle('my-feature', 'My Feature', '#ff0000', true);
section.appendChild(toggle);

// Or add a new section
const newSection = document.createElement('div');
newSection.className = 'ank-section';
newSection.innerHTML = '<div class="ank-section-title">My Section</div>';
content.appendChild(newSection);
```

---

## Adding Highlights to Cards

### Scoring-type highlight (gold)
```js
cardEl.classList.add('ank-highlight');
const label = document.createElement('div');
label.className = 'ank-label ank-scoring-label';
label.textContent = 'Card Name';
cardEl.appendChild(label);
```

### Project-type highlight (blue)
```js
cardEl.classList.add('ank-project-highlight');
const label = document.createElement('div');
label.className = 'ank-label ank-project-label';
label.textContent = 'Project Name';
cardEl.appendChild(label);
```

### Reminder badge on a card
```js
const badge = document.createElement('div');
badge.className = 'ank-reminder ank-reminder-card';
badge.textContent = '-3 cost';
cardEl.appendChild(badge);
```

---

## Key Patterns to Follow

1. **IIFE module pattern**: Each file wraps in `(function() { ... })()` and exposes a single global
2. **`ank-` CSS prefix**: All classes use this prefix to avoid BGA conflicts
3. **Debounced observers**: Always debounce MutationObserver callbacks (250-300ms)
4. **Clear before refresh**: Always clear existing highlights/labels before re-applying
5. **localStorage per table**: Use `ank-{key}-{tableId}` pattern for per-game storage
6. **Null = unsupported**: Set `highlightType`/`progressType` to `null` for features not yet implemented
7. **Check for DOM elements**: Always null-check DOM queries since BGA may not have rendered elements yet

---

## Collecting Visible Cards (Pool + Hand)

Standard pattern used across modules:

```js
function collectVisibleCards(playerId) {
  const cards = [];
  const seen = new Set();

  // Pool cards
  const pool = document.getElementById('cards-pool');
  if (pool) {
    pool.querySelectorAll('.ark-card.zoo-card[data-id]').forEach(el => {
      const id = el.getAttribute('data-id');
      if (!seen.has(id)) { seen.add(id); cards.push(el); }
    });
  }

  // Hand cards
  const hand = document.getElementById(`hand-${playerId}`);
  if (hand) {
    hand.querySelectorAll('.ark-card.zoo-card[data-id]').forEach(el => {
      const id = el.getAttribute('data-id');
      if (!seen.has(id)) { seen.add(id); cards.push(el); }
    });
  }

  // Floating hand
  const floating = document.getElementById('floating-hand');
  if (floating) {
    floating.querySelectorAll('.player-board-hand .ark-card.zoo-card[data-id]').forEach(el => {
      const id = el.getAttribute('data-id');
      if (!seen.has(id)) { seen.add(id); cards.push(el); }
    });
  }

  return cards;
}
```
