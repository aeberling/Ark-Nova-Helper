/**
 * Project cubes for Ark Nova Helper.
 * Shows colored cubes on base conservation projects indicating each player's
 * current icon count towards supporting that project.
 * Adds a +1 indicator if the player has Breeding Cooperation or Breeding Program
 * with at least one cube on it.
 */
const ArkProjectCubes = (() => {
  const CUBE_ROW_CLASS = 'ank-pcube-row';

  // Tracks last render state to avoid re-rendering identical content
  // (prevents infinite observer loops since cubes live inside #base-projects-holder).
  let _lastStateKey = '';

  /**
   * Get a player's hex color from the DOM.
   * @param {string} playerId
   * @returns {string|null} hex color without '#' (e.g. "1863a5")
   */
  function getPlayerColor(playerId) {
    const workerEl = document.querySelector(
      `#reserve-${playerId} .arknova-meeple[data-color], ` +
      `#worker-counter-container-${playerId} .arknova-meeple[data-color]`
    );
    if (workerEl) return workerEl.getAttribute('data-color');

    const tokenEl = document.querySelector(
      `#zoo-map-${playerId} .arknova-meeple[data-color]`
    );
    if (tokenEl) return tokenEl.getAttribute('data-color');

    return null;
  }

  /**
   * Read a player's icon count for a given type.
   * @param {string} playerId
   * @param {string} iconType - e.g. "Bird", "Reptile"
   * @returns {number}
   */
  function readIconCount(playerId, iconType) {
    const el = document.getElementById(`icons-${playerId}-${iconType}`);
    if (!el) return 0;
    const count = parseInt(el.textContent.trim(), 10);
    return isNaN(count) ? 0 : count;
  }

  /**
   * Check if a player has Breeding Cooperation or Breeding Program played
   * with at least one cube (token) on it.
   * @param {string} playerId
   * @returns {boolean}
   */
  function hasBreedingBonus(playerId) {
    const container = document.getElementById(`inPlay-sponsors-${playerId}`);
    if (!container) return false;

    const cards = container.querySelectorAll(
      '[data-id*="BreedingCooperation"], [data-id*="BreedingProgram"]'
    );
    for (const card of cards) {
      if (card.querySelector('.arknova-meeple[data-type="token"]')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Refresh all project cube displays on base conservation projects.
   * Only re-renders if the underlying state has changed.
   */
  function refresh() {
    const holder = document.getElementById('base-projects-holder');
    if (!holder) {
      if (_lastStateKey) {
        document.querySelectorAll(`.${CUBE_ROW_CLASS}`).forEach((el) => el.remove());
        _lastStateKey = '';
      }
      return;
    }

    const players = ArkConservationTracker.readAllPlayers();
    if (players.length === 0) {
      if (_lastStateKey) {
        document.querySelectorAll(`.${CUBE_ROW_CLASS}`).forEach((el) => el.remove());
        _lastStateKey = '';
      }
      return;
    }

    // Pre-compute player info
    const playerInfo = players
      .map((p) => ({
        id: p.id,
        name: p.name,
        color: getPlayerColor(p.id),
        breeding: hasBreedingBonus(p.id),
      }))
      .filter((pi) => pi.color);

    // Build state and DOM nodes in one pass
    const stateSegments = [];
    const pendingRows = [];

    const projectHolders = holder.querySelectorAll('.project-holder');
    for (const ph of projectHolders) {
      const card = ph.querySelector('.project-card[data-id]');
      if (!card) continue;

      const badgeEl = card.querySelector(
        '.project-card-top-left-icon .badge-icon[data-type]'
      );
      if (!badgeEl) continue;
      const iconType = badgeEl.getAttribute('data-type');
      if (!iconType) continue;

      // Find which player colors already have cubes on this project
      const supportedColors = new Set();
      card
        .querySelectorAll('.project-card-slot-cube-holder .arknova-meeple[data-color]')
        .forEach((m) => {
          supportedColors.add(m.getAttribute('data-color'));
        });

      const cubeStates = [];
      const cubeData = [];

      for (const pi of playerInfo) {
        if (supportedColors.has(pi.color)) continue;

        const count = readIconCount(pi.id, iconType);
        cubeStates.push(`${pi.color}:${count}:${pi.breeding ? 1 : 0}`);
        cubeData.push({ pi, count });
      }

      // Sort by icon count descending (highest first)
      cubeData.sort((a, b) => b.count - a.count);

      const row = document.createElement('div');
      row.className = CUBE_ROW_CLASS;

      for (const { pi, count } of cubeData) {
        const cube = document.createElement('div');
        cube.className = 'ank-pcube';
        cube.style.backgroundColor = `#${pi.color}`;
        cube.title = `${pi.name}: ${count} ${iconType}${pi.breeding ? ' (+1 Breeding)' : ''}`;

        const num = document.createElement('span');
        num.className = 'ank-pcube-count';
        num.textContent = count;
        cube.appendChild(num);

        if (pi.breeding) {
          const bonus = document.createElement('span');
          bonus.className = 'ank-pcube-bonus';
          bonus.textContent = '+1';
          cube.appendChild(bonus);
        }

        row.appendChild(cube);
      }

      stateSegments.push(cubeStates.join(','));
      if (cubeData.length > 0) {
        pendingRows.push({ ph, row });
      }
    }

    // Skip re-render if nothing changed (prevents observer loops)
    const newStateKey = stateSegments.join('|');
    if (newStateKey === _lastStateKey) return;
    _lastStateKey = newStateKey;

    // Clear old cubes and render new ones
    document.querySelectorAll(`.${CUBE_ROW_CLASS}`).forEach((el) => el.remove());
    for (const { ph, row } of pendingRows) {
      ph.style.position = 'relative';
      ph.appendChild(row);
    }
  }

  /**
   * Highlight conservation project cards in the player's hand that they can support.
   * Checks icon-type projects only. Must be called after ArkCardHighlighter.highlightCards()
   * since that clears all highlights first.
   * @param {string} playerId
   */
  function highlightHandProjects(playerId) {
    if (!playerId) return;

    const toggles = ArkSidebar.getToggles();
    if (!toggles.projects) return;

    // Collect icon-type project cards from hand and floating hand
    const projectCards = [];

    const hand = document.getElementById(`hand-${playerId}`);
    if (hand) {
      projectCards.push(
        ...hand.querySelectorAll('.ark-card.zoo-card.project-card.project-icons')
      );
    }

    const floatingHand = document.getElementById('floating-hand');
    if (floatingHand) {
      const handSection = floatingHand.querySelector('.player-board-hand');
      if (handSection) {
        projectCards.push(
          ...handSection.querySelectorAll('.ark-card.zoo-card.project-card.project-icons')
        );
      }
    }

    if (projectCards.length === 0) return;

    const breedingBonus = hasBreedingBonus(playerId) ? 1 : 0;

    for (const cardEl of projectCards) {
      const badgeEl = cardEl.querySelector(
        '.project-card-top-left-icon .badge-icon[data-type]'
      );
      if (!badgeEl) continue;
      const iconType = badgeEl.getAttribute('data-type');
      if (!iconType) continue;

      const iconCount = readIconCount(playerId, iconType);
      const effectiveCount = iconCount + breedingBonus;

      // Find the best (highest reward) slot the player qualifies for
      const slots = cardEl.querySelectorAll('.project-card-slot');
      let bestReward = null;

      for (const slot of slots) {
        const indicator = slot.querySelector('.project-card-slot-indicator');
        if (!indicator) continue;
        const threshold = parseInt(indicator.textContent.trim(), 10);
        if (isNaN(threshold) || effectiveCount < threshold) continue;

        const rewardEl = slot.querySelector('.icon-conservation span');
        if (rewardEl) {
          const cp = parseInt(rewardEl.textContent.trim(), 10);
          if (!isNaN(cp) && (bestReward === null || cp > bestReward)) {
            bestReward = cp;
          }
        } else {
          // Can support but can't read reward
          if (bestReward === null) bestReward = 0;
        }
      }

      if (bestReward !== null) {
        cardEl.classList.add('ank-project-highlight');
        const label = document.createElement('span');
        label.className = 'ank-label ank-support-label';
        label.textContent = bestReward > 0 ? `Can support (${bestReward} CP)` : 'Can support';
        cardEl.appendChild(label);
      }
    }
  }

  return { refresh, highlightHandProjects };
})();
