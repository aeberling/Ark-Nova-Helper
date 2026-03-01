/**
 * MutationObserver management for Ark Nova Helper.
 * Watches the DOM for dynamic changes and triggers updates.
 */
const ArkObserver = (() => {
  const observers = [];
  const debounceTimers = {};

  function debounce(key, fn, delay = 200) {
    clearTimeout(debounceTimers[key]);
    debounceTimers[key] = setTimeout(fn, delay);
  }

  /**
   * Observe an element by ID for mutations.
   * @param {string} elementId
   * @param {MutationObserverInit} config
   * @param {Function} callback
   */
  function observe(elementId, config, callback) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const observer = new MutationObserver(callback);
    observer.observe(el, config);
    observers.push(observer);
  }

  /**
   * Observe an element directly.
   * @param {Element} el
   * @param {MutationObserverInit} config
   * @param {Function} callback
   */
  function observeElement(el, config, callback) {
    if (!el) return;
    const observer = new MutationObserver(callback);
    observer.observe(el, config);
    observers.push(observer);
  }

  /**
   * Initialize all observers for the game.
   * @param {string} playerId
   * @param {object} callbacks - { onPoolChange, onHandChange, onScoringChange, onCounterChange, onInPlayChange, onActionCardChange }
   */
  function init(playerId, callbacks) {
    // Card pool changes (new cards appear/disappear)
    observe('cards-pool', { childList: true, subtree: true }, () => {
      debounce('pool', callbacks.onPoolChange, 250);
    });

    // Player hand changes (on-board hand)
    observe(`hand-${playerId}`, { childList: true, subtree: true }, () => {
      debounce('hand', callbacks.onHandChange, 250);
    });

    // Floating hand changes
    observe('floating-hand', { childList: true, subtree: true }, () => {
      debounce('floating-hand', callbacks.onHandChange, 250);
    });

    // Scoring hand changes (card added/removed)
    observe(`scoring-hand-${playerId}`, { childList: true }, () => {
      debounce('scoring', callbacks.onScoringChange, 300);
    });

    // Conservation and appeal counters for all players
    document
      .querySelectorAll(
        '[id^="counter-"][id$="-conservation"], [id^="counter-"][id$="-appeal"]'
      )
      .forEach((el) => {
        observeElement(el, { childList: true, characterData: true, subtree: true }, () => {
          debounce('counters', callbacks.onCounterChange, 300);
        });
      });

    // In-play animals and sponsors (for progress tracking)
    document.querySelectorAll('[id^="inPlay-animals-"], [id^="inPlay-sponsors-"]').forEach((el) => {
      observeElement(el, { childList: true, subtree: true }, () => {
        debounce('inplay', callbacks.onInPlayChange, 300);
      });
    });

    // Conservation project holders (cubes placed/removed)
    const projectHolders = document.querySelectorAll(
      '#base-projects-holder, #projects-holder'
    );
    projectHolders.forEach((el) => {
      observeElement(el, { childList: true, subtree: true }, () => {
        debounce('projects', callbacks.onProjectChange, 300);
      });
    });

    // Action cards summary (slot positions and upgrades)
    if (callbacks.onActionCardChange) {
      const board = document.getElementById(`overall_player_board_${playerId}`);
      if (board) {
        const actionSummary = board.querySelector('.action-cards-summary');
        if (actionSummary) {
          observeElement(
            actionSummary,
            { attributes: true, childList: true, subtree: true, attributeFilter: ['data-type', 'data-lvl', 'class'] },
            () => {
              debounce('actioncards', callbacks.onActionCardChange, 300);
            }
          );
        }
      }
    }
  }

  /**
   * Disconnect all observers.
   */
  function destroy() {
    observers.forEach((obs) => obs.disconnect());
    observers.length = 0;
    Object.keys(debounceTimers).forEach((key) => clearTimeout(debounceTimers[key]));
  }

  return {
    init,
    destroy,
  };
})();
