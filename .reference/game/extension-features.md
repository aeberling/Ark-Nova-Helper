# Extension Features - Current Status

## Feature Overview

| Feature | Module | Status |
|---------|--------|--------|
| Scoring card highlighting | card-highlighter.js | Active (12 of 20 definitions) |
| Scoring card progress tracking | scoring-cards.js + sidebar | Active |
| Conservation project highlighting | card-highlighter.js | Active |
| Conservation race tracker | conservation-tracker.js + sidebar | Active |
| New card in pool badges | card-highlighter.js | Active |
| Sponsor ability reminders | reminders.js | Active |
| Cost discount labels | reminders.js | Active |
| Project cube indicators | project-cubes.js | Active |
| Hand project highlighting | project-cubes.js | Active |
| Sidebar toggle panel | sidebar.js | Active |

---

## Scoring Card Support

### Fully Supported (highlight + progress)

| Card | Highlight Method | Progress Source |
|------|-----------------|----------------|
| F001 Large Animal Zoo | `enclosure-min: 4` | `dom-count: large-animals` |
| F001_MW Large Animal Zoo | `enclosure-min: 4` | `dom-count: large-animals` |
| F002 Small Animal Zoo | `enclosure-max: 2` | `dom-count: small-animals` |
| F003 Research Zoo | `badge: Science` | `icon-counter: Science` |
| F003_MW Research Zoo | `badge: Science` | `icon-counter: Science` |
| F007 Favorite Zoo | `bonus: reputation` | `counter: reputation` |
| F008 Sponsored Zoo | `card-class: sponsor-card` | `played-sponsors` |
| F008_MW Sponsored Zoo | `card-class: sponsor-card` | `played-sponsors` |
| F010 Climbing Park | `badge: Rock` | `icon-counter: Rock` |
| F010_MW Climbing Park | `badge: Rock` | `icon-counter: Rock` |
| F011 Aquatic Park | `badge: Water` | `icon-counter: Water` |
| F011_MW Aquatic Park | `badge: Water` | `icon-counter: Water` |

### Defined but Unsupported

| Card | Reason | Complexity |
|------|--------|-----------|
| F004 Architectural Zoo | Requires map inspection (connected water/rock, empty spaces, borders) | High - needs map DOM parsing |
| F005 Conservation Zoo (+MW) | Counts bonus slots used on projects | Medium - scan project board for player cubes |
| F006 Naturalists' Zoo | Counts empty building spaces on map | High - needs map DOM parsing |
| F009 Diverse Species Zoo | Comparative (more animal types than previous player) | Medium - multi-player comparison |
| F012 Designer Zoo | Counts different building shapes | High - needs building shape detection |
| F013 Specialized Habitat Zoo | Best continent NOT used for base projects | Medium - needs user input for which continent to optimize |
| F014 Specialized Species Zoo | Best animal type NOT used for base projects | Medium - needs user input for which type to optimize |
| F015 Catered Picnic Areas | min(kiosks, pavilions) | Medium - need to count building types |
| F016 Accessible Zoo | Counts prerequisite conditions on played cards | Medium - parse card prerequisites |
| F017 International Zoo | Comparative (continent icons vs previous player, partner zoos x2) | Medium - multi-player comparison |

---

## Sponsor Reminders

### Element-Targeted Reminders
| Sponsor | Reminder | Target |
|---------|----------|--------|
| S203 Veterinarian | "Projects at 4" | Association action card |
| S219 Diversity Researcher | "Build anywhere, ignore rock/water" | Zoo map |

### Cost Discount Labels
| Source | Discount | Applies To |
|--------|----------|-----------|
| S229 Expert in Small Animals | -3 | Animals with enclosure size <= 2 |
| S230 Expert in Large Animals | -4 | Animals with enclosure size >= 4 |
| Partner Zoos | -3 per matching continent | Animals matching the continent |

Discounts stack and show as a single "-X cost" badge on matching animal cards.

### Listening Sponsor Earn Labels
| Sponsor | Icon | Bonus |
|---------|------|-------|
| S236 Primatologist | Primate | +3 money |
| S237 Herpetologist | Reptile | +3 money |
| S238 Ornithologist | Bird | +3 money |
| S239 Expert in Predators | Predator | +3 money |
| S240 Expert in Herbivores | Herbivore | +3 money |
| S266 Marine Biologist | SeaAnimal | +3 money |

Shows "+X money" badge on matching animal cards in pool/hand.

### Special: Migration Recording (S224)
- If played + release projects exist: labels release projects with "+1 conservation (Migration)"
- If visible in pool/hand + release projects exist: labels it "Release projects available!"

---

## Conservation Project Features

### Project Cube Indicators
- Shows colored cubes above base projects indicating each player's icon count
- Accounts for Breeding Cooperation / Breeding Program bonus (+1)
- Only shows for players who haven't already supported that project
- Sorted by count descending

### Hand Project Highlighting
- Detects icon-type project cards in player's hand
- Checks if player meets threshold for any open slot
- Adds green "Can support (X CP)" label with `ank-project-highlight` class

### Pool/Hand Card Project Matching
- Scans unsupported projects for required icon types
- Highlights cards in pool/hand that have matching badges
- Blue border + blue label showing project name
- Multi-match gets pulsing animation

---

## Sidebar UI

Bottom-anchored collapsible panel with two sections:

### Highlights Section
Three toggles:
1. **Scoring Cards** (gold swatch) - toggle scoring card highlighting
2. **Conservation Projects** (blue swatch) - toggle project highlighting
3. **New in Pool** (green swatch) - toggle new card badges + reset button

### Conservation Race Section
Table showing all players:
- Player name (colored)
- Conservation score
- Appeal score
- Gap (appeal - conservation, color-coded: red = 0, orange <= 5)
- Current player row highlighted green
