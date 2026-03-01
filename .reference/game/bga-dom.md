# BGA Ark Nova - DOM Selectors & Structure

## Top-Level Layout

```
#arknova-hold
  #arknova-draft                          -- draft/setup UI
  #arknova-main-container                 -- main game container (used to detect game load)
    #board-pool-resizable
      #board-pool
        #cards-pool                       -- the 6-card display pool
          #pool-1 through #pool-6         -- individual pool slots
        #reputation-track
    #association-board-container
      #conservation-track-duplicate
      #projects-holder                    -- standard conservation projects
      #association-board-middle
        #workers-reserves
        #association-board
        #studbooks
      #base-projects-holder               -- base conservation projects (always available)
    #floating-hand-wrapper
      #floating-hand-button-container
        #floating-hand-button
        #floating-scoring-hand-button
      #floating-hand                      -- expanded floating hand overlay
        .player-board-hand                -- cards container inside floating hand
```

---

## Player-Specific Elements

Replace `{pId}` with the numeric player ID.

### Player Board
```
#player-board-resizable-{pId}
#player-board-{pId}
```

### Card Areas
```
#hand-{pId}                              -- player's hand (hidden from others)
#scoring-hand-{pId}                      -- player's scoring cards
#inPlay-animals-{pId}                    -- played animal cards
#inPlay-sponsors-{pId}                   -- played sponsor cards
```

### Action Cards
```
#action-cards-{pId}
#action-card-slot-{pId}-{1-5}           -- slots 1-5 (strength positions)
```

### Counters (Player Panel)
```
#counter-{pId}-money
#counter-{pId}-xtoken
#counter-{pId}-reputation
#counter-{pId}-conservation
#counter-{pId}-appeal
#counter-{pId}-income
#counter-{pId}-handCount
#counter-{pId}-scoringHandCount
```

### Icon Summary Panel
```
#icons-summary-{pId}                     -- container for all icon counts
#icons-{pId}-{IconName}                  -- icon counter by type
#icons-map-{pId}-{IconName}              -- map-specific icon counter
```

**Icon names for icon summary**:
Row 1 (continents): `Africa`, `Europe`, `Asia`, `Americas`, `Australia`
Row 2 (animal types): `Bird`, `Predator`, `Herbivore`, `Reptile`, `Primate`
Row 3 (terrain + other): `Bear`, `Pet`, `Science`, `Rock`, `Water` (+ `SeaAnimal` if marine)

### Animal Size Counters
```
#icons-{pId}-small-animals               -- count of animals with size <= 2
#icons-{pId}-medium-animals              -- count of animals with size == 3
#icons-{pId}-large-animals               -- count of animals with size >= 4
```

### Player Name
```
#player_name_{pId}                       -- contains <a> with player name
#player_name_{pId} a                     -- the link, has inline style.color
```

---

## Card Elements

### General Card Structure
```html
<div class="ark-card zoo-card animal-card" data-id="A001_NorthernMuriqui">
  <div class="ark-card-wrapper">
    <div class="ark-card-top">
      <!-- badges, cost, name -->
    </div>
    <div class="ark-card-bottom">
      <!-- abilities, bonuses -->
    </div>
  </div>
</div>
```

### Card Type Classes
```css
.ark-card.zoo-card              /* all playable cards */
.animal-card                    /* animal cards */
.sponsor-card                   /* sponsor cards */
.scoring-card                   /* final scoring cards */
.project-card                   /* conservation project cards */
.project-card.project-icons     /* icon-type project cards */
```

### Card Data Attribute
All cards have `data-id` matching the card ID (e.g., `data-id="A001_NorthernMuriqui"`).

### Badges on Cards
```html
<div class="zoo-card-badge">
  <div class="badge-icon" data-type="Predator"></div>
</div>
```

**Badge `data-type` values**:
- Continents: `Africa`, `Americas`, `Asia`, `Australia`, `Europe`
- Animal types: `Bird`, `Predator`, `Herbivore`, `Bear`, `Reptile`, `Pet`, `Primate`, `SeaAnimal`
- Resources: `Science`, `Rock`, `Water`, `Appeal`, `Reputation`
- Actions: `AnimalsI`, `AnimalsII`, `BuildI`, `BuildII`, `CardsI`, `CardsII`, `SponsorsI`, `SponsorsII`, `WorkerI`, `WorkerII`
- Other: `Partner-Zoo`, `Fac` (university), `Upgrade`, `ANIMAL-SIZE-4`, `ANIMAL-SIZE-2`

### Bonus Icons on Cards
```css
.zoo-card-bonus.reputation      /* reputation bonus indicator */
.zoo-card-bonus.conservation    /* conservation bonus indicator */
.zoo-card-bonus.appeal          /* appeal bonus indicator */
```

### Enclosure Size Reading
```html
<div class="animal-card-enclosure">
  <div class="icon-enclosure-regular">4</div>
  <!-- or -->
  <div class="icon-enclosure-not-regular">3</div>
</div>
```
Text content of the icon element = numeric enclosure size.

---

## Conservation Projects DOM

### Base Projects
```
#base-projects-holder
  .project-card[data-id]
    .project-card-top-left-icon
      .badge-icon[data-type="Africa"]    -- the required icon type
    .project-slot                         -- each threshold slot
```

### Standard Projects
```
#projects-holder
  .project-card[data-id]
```

### Player Cubes on Projects
Cubes placed by players are meeple elements with `data-color` matching the player's hex color.

---

## Player Color Detection

Two methods used by the extension:

1. **From meeples**: `document.querySelector('[data-color]')` on meeple elements
2. **From player name**: `#player_name_{pId} a` has inline `style.color`

---

## Icon Sprites

### Card Badges
- Sprite: `img/zoo-card-badges.jpg`
- CSS: `background-size: 500% 700%` with positioned backgrounds
- DOM: `.badge-icon[data-type="X"]`

### General Icons
- Sprite: `img/icons.png`
- CSS class pattern: `.arknova-icon.icon-{name}`
- Examples: `.icon-action-animals`, `.icon-appeal`, `.icon-conservation`, `.icon-money`, `.icon-xtoken`, `.icon-animal-size-2`, `.icon-animal-size-4`, `.icon-all-animals`, `.icon-all-continents`

---

## Key Containers for Observation

These are the elements the extension watches with MutationObservers:

| Element | What Changes | Extension Response |
|---------|-------------|-------------------|
| `#cards-pool` | Cards added/removed from pool | Re-highlight pool cards |
| `#hand-{pId}` | Cards drawn/played | Re-highlight hand |
| `#floating-hand` | Hand overlay opened/closed | Re-highlight |
| `#scoring-hand-{pId}` | Scoring cards changed | Re-detect scoring cards |
| `#counter-{pId}-conservation` | Conservation score changes | Update conservation race |
| `#counter-{pId}-appeal` | Appeal score changes | Update conservation race |
| `#inPlay-animals-{pId}` | Animals played | Re-highlight (counts changed) |
| `#inPlay-sponsors-{pId}` | Sponsors played | Re-highlight + update reminders |
| `#base-projects-holder` | Project cubes placed | Re-highlight + update cubes |
| `#projects-holder` | Standard projects change | Re-highlight |
