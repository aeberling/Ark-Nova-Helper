# BGA Ark Nova - Code Architecture Reference

Source: `/BGA-Game-Code/arknova/`

## PHP File Structure

### Core Files
| File | Purpose |
|------|---------|
| `arknova.game.php` | Main game class, extends `Table`. Uses traits: `SetupTrait`, `EngineTrait`, `TurnTrait`, `BreakTrait`. Managers: `Meeples`, `ActionCards`, `ZooCards`, `Buildings`, `Players`, `Scores` |
| `arknova.action.php` | Action entry points: `actConfirmTurn`, `actRestart`, `actTakeAtomicAction`, `actChooseAction`, `actSelect`, etc. |
| `arknova.view.php` | View file (minimal) |
| `material.inc.php` | Includes constants |
| `states.inc.php` | State machine definition |
| `dbmodel.sql` | Database schema: `meeples`, `cards`, `actioncards`, `buildings` + player extensions |

### Models (`modules/php/Models/`)
| File | Key Properties |
|------|---------------|
| `Animal.php` | name, latin, cost, appeal, conservation, reputation, enclosureSize, enclosureRequirements, specialEnclosure, categories, continents, ability. `isSmall()` = size <= 2, `isLarge()` = size >= 4 |
| `Sponsor.php` | lvl, listeningIcon, listeningMode (MY_ZOO/ALL_ZOO), listeningBonuses |
| `FinalScoring.php` | scoreMap, `getQuantity()` override pattern, `getScoreBonus()` |
| `ActionCard.php` | Strength = position (1-5), `getCurrentStrength()` accounts for map bonuses |
| `Player.php` | Score calculation, icon counting, income computation |
| `ZooMap.php` | Map model |
| `Project.php` | Base project with `slots` array (condition + gain) |
| `ReleaseProject.php` | 3 slots: size 4/3/2 for 5/4/3 conservation, gain 1 reputation each |

### Managers (`modules/php/Managers/`)
| File | Purpose |
|------|---------|
| `ZooCards.php` | Card instances, pool system (6 slots, reputation-gated), card locations |
| `ActionCards.php` | Action card management |
| `Buildings.php` | Building placement on maps |
| `Meeples.php` | Token/meeple management |
| `Players.php` | Player management |
| `Actions.php` | Action dispatch |

### Card Definitions (`modules/php/Cards/`)
| Directory | Count | Example |
|-----------|-------|---------|
| `Animals/` | 160 files | Individual animal card PHP classes |
| `Sponsors/` | 90 files | Individual sponsor card PHP classes |
| `Projects/` | 40 files | Project card classes |
| `FinalScoring/` | 24 files | Scoring card classes with `getQuantity()` overrides |
| `Actions/` | 25 files | Action card classes |
| `list.inc.php` | Master list of all card IDs |

### Actions (`modules/php/Actions/`)
- 31 action files + `Bonuses/` (15 files) + `Effects/` (54 files)
- Key: `ChooseActionCard.php`, `Association.php`, `Gain.php`

---

## JavaScript Files

| File | Purpose |
|------|---------|
| `arknova.js` | Main JS entry, extends BGA `gamegui` |
| `modules/js/cardsData.js` | `const CARDS_DATA = {...}` - all card definitions (~177KB) |
| `modules/js/Cards.js` | Card rendering: `getCardInfos(cardId)`, `tplZooCard()`, `addZooCard(card)` |
| `modules/js/Players.js` | Player board/panel rendering, defines `PLAYER_COUNTERS`, `ICONS_SUMMARY`, `ANIMALS_SIZES` |
| `modules/js/ActionCards.js` | Action card JS |
| `modules/js/Meeples.js` | Meeple JS |

### `Cards.js` Key Functions
- `getCardInfos(cardId)` - returns card data from `CARDS_DATA`
- `tplZooCard(card)` - dispatches to type-specific template
- `addZooCard(card)` - creates DOM element with `data-id` attribute

---

## State Machine

### Key States
```
ST_GAME_SETUP = 1
ST_TURNACTION = 7
ST_CHOOSE_ACTION_CARD = 20
ST_GAIN = 21
ST_BUILD = 30
ST_ANIMALS = 32
ST_ASSOCIATION = 33
ST_CARDS = 34
ST_SPONSORS = 35
ST_BREAK_MULTIACTIVE = 10
ST_BREAK_CARDS = 11
ST_BREAK_REFILL = 12
ST_BREAK_INCOME = 13
ST_BREAK_FINISH = 14
ST_CONFIRM_TURN = 93
ST_PRE_END_OF_GAME = 98
ST_END_GAME = 99
```

### Turn Flow
1. `beforeStartOfTurn` -> `turnAction` -> `resolveStack` -> `confirmTurn`
2. Break: `breakMultiactive` -> `breakDiscard` -> `breakRefill` -> `breakIncome` -> `breakFinish`
3. End: `stPreEndOfGame` scores all sponsor cards then scoring cards

### End-of-Game Scoring Order
1. Score all sponsor cards (`card->score()`)
2. Score all scoring hand cards (`card->score()` which calls `getQuantity()` then `getScoreBonus()`)

---

## Constants & Enums (`modules/php/constants.inc.php`)

### Resources
```php
MONEY = 'money'
SCORE = 'score'
REPUTATION = 'reputation'
CONSERVATION = 'conservation'
APPEAL = 'appeal'
WORKER = 'worker'
XTOKEN = 'xtoken'
TOKEN = 'token'
```

### Card Types
```php
CARD_ANIMAL = 'animal'
CARD_SPONSOR = 'sponsor'
CARD_PROJECT = 'project'
CARD_BASE_PROJECT = 'baseProject'
CARD_SCORING = 'scoring'
```

### Continents
```php
AFRICA = 'Africa'
EUROPE = 'Europe'
ASIA = 'Asia'
AMERICAS = 'Americas'
AUSTRALIA = 'Australia'
```

### Animal Categories
```php
BIRD = 'Bird'
PREDATOR = 'Predator'
HERBIVORE = 'Herbivore'
BEAR = 'Bear'
REPTILE = 'Reptile'
PET = 'Pet'
PRIMATE = 'Primate'
SEA_ANIMAL = 'SeaAnimal'
```

### Enclosure Requirements
```php
ROCK = 'Rock'
WATER = 'Water'
```

### Card Locations
```
'deck', 'discard', 'hand', 'scoringHand', 'inPlay',
'pool-{1-6}', 'base_{0-3}', 'projects_{0-n}',
'scoringDeck', 'rescueStation', 'stored'
```

---

## Scoring Implementation Details

### Conservation-to-Score Formula
```php
// Conservation 1-10: 2 points each
// Conservation 11+: 3 points each
targetAppeal = 114 - min(10, conservation) * 2 - (conservation > 10 ? (conservation - 10) * 3 : 0)
conservationScore = 100 - targetAppeal
```

### Pool Access by Reputation
```php
$limitMap = [0, 1, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6]
// Index = reputation, value = number of pool slots accessible
```

### Appeal-to-Income Table
Maps appeal (0-107+) to money income (5-37) during breaks.

### Reputation Track Bonuses
| Rep | Bonus |
|-----|-------|
| 5 | Upgrade an action card |
| 8 | Add a worker |
| 10 | Take a card |
| 11 | +1 conservation |
| 12 | +1 X-token |
| 13 | Take a card |
| 14 | +1 conservation |
| 15 | +1 X-token |
