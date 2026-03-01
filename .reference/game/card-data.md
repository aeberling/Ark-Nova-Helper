# Card Data Structures & Definitions

## Card ID Conventions

BGA uses a prefix system for card IDs:
- `A{number}` - Animal cards (128 base + marine expansion)
- `S{number}` - Sponsor cards (84+)
- `P{number}` - Conservation project cards (P101-P112 base, P113+ standard/release)
- `F{number}` - Final scoring cards (F001-F017, some have `_MW` marine variants)

The JS `CARDS_DATA` object in `modules/js/cardsData.js` (~177KB) contains every card definition.

---

## Animal Card Structure

```js
{
  supported: true,
  type: "animal",
  name: "NORTHERN MURIQUI",
  latin: "Brachyteles hypoxanthus",
  number: 1,
  cost: 16,              // money cost to play
  appeal: 6,             // appeal points gained
  conservation: 1,       // conservation points (0 for most)
  reputation: 0,         // reputation gained
  enclosureSize: 4,      // required enclosure size
  enclosureRequirements: { Rock: 0, Water: 1 },  // terrain adjacency
  specialEnclosure: [],  // e.g., ["reptileHouse", "aquarium"]
  categories: ["Primate"],
  prerequisites: {},     // e.g., { Science: 2 }
  continents: ["Americas"],
  ability: {},           // e.g., { Sprint: 3 }
  soloAbility: {},
  wave: false,           // true = marine expansion
  reefAbility: [],
  noRegularEnclosure: false
}
```

**Size classifications**:
- Small: enclosureSize <= 2
- Medium: enclosureSize == 3
- Large: enclosureSize >= 4

---

## Sponsor Card Structure

```js
{
  supported: true,
  type: "sponsor",
  name: "ORNITHOLOGIST",
  number: 238,
  lvl: 5,                // level (determines Association strength needed)
  appeal: 0,
  conservation: 0,
  reputation: 1,
  enclosureRequirements: {},
  specialEnclosure: [],
  categories: [],
  prerequisites: { Bird: 2 },  // icons/conditions needed to play
  continents: [],
  effects: [],
  wave: false,
  person: true,
  listeningIcon: "Bird",       // triggers on this icon
  listeningMode: "MY_ZOO",    // MY_ZOO or ALL_ZOO
  listeningBonuses: [{ type: "Money", value: 3 }]
}
```

**Key sponsor types**:
- **Listening sponsors**: Trigger bonuses when matching icons are played (Ornithologist, Primatologist, etc.)
- **Discount sponsors**: Reduce costs (Expert in Small/Large Animals)
- **Passive ability sponsors**: Ongoing rule changes (Veterinarian, Diversity Researcher)

---

## Scoring Card Structure

```js
{
  supported: true,
  type: "scoring",
  name: "Large Animal Zoo",
  number: "F001",
  desc: "Score based on large animals (size 4+)",
  icon: "animal-size-4",
  scoreMap: { 1: 1, 2: 2, 4: 3, 5: 4 },  // threshold: conservation bonus
  wave: false,
  asset: ""
}
```

### scoreMap Interpretation

Keys are thresholds (minimum count), values are conservation bonus points.
For count `n`, find highest key `k` where `k <= n`; bonus = `scoreMap[k]`.

Example for F001 `{1:1, 2:2, 4:3, 5:4}`:
- 0 large animals = 0 points
- 1 = 1 point
- 2 or 3 = 2 points
- 4 = 3 points
- 5+ = 4 points

---

## All Scoring Cards

### Base Scoring Cards

| ID | Name | What It Counts | scoreMap | Progress Source |
|----|------|---------------|----------|----------------|
| F001 | Large Animal Zoo | Animals with size >= 4 | {1:1, 2:2, 4:3, 5:4} | `icons-{pId}-large-animals` |
| F002 | Small Animal Zoo | Animals with size <= 2 | {3:1, 6:2, 8:3, 10:4} | `icons-{pId}-small-animals` |
| F003 | Research Zoo | Science icons | {3:1, 4:2, 5:3, 6:4} | `icons-{pId}-Science` |
| F004 | Architectural Zoo | 4 map conditions (connected water, connected rock, no empty, border covered) | Custom (0-4 booleans) | Map inspection |
| F005 | Conservation Zoo | Bonus project slots used | {3:1, 4:2, 5:3, 6:4} | Project board scan |
| F006 | Naturalists' Zoo | Empty building spaces on map | {6:1, 12:2, 18:3, 24:4} | Map inspection |
| F007 | Favorite Zoo | Player reputation | {6:1, 9:2, 12:3, 15:4} | `counter-{pId}-reputation` |
| F008 | Sponsored Zoo | Played sponsor cards | {3:1, 6:2, 8:3, 10:4} | Count `.sponsor-card` in `#inPlay-sponsors-{pId}` |
| F009 | Diverse Species Zoo | Animal types > previous player | Custom (max 4, multi only) | Comparative |
| F010 | Climbing Park | Rock icons | {1:1, 3:2, 5:3, 7:4} | `icons-{pId}-Rock` |
| F011 | Aquatic Park | Water icons | {2:1, 4:2, 6:3, 8:4} | `icons-{pId}-Water` |

### Marine Worlds (MW) Variants

| ID | Name | scoreMap (MW) |
|----|------|--------------|
| F001_MW | Large Animal Zoo | {1:1, 2:2, 3:3, 4:4} |
| F003_MW | Research Zoo | {3:1, 4:2, 5:3, 7:4} |
| F005_MW | Conservation Zoo | {2:1, 3:2, 4:3, 5:4} |
| F008_MW | Sponsored Zoo | {3:1, 5:2, 7:3, 9:4} |
| F010_MW | Climbing Park | {1:1, 3:2, 5:3, 6:4} |
| F011_MW | Aquatic Park | {2:1, 4:2, 6:3, 7:4} |

### MW-Only Scoring Cards

| ID | Name | What It Counts | scoreMap |
|----|------|---------------|----------|
| F012 | Designer Zoo | Different building shapes | {4:1, 6:2, 7:3, 8:4} |
| F013 | Specialized Habitat Zoo | Best continent NOT used for base projects | {3:1, 4:2, 5:3, 6:4} |
| F014 | Specialized Species Zoo | Best animal type NOT used for base projects | {3:1, 4:2, 5:3, 6:4} |
| F015 | Catered Picnic Areas | min(kiosks, pavilions) | {2:1, 3:2, 4:3, 5:4} |
| F016 | Accessible Zoo | Prerequisite conditions on played cards | {4:1, 7:2, 10:3, 12:4} |
| F017 | International Zoo | Continent icons > prev player (partner zoos x2) | Custom (max 4, multi only) |

---

## Conservation Project Cards

### Base Projects (P101-P112)
Always available on the association board. Icon-counting with 3 slots each.

Each slot has: `{ condition: threshold, gain: conservationPoints }`

Typical pattern: need X icons of a type (Africa, Bird, Science, etc.) to claim a slot.

### Release Projects (P113-P132)
Standard project cards. Require releasing an animal matching a continent.

3 slots per project:
| Animal Size | Conservation Gained |
|------------|-------------------|
| Size 4+ | 5 |
| Size 3 | 4 |
| Size 2 | 3 |

Each release also gains 1 reputation.

### Icon-to-Badge Mapping (for project matching)

Used by the extension to match cards to project requirements:

```js
{
  Africa: "Africa", Americas: "Americas", Australia: "Australia",
  Asia: "Asia", Europe: "Europe",
  Bird: "Bird", Predator: "Predator", Herbivore: "Herbivore",
  Reptile: "Reptile", Primate: "Primate", SeaAnimal: "SeaAnimal",
  Science: "Science", Rock: "Rock", Water: "Water"
}
```

### Diversity Projects (special handling)
- **Species Diversity**: Requires 5 different animal types
- **Habitat Diversity**: Requires 5 different continents
