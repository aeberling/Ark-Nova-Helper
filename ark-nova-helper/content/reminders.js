/**
 * Ability reminders for Ark Nova Helper.
 * Detects played sponsor cards with passive abilities and shows reminder labels
 * on relevant game elements and matching cards in the pool/hand.
 */
const ArkReminders = (() => {
  const REMINDER_CLASS = 'ank-reminder';

  // Reminders that target a single game element (action card, zoo map).
  const ELEMENT_REMINDERS = [
    {
      cardId: 'S203_Veterinarian',
      label: 'Projects at 4',
      target: 'action-card',
      actionType: 'Association',
    },
    {
      cardId: 'S219_DiversityResearcher',
      label: 'Build anywhere, ignore rock/water',
      target: 'zoo-map',
    },
  ];

  // Sponsor cards that give a cost discount on animals by enclosure size.
  const COST_DISCOUNT_SPONSORS = [
    { cardId: 'S229_ExpertInSmallAnimals', discount: 3, match: 'enclosure-max', matchValue: 2 },
    { cardId: 'S230_ExpertInLargeAnimals', discount: 4, match: 'enclosure-min', matchValue: 4 },
  ];

  // Continent names for partner zoo detection.
  const CONTINENTS = ['Africa', 'Americas', 'Asia', 'Australia', 'Europe'];

  // Sponsor cards that pay money when a card with a matching icon is played.
  const LISTENING_SPONSORS = [
    { cardId: 'S236_Primatologist', icon: 'Primate', money: 3 },
    { cardId: 'S237_Herpetologist', icon: 'Reptile', money: 3 },
    { cardId: 'S238_Ornithologist', icon: 'Bird', money: 3 },
    { cardId: 'S239_ExpertInPredators', icon: 'Predator', money: 3 },
    { cardId: 'S240_ExpertInHerbivores', icon: 'Herbivore', money: 3 },
    { cardId: 'S266_MarineBiologist', icon: 'SeaAnimal', money: 3 },
  ];

  /**
   * Clear all reminder labels.
   */
  function clear() {
    document.querySelectorAll(`.${REMINDER_CLASS}`).forEach((el) => el.remove());
  }

  /**
   * Read enclosure size from a card element.
   */
  function readEnclosureSize(cardEl) {
    // Match regular, not-regular, and special enclosure types (petting zoo, aquarium, etc.)
    const el = cardEl.querySelector(
      '[class*="icon-enclosure-regular"], [class*="icon-enclosure-not-regular"], [class*="icon-enclosure-special-"]'
    );
    if (!el) return null;
    const size = parseInt(el.textContent.trim(), 10);
    return isNaN(size) ? null : size;
  }

  /**
   * Add a reminder badge to a card element.
   * @param {Element} cardEl
   * @param {string} text
   * @param {string} [extraClass]
   */
  function addBadge(cardEl, text, extraClass) {
    const label = document.createElement('span');
    label.className = `${REMINDER_CLASS} ank-reminder-card ${extraClass || ''}`;
    label.textContent = text;
    cardEl.style.position = 'relative';
    cardEl.appendChild(label);
  }

  /**
   * Collect all visible zoo-card elements from pool, hand, and floating hand.
   * @param {string} playerId
   * @param {string} [selector] - additional selector to narrow matches
   * @returns {Element[]}
   */
  function collectVisibleCards(playerId, selector) {
    const sel = selector ? `.ark-card.zoo-card${selector}` : '.ark-card.zoo-card';
    const els = [];

    const pool = document.getElementById('cards-pool');
    if (pool) els.push(...pool.querySelectorAll(sel));

    const hand = document.getElementById(`hand-${playerId}`);
    if (hand) els.push(...hand.querySelectorAll(sel));

    const floatingHand = document.getElementById('floating-hand');
    if (floatingHand) {
      const handSection = floatingHand.querySelector('.player-board-hand');
      if (handSection) els.push(...handSection.querySelectorAll(sel));
    }

    return els;
  }

  /**
   * Check played sponsors and add reminder labels.
   * @param {string} playerId
   */
  function refresh(playerId) {
    clear();
    if (!playerId) return;

    const sponsorArea = document.getElementById(`inPlay-sponsors-${playerId}`);
    if (!sponsorArea) return;

    // Element-targeted reminders
    for (const reminder of ELEMENT_REMINDERS) {
      const card = sponsorArea.querySelector(`[data-id="${reminder.cardId}"]`);
      if (!card) continue;

      if (reminder.target === 'action-card') {
        addActionCardReminder(playerId, reminder);
      } else if (reminder.target === 'zoo-map') {
        addZooMapReminder(playerId, reminder);
      }
    }

    // Card cost/earn labels on animal cards in pool/hand
    addCardLabels(playerId, sponsorArea);

    // Migration Recording synergy
    handleMigrationRecording(playerId, sponsorArea);
  }

  /**
   * Add a reminder label to a specific action card type.
   */
  function addActionCardReminder(playerId, reminder) {
    for (let slot = 1; slot <= 6; slot++) {
      const slotEl = document.getElementById(`action-card-slot-${playerId}-${slot}`);
      if (!slotEl) continue;
      const actionCard = slotEl.querySelector(`.action-card[data-type="${reminder.actionType}"]`);
      if (actionCard) {
        const label = document.createElement('span');
        label.className = `${REMINDER_CLASS} ank-reminder-action`;
        label.textContent = reminder.label;
        actionCard.style.position = 'relative';
        actionCard.appendChild(label);
        break;
      }
    }
  }

  /**
   * Add a reminder label near the player's zoo map.
   */
  function addZooMapReminder(playerId, reminder) {
    const mapEl = document.getElementById(`zoo-map-${playerId}`);
    if (!mapEl) return;

    const label = document.createElement('span');
    label.className = `${REMINDER_CLASS} ank-reminder-map`;
    label.textContent = reminder.label;
    mapEl.style.position = 'relative';
    mapEl.appendChild(label);
  }

  /**
   * Count partner zoos for a given continent from the player's zoo map.
   * @param {string} playerId
   * @param {string} continent - e.g. "Africa"
   * @returns {number}
   */
  function countPartnerZoos(playerId, continent) {
    const mapEl = document.getElementById(`zoo-map-${playerId}`);
    if (!mapEl) return 0;
    return mapEl.querySelectorAll(
      `.zoo-map-partner-zoos .arknova-meeple.icon-partner-${continent}`
    ).length;
  }

  /**
   * Read which continents a card has from its badge icons.
   * @param {Element} cardEl
   * @returns {string[]}
   */
  function readCardContinents(cardEl) {
    const result = [];
    for (const c of CONTINENTS) {
      if (cardEl.querySelector(`.badge-icon[data-type="${c}"]`)) {
        result.push(c);
      }
    }
    return result;
  }

  /**
   * Read which category icons a card has (Predator, Bird, etc.).
   * @param {Element} cardEl
   * @returns {string[]}
   */
  function readCardIcons(cardEl) {
    const icons = [];
    // Only read badges from the top-right area (card tags), not prerequisites
    const scope = cardEl.querySelector('.ark-card-top-right') || cardEl;
    const badgeEls = scope.querySelectorAll('.badge-icon[data-type]');
    for (const el of badgeEls) {
      icons.push(el.getAttribute('data-type'));
    }
    return icons;
  }

  /**
   * Add money icon indicators (discount and/or earn) to the bottom-left of a card.
   */
  function addMoneyIcons(cardEl, discount, earn) {
    const container = document.createElement('div');
    container.className = `${REMINDER_CLASS} ank-money-icons`;
    cardEl.style.position = 'relative';

    if (discount > 0) {
      const icon = document.createElement('div');
      icon.className = 'arknova-icon icon-money ank-money-discount';
      icon.textContent = `-${discount}`;
      container.appendChild(icon);
    }

    if (earn > 0) {
      const icon = document.createElement('div');
      icon.className = 'arknova-icon icon-money ank-money-earn';
      icon.textContent = `+${earn}`;
      container.appendChild(icon);
    }

    cardEl.appendChild(container);
  }

  /**
   * Add cost discount and earn labels on animal cards in pool and hand.
   * Combines partner zoo discounts, expert sponsor discounts, and listening sponsor earnings.
   */
  function addCardLabels(playerId, sponsorArea) {
    // Determine active cost discount sponsors
    const activeDiscounts = COST_DISCOUNT_SPONSORS.filter((r) =>
      sponsorArea.querySelector(`[data-id="${r.cardId}"]`)
    );

    // Determine active listening sponsors (pay when playing matching icon)
    const activeListeners = LISTENING_SPONSORS.filter((r) =>
      sponsorArea.querySelector(`[data-id="${r.cardId}"]`)
    );

    // Pre-compute partner zoo counts per continent
    const partnerZooCounts = {};
    for (const c of CONTINENTS) {
      partnerZooCounts[c] = countPartnerZoos(playerId, c);
    }
    const hasAnyPartnerZoo = Object.values(partnerZooCounts).some((n) => n > 0);

    // Nothing to label
    if (activeDiscounts.length === 0 && activeListeners.length === 0 && !hasAnyPartnerZoo) return;

    const cardEls = [];
    const pool = document.getElementById('cards-pool');
    if (pool) cardEls.push(...pool.querySelectorAll('.ark-card.zoo-card.animal-card'));

    const hand = document.getElementById(`hand-${playerId}`);
    if (hand) cardEls.push(...hand.querySelectorAll('.ark-card.zoo-card.animal-card'));

    const floatingHand = document.getElementById('floating-hand');
    if (floatingHand) {
      const handSection = floatingHand.querySelector('.player-board-hand');
      if (handSection) cardEls.push(...handSection.querySelectorAll('.ark-card.zoo-card.animal-card'));
    }

    // Deduplicate
    const seen = new Set();
    for (const cardEl of cardEls) {
      const id = cardEl.getAttribute('data-id') || cardEl.id;
      if (seen.has(id)) continue;
      seen.add(id);

      const size = readEnclosureSize(cardEl);
      const continents = readCardContinents(cardEl);
      const icons = readCardIcons(cardEl);

      // --- Cost discount ---
      let totalDiscount = 0;

      // Partner zoo discounts: -3 per matching continent partner zoo
      for (const c of continents) {
        totalDiscount += 3 * (partnerZooCounts[c] || 0);
      }

      // Expert sponsor discounts
      if (size !== null) {
        for (const r of activeDiscounts) {
          if (r.match === 'enclosure-max' && size <= r.matchValue) {
            totalDiscount += r.discount;
          } else if (r.match === 'enclosure-min' && size >= r.matchValue) {
            totalDiscount += r.discount;
          }
        }
      }

      // --- Earn money from listening sponsors ---
      let totalEarn = 0;
      for (const listener of activeListeners) {
        const matchCount = icons.filter((i) => i === listener.icon).length;
        totalEarn += matchCount * listener.money;
      }

      if (totalDiscount > 0 || totalEarn > 0) {
        addMoneyIcons(cardEl, totalDiscount, totalEarn);
      }
    }
  }

  /**
   * Handle Migration Recording (S224) synergy with release project cards.
   * 1. If played: highlight all visible release project cards.
   * 2. If in pool and release projects are visible: highlight Migration Recording.
   */
  function handleMigrationRecording(playerId, sponsorArea) {
    const MIGRATION_ID = 'S224_MigrationRecording';
    const hasMigrationPlayed = !!sponsorArea.querySelector(`[data-id="${MIGRATION_ID}"]`);

    // Find all release project cards anywhere visible
    const releaseProjects = document.querySelectorAll('.project-card.project-release');

    if (hasMigrationPlayed && releaseProjects.length > 0) {
      // Highlight all release project cards with a label
      releaseProjects.forEach((el) => {
        addBadge(el, '+1 CP Mig Recording', 'ank-reminder-migration');
      });
    }

    // Check if Migration Recording is in the pool/hand (not played yet)
    if (!hasMigrationPlayed) {
      const migrationCards = collectVisibleCards(playerId, `[data-id="${MIGRATION_ID}"]`);

      if (migrationCards.length > 0 && releaseProjects.length > 0) {
        // Highlight Migration Recording in the pool/hand
        migrationCards.forEach((el) => {
          addBadge(el, 'Release projects available!', 'ank-reminder-migration');
        });
      }
    }
  }

  return { refresh, clear };
})();
