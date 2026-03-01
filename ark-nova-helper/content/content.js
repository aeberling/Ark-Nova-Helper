/**
 * Ark Nova Helper - Content script entry point.
 * Detects Ark Nova on BGA, finds the current player, and initializes all modules.
 */
(() => {
  const GAME_CONTAINER = 'arknova-main-container';
  const MAX_WAIT_MS = 15000;
  const POLL_INTERVAL_MS = 500;

  let playerId = null;
  let scoringCards = [];

  /**
   * Wait for the game container to appear in the DOM.
   */
  function waitForGame() {
    return new Promise((resolve, reject) => {
      // Check immediately
      if (document.getElementById(GAME_CONTAINER)) {
        resolve();
        return;
      }

      const startTime = Date.now();
      const interval = setInterval(() => {
        if (document.getElementById(GAME_CONTAINER)) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - startTime > MAX_WAIT_MS) {
          clearInterval(interval);
          reject(new Error('Ark Nova game container not found'));
        }
      }, POLL_INTERVAL_MS);
    });
  }

  /**
   * Find the current player's ID from the DOM.
   */
  function findPlayerId() {
    const handEl = document.querySelector('[id^="hand-"]');
    if (handEl) {
      const match = handEl.id.match(/^hand-(\d+)$/);
      if (match) return match[1];
    }

    const scoringEl = document.querySelector('[id^="scoring-hand-"]');
    if (scoringEl) {
      const match = scoringEl.id.match(/^scoring-hand-(\d+)$/);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Re-run highlighting and card reminders with current state.
   */
  function refreshHighlights() {
    ArkCardHighlighter.highlightCards(playerId, scoringCards);
    ArkReminders.refresh(playerId);
    ArkProjectCubes.refresh();
    ArkProjectCubes.highlightHandProjects(playerId);
  }

  /**
   * Run the full detection + highlight + sidebar + reminders update cycle.
   */
  function refreshAll() {
    scoringCards = ArkScoringCards.detectScoringCards(playerId);
    refreshHighlights();
    ArkSidebar.refresh();
    ArkReminders.refresh(playerId);
  }

  /**
   * Initialize the extension.
   */
  async function init() {
    try {
      await waitForGame();
    } catch {
      return;
    }

    await new Promise((r) => setTimeout(r, 1000));

    playerId = findPlayerId();
    if (!playerId) {
      console.warn('[Ark Nova Helper] Could not determine player ID. May be spectating.');
    }

    // Create sidebar, inject settings into BGA panel, wire up toggle changes
    ArkSidebar.create(playerId);
    ArkSidebar.injectSettings();
    ArkSidebar.onToggleChange(refreshHighlights);

    // Initialize action planner
    if (playerId) {
      ArkSidebar.initActionPlan(playerId);
    }

    // Snapshot pool before first highlight so all current cards are "known"
    ArkCardHighlighter.snapshotPool();

    // Initial scan
    refreshAll();

    // Set up observers
    if (playerId) {
      ArkObserver.init(playerId, {
        onPoolChange: refreshHighlights,
        onHandChange: refreshHighlights,
        onScoringChange: refreshAll,
        onCounterChange: () => {
          ArkSidebar.updateGameSummary();
        },
        onInPlayChange: refreshHighlights,
        onProjectChange: refreshHighlights,
        onActionCardChange: () => {
          ArkSidebar.refreshActionPlan();
        },
      });
    }

    console.log('[Ark Nova Helper] Initialized for player', playerId);
  }

  init();
})();
