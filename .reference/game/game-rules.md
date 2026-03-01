# Ark Nova - Game Rules Reference

## Overview

Ark Nova is a zoo-building game where players build enclosures, play animal and sponsor cards, support conservation projects, and race along the conservation and appeal tracks. The game ends when any player's appeal marker and conservation marker meet or cross on the scoring track.

## Victory Condition

**Score = Appeal + Conservation Score**

The conservation track maps to a "target appeal" that decreases as conservation rises:
- Conservation 1-10: each position worth 2 points (reduces target appeal by 2)
- Conservation 11+: each position worth 3 points (reduces target appeal by 3)

Formula: `targetAppeal = 114 - min(10, cons) * 2 - (cons > 10 ? (cons - 10) * 3 : 0)`

The game ends when any player's appeal >= targetAppeal (markers meet/cross). Final score = appeal - targetAppeal (can be negative).

---

## The Five Actions

Each player has 5 action cards sitting in slots 1-5. The slot number = action strength. After using a card, it moves to slot 1 and all others shift up.

**Strength 0 rule**: If you place a card at strength 0 (or choose not to use it), you gain an X-token instead.

**X-tokens**: Can be spent to boost action strength by +1 each. Max 5 X-tokens.

### 1. Cards Action
- Strength 1: Draw 2 cards from deck, keep 1
- Strength 2: Draw 2 + look at 1 from pool (reputation-gated)
- Strength 3: Draw 3, look at pool, keep 1
- Strength 4: Draw 3, look at pool, keep 2
- Strength 5: Draw 3, look at pool, keep 2 + gain reputation

**Cards II upgrade**: Increases hand limit from 3 to 5 and expands pool access.

### 2. Build Action
- Place a building tile on your zoo map
- Strength determines the size of building you can place
- Terrain requirements (rock/water adjacency) may apply

### 3. Animals Action
- Play an animal card from your hand
- Strength = max cost you can play (before discounts)
- Must have a valid enclosure (correct size, terrain requirements)
- Animal provides: appeal, potentially conservation, reputation, icons

### 4. Sponsors Action
- Play a sponsor card from your hand
- Strength = max level of sponsor you can play
- Sponsors provide ongoing abilities, icon listeners, bonuses

### 5. Association Action
Tasks available by strength:
- **Strength 0**: Donation (money for conservation)
- **Strength 2**: Gain reputation
- **Strength 3**: Place a partner zoo (continent-specific, gives -3 cost discount on matching animals)
- **Strength 4**: Gain a university (increases hand limit, enables research icon)
- **Strength 5**: Support a conservation project (4 with Veterinarian sponsor)

---

## Conservation Projects

### Base Projects (always available, P101-P112)
- Icon-counting projects: require a threshold number of a specific icon (continent or animal type)
- Each project has 3 slots with increasing thresholds and conservation rewards
- Multiple players can support the same project at different slots

### Standard Projects (card-based, dealt from deck)
Two types:
1. **Icon projects**: Like base projects but with different thresholds/rewards
2. **Release projects (P113-P132)**: Require releasing an animal matching a continent. 3 slots by animal size:
   - Size 4+: 5 conservation points
   - Size 3: 4 conservation points
   - Size 2: 3 conservation points
   - Also gain 1 reputation per release

### Supporting a Project
- Use Association action at strength 5 (or 4 with Veterinarian)
- Must meet the icon threshold for an open slot
- Place your worker cube on the slot
- Gain the listed conservation points

---

## Tracks

### Appeal Track (0-113)
- Gained from playing animal and sponsor cards
- Determines income during breaks
- The "finish line" for game end

### Conservation Track (0-41)
- Gained from supporting projects, certain card abilities, and donation
- Moves toward appeal on the scoring track
- Positions 1-10 have random bonus tiles (money, enclosures, reputation, x-tokens, etc.)

### Reputation Track (0-15, capped at 9 without Cards II)
- Determines pool card access:
  - Rep 0: pool slot 1 only
  - Rep 1-2: slots 1-2, 1-3
  - Rep 3-5: slots 1-3
  - Rep 6-8: slots 1-4
  - Rep 9-11: slots 1-5
  - Rep 12+: all 6 slots
- Milestone bonuses at rep 5, 8, 10, 11, 12, 13, 14, 15

---

## Card Pool

- 6 face-up cards (slots 1-6, access gated by reputation)
- During breaks: first 2 cards discarded, pool refilled

---

## Break Phase

Triggered when the break counter reaches the threshold.

Order:
1. **Discard**: Players discard down to hand limit (base 3, +2 with university, +1 with bonus tile)
2. **Refill**: Clean up tokens, return workers, refill partner zoos/universities, discard pool slots 1-2, shift remaining, refill
3. **Income**: Each player receives money from income table (based on appeal) + kiosk bonuses + sponsor effects
4. **Finish**: Reset break counter

---

## Scoring Cards (Final Scoring)

Each player starts with 2 scoring cards and keeps them through the game. At end of game, scoring cards are revealed and provide bonus conservation points based on meeting thresholds.

Score maps work as: `{threshold: conservationBonus}`. Find the highest threshold <= your count; the value is your bonus. Max is typically 4 conservation points.

---

## Key Resources

| Resource | Icon | Max |
|----------|------|-----|
| Money | Coin | Unlimited |
| Appeal | Star | 113 |
| Conservation | Green leaf | 41 |
| Reputation | Scroll | 15 (9 without Cards II) |
| X-Tokens | X marker | 5 |
| Workers | Meeples | Varies |

## Animal Properties

- **Enclosure Size**: 1-5 (small = size <= 2, large = size >= 4)
- **Terrain Requirements**: Rock and/or Water adjacency
- **Special Enclosures**: Petting zoo, reptile house, large bird aviary, aquarium
- **Categories**: Bird, Predator, Herbivore, Bear, Reptile, Pet, Primate, SeaAnimal
- **Continents**: Africa, Europe, Asia, Americas, Australia
- **Abilities**: Sprint, Clever, Pouch, Snapping, Boost, Pilfering, Sunbathing, Determination, Scuba Dive, Reef, Hunter, Symbiosis, Constriction, Venom, Hypnosis, Pack
