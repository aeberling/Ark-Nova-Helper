/**
 * Card highlighting logic for Ark Nova Helper.
 * Scans cards in the pool and hand, highlights those matching scoring card criteria.
 */
const ArkCardHighlighter = (() => {
  const HIGHLIGHT_CLASS = 'ank-highlight';
  const PROJECT_HIGHLIGHT_CLASS = 'ank-project-highlight';
  const PROJECT_MULTI_HIGHLIGHT_CLASS = 'ank-project-multi-highlight';

  // Map of project icon values to badge data-type values used on cards.
  // Most match directly; these cover the ones that need mapping.
  const PROJECT_ICON_TO_BADGE = {
    Africa: 'Africa',
    Americas: 'Americas',
    Australia: 'Australia',
    Asia: 'Asia',
    Europe: 'Europe',
    Bird: 'Bird',
    Predator: 'Predator',
    Herbivore: 'Herbivore',
    Reptile: 'Reptile',
    Primate: 'Primate',
    SeaAnimal: 'SeaAnimal',
    Science: 'Science',
    Rock: 'Rock',
    Water: 'Water',
  };

  // Tracks which card IDs were in the pool at snapshot time.
  let _knownPool = null;

  /**
   * Get the current game/table ID from the URL for per-game localStorage.
   * @returns {string|null}
   */
  function getTableId() {
    const match = window.location.pathname.match(/\/table\/(\d+)/);
    if (match) return match[1];
    const params = new URLSearchParams(window.location.search);
    return params.get('table') || null;
  }

  /**
   * localStorage key for the current game's known pool.
   * @returns {string|null}
   */
  function storageKey() {
    const tableId = getTableId();
    return tableId ? `ank-known-pool-${tableId}` : null;
  }

  /**
   * Load known pool from localStorage for this game.
   */
  function loadPool() {
    const key = storageKey();
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return new Set(JSON.parse(raw));
    } catch { /* ignore corrupt data */ }
    return null;
  }

  /**
   * Save known pool to localStorage for this game.
   */
  function savePool() {
    const key = storageKey();
    if (!key || !_knownPool) return;
    try {
      localStorage.setItem(key, JSON.stringify([..._knownPool]));
    } catch { /* storage full, ignore */ }
  }

  // Diversity projects need special handling: only highlight icons the player is missing.
  const DIVERSITY_PROJECTS = {
    SpeciesDiversity: ['Bird', 'Predator', 'Herbivore', 'Reptile', 'Primate'],
    HabitatDiversity: ['Africa', 'Europe', 'Asia', 'Americas', 'Australia'],
  };

  /**
   * Clear all existing highlights.
   */
  function clearHighlights() {
    // Remove injected label and badge elements
    document.querySelectorAll('.ank-label, .ank-new-badge').forEach((el) => el.remove());
    // Remove highlight classes
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}, .${PROJECT_HIGHLIGHT_CLASS}, .${PROJECT_MULTI_HIGHLIGHT_CLASS}`).forEach((el) => {
      el.classList.remove(HIGHLIGHT_CLASS, PROJECT_HIGHLIGHT_CLASS, PROJECT_MULTI_HIGHLIGHT_CLASS);
    });
  }

  /**
   * Snapshot current pool card IDs as "known".
   * On first call, loads from localStorage so new-card tracking persists across reloads.
   * Adds any currently visible pool cards to the known set and saves.
   */
  function snapshotPool() {
    // Try to restore from localStorage first
    const saved = loadPool();
    _knownPool = saved || new Set();

    const pool = document.getElementById('cards-pool');
    if (pool) {
      pool.querySelectorAll('.ark-card.zoo-card').forEach((el) => {
        const id = el.getAttribute('data-id') || el.id;
        if (id) _knownPool.add(id);
      });
    }
    savePool();
  }

  /**
   * Reset new-card tracking: re-snapshot current pool and clear badges.
   */
  function resetNewCards() {
    document.querySelectorAll('.ank-new-badge').forEach((el) => el.remove());
    // Fresh snapshot of current pool (overwrite saved)
    _knownPool = new Set();
    const pool = document.getElementById('cards-pool');
    if (pool) {
      pool.querySelectorAll('.ark-card.zoo-card').forEach((el) => {
        const id = el.getAttribute('data-id') || el.id;
        if (id) _knownPool.add(id);
      });
    }
    savePool();
  }

  /**
   * Check if a single card element matches a scoring card's criteria.
   * @param {Element} cardEl - the .ark-card element
   * @param {object} definition - scoring card definition
   * @returns {boolean}
   */
  function cardMatchesCriteria(cardEl, definition) {
    if (!definition.highlightType) return false;

    switch (definition.highlightType) {
      case 'badge':
        // Card has a badge icon with matching data-type
        return !!cardEl.querySelector(`.badge-icon[data-type="${definition.highlightValue}"]`);

      case 'card-class':
        // Card has a specific class (e.g. sponsor-card)
        return cardEl.classList.contains(definition.highlightValue);

      case 'bonus':
        // Card has a bonus of the given type (e.g. reputation)
        return !!cardEl.querySelector(`.zoo-card-bonus.${definition.highlightValue}`);

      case 'enclosure-min': {
        // Animal card with enclosure size >= value
        if (!cardEl.classList.contains('animal-card')) return false;
        const size = readEnclosureSize(cardEl);
        return size !== null && size >= definition.highlightValue;
      }

      case 'enclosure-max': {
        // Animal card with enclosure size <= value
        if (!cardEl.classList.contains('animal-card')) return false;
        const size = readEnclosureSize(cardEl);
        return size !== null && size <= definition.highlightValue;
      }

      default:
        return false;
    }
  }

  /**
   * Read the enclosure size from a card element.
   * The enclosure icon has the size as its text content:
   *   <div class="arknova-icon icon-enclosure-regular">4</div>
   * @param {Element} cardEl
   * @returns {number|null}
   */
  function readEnclosureSize(cardEl) {
    const enclosureEl = cardEl.querySelector(
      '[class*="icon-enclosure-regular"], [class*="icon-enclosure-not-regular"]'
    );
    if (!enclosureEl) return null;
    const size = parseInt(enclosureEl.textContent.trim(), 10);
    return isNaN(size) ? null : size;
  }

  /**
   * Check if a scoring card has already reached its max (4-point) threshold.
   * @param {string} playerId
   * @param {object} scoringCard - {id, definition} from ArkScoringCards
   * @returns {boolean}
   */
  function isMaxedOut(playerId, scoringCard) {
    const def = scoringCard.definition;
    const progress = ArkScoringCards.readProgress(playerId, def);
    if (progress === null) return false;

    const result = ArkScoringCards.computeScore(def.scoreMap, progress);
    // Maxed out when there's no next threshold to reach
    return result.nextThreshold === null && result.earned > 0;
  }

  /**
   * Find the current player's color from the DOM.
   * @param {string} playerId
   * @returns {string|null} hex color without '#' (e.g. "1863a5")
   */
  function getPlayerColor(playerId) {
    // Worker meeples have the player color
    const workerEl = document.querySelector(
      `#reserve-${playerId} .arknova-meeple[data-color], ` +
      `#worker-counter-container-${playerId} .arknova-meeple[data-color]`
    );
    if (workerEl) return workerEl.getAttribute('data-color');

    // Fallback: token on the zoo map
    const tokenEl = document.querySelector(
      `#zoo-map-${playerId} .arknova-meeple[data-color]`
    );
    if (tokenEl) return tokenEl.getAttribute('data-color');

    return null;
  }

  /**
   * Read a player's icon count from the BGA icon summary.
   * @param {string} playerId
   * @param {string} iconType - e.g. "Bird", "Africa"
   * @returns {number}
   */
  function readIconCount(playerId, iconType) {
    const el = document.getElementById(`icons-${playerId}-${iconType}`);
    if (!el) return 0;
    const count = parseInt(el.textContent.trim(), 10);
    return isNaN(count) ? 0 : count;
  }

  /**
   * Detect conservation projects on the board that the player has NOT supported.
   * Returns an array of badge data-type values to highlight.
   * For diversity projects (Species/Habitat), only returns icons the player is missing.
   * @param {string} playerId
   * @returns {Array<{icon: string, name: string}>} unsupported project icons
   */
  function getUnsupportedProjectIcons(playerId) {
    const playerColor = getPlayerColor(playerId);
    if (!playerColor) return [];

    const unsupported = [];

    // Check both base projects and personal projects
    const projectCards = document.querySelectorAll(
      '#base-projects-holder .project-card[data-id], ' +
      '#projects-holder .project-card[data-id]'
    );

    for (const projectEl of projectCards) {
      const projectId = projectEl.getAttribute('data-id');
      if (!projectId) continue;

      // Check if player has a cube on any slot of this project
      const cubeHolders = projectEl.querySelectorAll('.project-card-slot-cube-holder');
      let playerHasSupported = false;

      for (const holder of cubeHolders) {
        const playerCube = holder.querySelector(
          `.arknova-meeple[data-type="token"][data-color="${playerColor}"]`
        );
        if (playerCube) {
          playerHasSupported = true;
          break;
        }
      }

      if (!playerHasSupported) {
        const titleEl = projectEl.querySelector('.ark-card-title');

        // Check if this is a diversity project (Species Diversity / Habitat Diversity)
        const diversityKey = Object.keys(DIVERSITY_PROJECTS).find((key) =>
          projectId.includes(key)
        );

        if (diversityKey) {
          // Only highlight icons the player doesn't have yet
          const name = titleEl ? titleEl.textContent.trim() : diversityKey;
          for (const iconType of DIVERSITY_PROJECTS[diversityKey]) {
            if (readIconCount(playerId, iconType) === 0) {
              unsupported.push({ icon: iconType, name });
            }
          }
        } else {
          // Normal project - check badge
          const badgeEl = projectEl.querySelector('.project-card-slot-cube-holder.badge-icon[data-type]');
          if (badgeEl) {
            const icon = badgeEl.getAttribute('data-type');
            if (PROJECT_ICON_TO_BADGE[icon]) {
              const name = titleEl ? titleEl.textContent.trim() : icon;
              unsupported.push({ icon, name });
            }
          }
        }
      }
    }

    return unsupported;
  }

  /**
   * Check if a card matches any unsupported project icon.
   * @param {Element} cardEl
   * @param {Array<{icon: string, name: string}>} projectIcons
   * @returns {Array<string>} matching project names
   */
  function cardMatchesProjects(cardEl, projectIcons) {
    const matches = [];
    for (const proj of projectIcons) {
      const badgeType = PROJECT_ICON_TO_BADGE[proj.icon];
      if (badgeType && cardEl.querySelector(`.badge-icon[data-type="${badgeType}"]`)) {
        matches.push(proj.name);
      }
    }
    return matches;
  }

  /**
   * Run highlighting on all cards in pool and hand.
   * Skips scoring cards that are already maxed out (4-point condition met).
   * Also highlights cards matching unsupported conservation projects.
   * @param {string} playerId
   * @param {Array} scoringCards - array of {id, definition} from ArkScoringCards
   * @returns {number} count of highlighted cards
   */
  function highlightCards(playerId, scoringCards) {
    clearHighlights();

    const toggles = ArkSidebar.getToggles();

    // Filter out scoring cards that are already maxed out
    const activeScoringCards = toggles.scoring && scoringCards
      ? scoringCards.filter((sc) => !isMaxedOut(playerId, sc))
      : [];

    // Get unsupported conservation project icons
    const unsupportedProjects = toggles.projects
      ? getUnsupportedProjectIcons(playerId)
      : [];

    const showNew = toggles.newCards && _knownPool;

    if (activeScoringCards.length === 0 && unsupportedProjects.length === 0 && !showNew) return 0;

    // Collect all card elements to scan
    const cardEls = [];

    // Cards in display pool
    const pool = document.getElementById('cards-pool');
    if (pool) {
      cardEls.push(...pool.querySelectorAll('.ark-card.zoo-card'));
    }

    // Cards in player hand (board location)
    const hand = document.getElementById(`hand-${playerId}`);
    if (hand) {
      cardEls.push(...hand.querySelectorAll('.ark-card.zoo-card'));
    }

    // Cards in floating hand
    const floatingHand = document.getElementById('floating-hand');
    if (floatingHand) {
      const handSection = floatingHand.querySelector('.player-board-hand');
      if (handSection) {
        cardEls.push(...handSection.querySelectorAll('.ark-card.zoo-card'));
      }
    }

    // Deduplicate by card data-id (same card might be in both hand locations)
    const seen = new Set();
    const uniqueCards = [];
    for (const el of cardEls) {
      const id = el.getAttribute('data-id') || el.id;
      if (!seen.has(id)) {
        seen.add(id);
        uniqueCards.push(el);
      }
    }

    let highlightCount = 0;

    for (const cardEl of uniqueCards) {
      const scoringMatches = [];
      const projectMatches = [];

      for (const sc of activeScoringCards) {
        if (cardMatchesCriteria(cardEl, sc.definition)) {
          scoringMatches.push(sc.definition.name);
        }
      }

      if (unsupportedProjects.length > 0) {
        projectMatches.push(...cardMatchesProjects(cardEl, unsupportedProjects));
      }

      if (scoringMatches.length > 0) {
        cardEl.classList.add(HIGHLIGHT_CLASS);
        const label = document.createElement('span');
        label.className = 'ank-label ank-scoring-label';
        label.textContent = scoringMatches.join(', ');
        cardEl.appendChild(label);
        highlightCount++;
      }

      if (projectMatches.length > 0) {
        cardEl.classList.add(PROJECT_HIGHLIGHT_CLASS);
        if (projectMatches.length >= 2) {
          cardEl.classList.add(PROJECT_MULTI_HIGHLIGHT_CLASS);
        }
        const label = document.createElement('span');
        label.className = 'ank-label ank-project-label';
        label.textContent = projectMatches.join(', ');
        cardEl.appendChild(label);
        highlightCount++;
      }
    }

    // New-card badges on pool cards
    if (showNew) {
      const pool = document.getElementById('cards-pool');
      if (pool) {
        pool.querySelectorAll('.ark-card.zoo-card').forEach((cardEl) => {
          const id = cardEl.getAttribute('data-id') || cardEl.id;
          if (id && !_knownPool.has(id)) {
            const badge = document.createElement('span');
            badge.className = 'ank-new-badge';
            badge.textContent = 'NEW';
            cardEl.style.position = 'relative';
            cardEl.appendChild(badge);
            // Mark as known so badge clears on next refresh (e.g. when player acts)
            _knownPool.add(id);
          }
        });
        savePool();
      }
    }

    return highlightCount;
  }

  return {
    highlightCards,
    clearHighlights,
    snapshotPool,
    resetNewCards,
    HIGHLIGHT_CLASS,
  };
})();
