/**
 * Scoring card definitions and DOM detection for Ark Nova Helper.
 * Data extracted from BGA's cardsData.js.
 */
const ArkScoringCards = (() => {
  // All scoring card definitions with their criteria
  const DEFINITIONS = {
    F001_LargeAnimalZoo: {
      name: 'Large Animal Zoo',
      desc: 'Large animals (enclosure size 4+)',
      icon: 'ANIMAL-SIZE-4',
      scoreMap: { 1: 1, 2: 2, 4: 3, 5: 4 },
      highlightType: 'enclosure-min',
      highlightValue: 4,
      progressType: 'dom-count',
      progressSelector: null, // uses special size counter
      progressKey: 'large-animals',
    },
    F001_LargeAnimalZoo_MW: {
      name: 'Large Animal Zoo',
      desc: 'Large animals (enclosure size 4+)',
      icon: 'ANIMAL-SIZE-4',
      scoreMap: { 1: 1, 2: 2, 3: 3, 4: 4 },
      highlightType: 'enclosure-min',
      highlightValue: 4,
      progressType: 'dom-count',
      progressKey: 'large-animals',
    },
    F002_SmallAnimalZoo: {
      name: 'Small Animal Zoo',
      desc: 'Small animals (enclosure size 1-2)',
      icon: 'ANIMAL-SIZE-2',
      scoreMap: { 3: 1, 6: 2, 8: 3, 10: 4 },
      highlightType: 'enclosure-max',
      highlightValue: 2,
      progressType: 'dom-count',
      progressKey: 'small-animals',
    },
    F003_ResearchZoo: {
      name: 'Research Zoo',
      desc: 'Research (science) icons',
      icon: 'Science',
      scoreMap: { 3: 1, 4: 2, 5: 3, 6: 4 },
      highlightType: 'badge',
      highlightValue: 'Science',
      progressType: 'icon-counter',
      progressKey: 'Science',
    },
    F003_ResearchZoo_MW: {
      name: 'Research Zoo',
      desc: 'Research (science) icons',
      icon: 'Science',
      scoreMap: { 3: 1, 4: 2, 5: 3, 7: 4 },
      highlightType: 'badge',
      highlightValue: 'Science',
      progressType: 'icon-counter',
      progressKey: 'Science',
    },
    F004_ArchitecturalZoo: {
      name: 'Architectural Zoo',
      desc: 'Building conditions (complex)',
      icon: 'ENCLOSURE-REGULAR',
      scoreMap: {},
      highlightType: null, // too complex for MVP
      progressType: null,
    },
    F005_ConservationZoo: {
      name: 'Conservation Zoo',
      desc: 'Supported conservation projects',
      icon: 'PLACE-CUBE',
      scoreMap: { 3: 1, 4: 2, 5: 3, 6: 4 },
      highlightType: null, // not card-based
      progressType: null,
    },
    F005_ConservationZoo_MW: {
      name: 'Conservation Zoo',
      desc: 'Supported conservation projects',
      icon: 'PLACE-CUBE',
      scoreMap: { 2: 1, 3: 2, 4: 3, 5: 4 },
      highlightType: null,
      progressType: null,
    },
    F006_NaturalistsZoo: {
      name: "Naturalists' Zoo",
      desc: 'Empty building spaces',
      icon: 'ENCLOSURE-EMPTY',
      scoreMap: { 6: 1, 12: 2, 18: 3, 24: 4 },
      highlightType: null, // not card-based
      progressType: null,
    },
    F007_FavoriteZoo: {
      name: 'Favorite Zoo',
      desc: 'Reputation points',
      icon: 'reputation',
      scoreMap: { 6: 1, 9: 2, 12: 3, 15: 4 },
      highlightType: 'bonus',
      highlightValue: 'reputation',
      progressType: 'counter',
      progressKey: 'reputation',
    },
    F008_SponsoredZoo: {
      name: 'Sponsored Zoo',
      desc: 'Sponsor cards in zoo',
      icon: 'SPONSOR-CARD',
      scoreMap: { 3: 1, 6: 2, 8: 3, 10: 4 },
      highlightType: 'card-class',
      highlightValue: 'sponsor-card',
      progressType: 'played-sponsors',
    },
    F008_SponsoredZoo_MW: {
      name: 'Sponsored Zoo',
      desc: 'Sponsor cards in zoo',
      icon: 'SPONSOR-CARD',
      scoreMap: { 3: 1, 5: 2, 7: 3, 9: 4 },
      highlightType: 'card-class',
      highlightValue: 'sponsor-card',
      progressType: 'played-sponsors',
    },
    F009_DiverseSpeciesZoo: {
      name: 'Diverse Species Zoo',
      desc: 'Animal categories vs previous player (max 4)',
      icon: 'ALL-ANIMALS',
      scoreMap: {},
      highlightType: null, // comparative, too complex
      progressType: null,
    },
    F010_ClimbingPark: {
      name: 'Climbing Park',
      desc: 'Rock icons',
      icon: 'ROCK',
      scoreMap: { 1: 1, 3: 2, 5: 3, 7: 4 },
      highlightType: 'badge',
      highlightValue: 'Rock',
      progressType: 'icon-counter',
      progressKey: 'Rock',
    },
    F010_ClimbingPark_MW: {
      name: 'Climbing Park',
      desc: 'Rock icons',
      icon: 'ROCK',
      scoreMap: { 1: 1, 3: 2, 5: 3, 6: 4 },
      highlightType: 'badge',
      highlightValue: 'Rock',
      progressType: 'icon-counter',
      progressKey: 'Rock',
    },
    F011_AquaticPark: {
      name: 'Aquatic Park',
      desc: 'Water icons',
      icon: 'WATER',
      scoreMap: { 2: 1, 4: 2, 6: 3, 8: 4 },
      highlightType: 'badge',
      highlightValue: 'Water',
      progressType: 'icon-counter',
      progressKey: 'Water',
    },
    F011_AquaticPark_MW: {
      name: 'Aquatic Park',
      desc: 'Water icons',
      icon: 'WATER',
      scoreMap: { 2: 1, 4: 2, 6: 3, 7: 4 },
      highlightType: 'badge',
      highlightValue: 'Water',
      progressType: 'icon-counter',
      progressKey: 'Water',
    },
    F012_DesignerZoo: {
      name: 'Designer Zoo',
      desc: 'Different shaped buildings',
      icon: 'DIFFERENT-SHAPES',
      scoreMap: { 4: 1, 6: 2, 7: 3, 8: 4 },
      highlightType: null,
      progressType: null,
    },
    F013_SpecializedHabitatZoo: {
      name: 'Specialized Habitat Zoo',
      desc: 'Continent icons (unsupported continent)',
      icon: 'ONE-CONTINENT',
      scoreMap: { 3: 1, 4: 2, 5: 3, 6: 4 },
      highlightType: null, // needs user choice of continent
      progressType: null,
    },
    F014_SpecializedSpeciesZoo: {
      name: 'Specialized Species Zoo',
      desc: 'Animal category icons (unsupported category)',
      icon: 'ONE-ANIMAL',
      scoreMap: { 3: 1, 4: 2, 5: 3, 6: 4 },
      highlightType: null,
      progressType: null,
    },
    F015_CateredPicnicAreas: {
      name: 'Catered Picnic Areas',
      desc: 'Sets of kiosk + pavilion',
      icon: 'KIOSK-PLUS-PAVILION',
      scoreMap: { 2: 1, 3: 2, 4: 3, 5: 4 },
      highlightType: null,
      progressType: null,
    },
    F016_AccessibleZoo: {
      name: 'Accessible Zoo',
      desc: 'Conditions on cards',
      icon: 'CONDITION',
      scoreMap: { 4: 1, 7: 2, 10: 3, 12: 4 },
      highlightType: null,
      progressType: null,
    },
    F017_InternationalZoo: {
      name: 'International Zoo',
      desc: 'Continent icons vs previous player (max 4)',
      icon: 'ALL-CONTINENTS',
      scoreMap: {},
      highlightType: null,
      progressType: null,
    },
  };

  /**
   * Detect the current player's scoring cards from the DOM.
   * @param {string} playerId
   * @returns {Array<{id: string, definition: object, element: Element}>}
   */
  function detectScoringCards(playerId) {
    const results = [];

    // Check scoring hand container
    const scoringHand = document.getElementById(`scoring-hand-${playerId}`);
    if (scoringHand) {
      const cards = scoringHand.querySelectorAll('.scoring-card[data-id]');
      cards.forEach((el) => {
        const id = el.getAttribute('data-id');
        if (DEFINITIONS[id]) {
          results.push({ id, definition: DEFINITIONS[id], element: el });
        }
      });
    }

    // Also check floating hand scoring section
    const floatingScoring = document.querySelector(
      '#floating-hand .player-board-scoring-hand .scoring-card[data-id]'
    );
    if (floatingScoring) {
      const id = floatingScoring.getAttribute('data-id');
      if (DEFINITIONS[id] && !results.some((r) => r.id === id)) {
        results.push({ id, definition: DEFINITIONS[id], element: floatingScoring });
      }
    }

    return results;
  }

  /**
   * Read the current progress count for a scoring card.
   * @param {string} playerId
   * @param {object} definition - scoring card definition
   * @returns {number|null} current count, or null if not trackable
   */
  function readProgress(playerId, definition) {
    if (!definition.progressType) return null;

    switch (definition.progressType) {
      case 'icon-counter': {
        const el = document.getElementById(`icons-${playerId}-${definition.progressKey}`);
        return el ? parseInt(el.textContent.trim(), 10) || 0 : null;
      }
      case 'counter': {
        const el = document.getElementById(`counter-${playerId}-${definition.progressKey}`);
        return el ? parseInt(el.textContent.trim(), 10) || 0 : null;
      }
      case 'dom-count': {
        if (definition.progressKey === 'large-animals') {
          const el = document.getElementById(`icons-${playerId}-large-animals`);
          return el ? parseInt(el.textContent.trim(), 10) || 0 : null;
        }
        if (definition.progressKey === 'small-animals') {
          const el = document.getElementById(`icons-${playerId}-small-animals`);
          return el ? parseInt(el.textContent.trim(), 10) || 0 : null;
        }
        return null;
      }
      case 'played-sponsors': {
        const container = document.getElementById(`inPlay-sponsors-${playerId}`);
        if (!container) return null;
        return container.querySelectorAll('.ark-card.zoo-card.sponsor-card').length;
      }
      default:
        return null;
    }
  }

  /**
   * Compute conservation points earned from a scoring card given a count.
   * @param {object} scoreMap - {threshold: points}
   * @param {number} count - current count
   * @returns {{earned: number, nextThreshold: number|null, nextPoints: number|null}}
   */
  function computeScore(scoreMap, count) {
    if (!scoreMap || typeof scoreMap !== 'object' || Array.isArray(scoreMap)) {
      return { earned: 0, nextThreshold: null, nextPoints: null };
    }

    const thresholds = Object.entries(scoreMap)
      .map(([t, p]) => [parseInt(t, 10), p])
      .sort((a, b) => a[0] - b[0]);

    let earned = 0;
    let nextThreshold = null;
    let nextPoints = null;

    for (const [threshold, points] of thresholds) {
      if (count >= threshold) {
        earned = points;
      } else if (nextThreshold === null) {
        nextThreshold = threshold;
        nextPoints = points;
      }
    }

    return { earned, nextThreshold, nextPoints };
  }

  return {
    DEFINITIONS,
    detectScoringCards,
    readProgress,
    computeScore,
  };
})();
