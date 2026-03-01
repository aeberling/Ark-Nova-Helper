/**
 * Sidebar panel UI for Ark Nova Helper.
 * Creates and manages the collapsible panel with highlight toggles and conservation race.
 */
const ArkSidebar = (() => {
  const SIDEBAR_ID = 'ank-helper-sidebar';
  let _playerId = null;
  let _onToggleChange = null;
  const _toggles = { scoring: true, projects: true, newCards: true };
  let _reminders = [];

  function _getTableId() {
    const match = window.location.pathname.match(/\/(\d+)\//);
    return match ? match[1] : 'unknown';
  }

  function _remindersKey() {
    return `ank-reminders-${_getTableId()}`;
  }

  function _loadReminders() {
    try {
      const data = localStorage.getItem(_remindersKey());
      _reminders = data ? JSON.parse(data) : [];
    } catch {
      _reminders = [];
    }
  }

  function _saveReminders() {
    localStorage.setItem(_remindersKey(), JSON.stringify(_reminders));
  }

  function _renderReminders() {
    const list = document.getElementById('ank-reminders-list');
    if (!list) return;
    list.innerHTML = '';
    _reminders.forEach((text, i) => {
      const li = document.createElement('li');
      li.className = 'ank-reminders-item';
      li.innerHTML = `
        <button class="ank-reminders-remove" data-index="${i}" title="Remove">&times;</button>
        <span class="ank-reminders-item-text"></span>
      `;
      li.querySelector('.ank-reminders-item-text').textContent = text;
      list.appendChild(li);
    });
  }

  function _initReminders() {
    _loadReminders();
    _renderReminders();

    const input = document.getElementById('ank-reminders-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const text = input.value.trim();
          if (!text) return;
          _reminders.push(text);
          _saveReminders();
          _renderReminders();
          input.value = '';
        }
      });
    }

    const list = document.getElementById('ank-reminders-list');
    if (list) {
      list.addEventListener('click', (e) => {
        const btn = e.target.closest('.ank-reminders-remove');
        if (!btn) return;
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (idx >= 0 && idx < _reminders.length) {
          _reminders.splice(idx, 1);
          _saveReminders();
          _renderReminders();
        }
      });
    }
  }

  // Sponsor cards with passive abilities worth surfacing in the reminders panel.
  const AUTO_REMINDER_SPONSORS = [
    { cardId: 'S203_Veterinarian', name: 'Veterinarian', text: 'Association: do projects at strength 4' },
    { cardId: 'S219_DiversityResearcher', name: 'Diversity Researcher', text: 'Build anywhere, ignore rock/water requirements' },
    { cardId: 'S229_ExpertInSmallAnimals', name: 'Expert in Small Animals', text: 'Animals with enclosure \u22642: cost -3' },
    { cardId: 'S230_ExpertInLargeAnimals', name: 'Expert in Large Animals', text: 'Animals with enclosure \u22654: cost -4' },
    { cardId: 'S224_MigrationRecording', name: 'Migration Recording', text: 'Release projects give +1 conservation' },
    { cardId: 'S236_Primatologist', name: 'Primatologist', text: 'Playing a Primate: +3 money' },
    { cardId: 'S237_Herpetologist', name: 'Herpetologist', text: 'Playing a Reptile: +3 money' },
    { cardId: 'S238_Ornithologist', name: 'Ornithologist', text: 'Playing a Bird: +3 money' },
    { cardId: 'S239_ExpertInPredators', name: 'Expert in Predators', text: 'Playing a Predator: +3 money' },
    { cardId: 'S240_ExpertInHerbivores', name: 'Expert in Herbivores', text: 'Playing an Herbivore: +3 money' },
    { cardId: 'S266_MarineBiologist', name: 'Marine Biologist', text: 'Playing a Sea Animal: +3 money' },
  ];

  function _renderAutoReminders() {
    const list = document.getElementById('ank-auto-reminders-list');
    if (!list) return;
    list.innerHTML = '';
    if (!_playerId) return;

    const sponsorArea = document.getElementById(`inPlay-sponsors-${_playerId}`);
    if (!sponsorArea) return;

    for (const sponsor of AUTO_REMINDER_SPONSORS) {
      if (!sponsorArea.querySelector(`[data-id="${sponsor.cardId}"]`)) continue;
      const li = document.createElement('li');
      li.className = 'ank-reminders-item ank-reminders-auto';
      li.innerHTML = `
        <span class="ank-reminders-auto-icon" title="Auto-detected from played sponsors">&#9733;</span>
        <span class="ank-reminders-item-text"></span>
      `;
      li.querySelector('.ank-reminders-item-text').textContent = `${sponsor.name}: ${sponsor.text}`;
      list.appendChild(li);
    }
  }

  /**
   * Create and inject the sidebar panel into the page.
   * @param {string} playerId
   */
  function create(playerId) {
    _playerId = playerId;

    // Remove existing if any
    const existing = document.getElementById(SIDEBAR_ID);
    if (existing) existing.remove();

    const sidebar = document.createElement('div');
    sidebar.id = SIDEBAR_ID;
    sidebar.className = 'ank-sidebar ank-collapsed';
    sidebar.innerHTML = `
      <button id="ank-sidebar-toggle" class="ank-sidebar-toggle" title="Toggle Ark Nova Helper">
        <span class="ank-toggle-icon">&#9650;</span>
        <span class="ank-toggle-label">Ark Nova Helper</span>
        <span id="ank-toggle-action" class="ank-toggle-action"></span>
      </button>
      <div class="ank-sidebar-content">
        <div class="ank-sidebar-left">
          <div class="ank-section">
            <h4 class="ank-section-title">Reminders</h4>
            <input type="text" id="ank-reminders-input" class="ank-reminders-input" placeholder="Add a reminder and press Enter">
            <ul id="ank-reminders-list" class="ank-reminders-list"></ul>
            <ul id="ank-auto-reminders-list" class="ank-reminders-list"></ul>
          </div>

          <div class="ank-section">
            <h4 class="ank-section-title">Game Summary</h4>
            <div id="ank-game-summary">
              <div class="ank-empty-state">Loading...</div>
            </div>
          </div>
        </div>

        <div class="ank-sidebar-right">
          <div class="ank-section">
            <h4 class="ank-section-title">Action Plan</h4>
            <div id="ank-plan-rows-container" class="ank-plan-rows-container"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(sidebar);

    // Toggle collapse
    document.getElementById('ank-sidebar-toggle').addEventListener('click', () => {
      sidebar.classList.toggle('ank-collapsed');
      const icon = sidebar.querySelector('.ank-toggle-icon');
      icon.textContent = sidebar.classList.contains('ank-collapsed') ? '\u25B2' : '\u25BC';
    });

    _initReminders();
  }

  /**
   * Register a callback that fires when any highlight toggle changes.
   * @param {Function} fn
   */
  function onToggleChange(fn) {
    _onToggleChange = fn;
  }

  /**
   * Get current toggle state.
   * @returns {{scoring: boolean, projects: boolean}}
   */
  function getToggles() {
    return _toggles;
  }

  /**
   * Inject highlight toggles into the BGA settings panel.
   */
  function injectSettings() {
    const container = document.getElementById('settings-controls-container');
    if (!container) return;

    // Remove existing if re-injected
    const existing = document.getElementById('ank-settings-section');
    if (existing) existing.remove();

    const section = document.createElement('div');
    section.id = 'ank-settings-section';
    section.innerHTML = `
      <div class="ank-settings-divider">Ark Nova Helper</div>

      <div class="row-data row-data-large row-data-switch">
        <div class="row-label">
          <span class="ank-swatch" style="background: #ffd700;"></span>
          Scoring Card Highlights
        </div>
        <div class="row-value">
          <label class="switch" for="ank-toggle-scoring">
            <input type="checkbox" id="ank-toggle-scoring" checked />
            <div class="slider round"></div>
          </label>
        </div>
      </div>

      <div class="row-data row-data-large row-data-switch">
        <div class="row-label">
          <span class="ank-swatch" style="background: #2c6e49;"></span>
          Conservation Projects
        </div>
        <div class="row-value">
          <label class="switch" for="ank-toggle-projects">
            <input type="checkbox" id="ank-toggle-projects" checked />
            <div class="slider round"></div>
          </label>
        </div>
      </div>

      <div class="row-data row-data-large row-data-switch">
        <div class="row-label">
          <span class="ank-swatch" style="background: #3b9dff;"></span>
          New in Pool
          <button id="ank-reset-new" class="ank-reset-btn" title="Mark all current pool cards as seen">Reset</button>
        </div>
        <div class="row-value">
          <label class="switch" for="ank-toggle-new-cards">
            <input type="checkbox" id="ank-toggle-new-cards" checked />
            <div class="slider round"></div>
          </label>
        </div>
      </div>
    `;

    container.appendChild(section);

    // Attach event listeners
    document.getElementById('ank-toggle-scoring').addEventListener('change', (e) => {
      _toggles.scoring = e.target.checked;
      if (_onToggleChange) _onToggleChange();
    });

    document.getElementById('ank-toggle-projects').addEventListener('change', (e) => {
      _toggles.projects = e.target.checked;
      if (_onToggleChange) _onToggleChange();
    });

    document.getElementById('ank-toggle-new-cards').addEventListener('change', (e) => {
      _toggles.newCards = e.target.checked;
      if (_onToggleChange) _onToggleChange();
    });

    document.getElementById('ank-reset-new').addEventListener('click', (e) => {
      e.stopPropagation();
      ArkCardHighlighter.resetNewCards();
      if (_onToggleChange) _onToggleChange();
    });
  }

  /**
   * Update the game summary section with player scores and break counter.
   */
  function updateGameSummary() {
    const container = document.getElementById('ank-game-summary');
    if (!container) return;

    // Read player scores
    const players = [];
    document.querySelectorAll('[id^="counter-"][id$="-conservation"]').forEach((el) => {
      const match = el.id.match(/^counter-(\d+)-conservation$/);
      if (!match) return;
      const pId = match[1];

      // Player name and color
      const nameEl =
        document.querySelector(`#player_name_${pId} a`) ||
        document.getElementById(`player_name_${pId}`);
      const name = nameEl ? nameEl.textContent.trim() : `Player ${pId}`;
      const colorLink = document.querySelector(`#player_name_${pId} a`);
      const color = colorLink ? colorLink.style.color || '#666' : '#666';

      // Score from player panel (star score)
      const scoreEl =
        document.getElementById(`player_new_score_${pId}`) ||
        document.getElementById(`player_score_${pId}`);
      const score = scoreEl ? parseInt(scoreEl.textContent.trim(), 10) || 0 : 0;

      players.push({ id: pId, name, color, score });
    });

    // Sort by score descending
    players.sort((a, b) => b.score - a.score);

    // Read break counter
    const breakEl = document.getElementById('break-counter');
    const breakMaxEl = document.getElementById('break-counter-max');
    const breakCount = breakEl ? breakEl.textContent.trim() : '?';
    const breakMax = breakMaxEl ? breakMaxEl.textContent.trim() : '';

    if (players.length === 0) {
      container.innerHTML = '<div class="ank-empty-state">No player data found</div>';
      return;
    }

    container.innerHTML = `
      <table class="ank-conservation-table">
        <thead>
          <tr>
            <th>Player</th>
            <th title="Score (next to star in player panel)">Score</th>
          </tr>
        </thead>
        <tbody>
          ${players
            .map(
              (p) => `
            <tr class="${p.id === _playerId ? 'ank-current-player' : ''}">
              <td style="color: ${p.color}; font-weight: bold;">${p.name}</td>
              <td>${p.score}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <div class="ank-break-counter">
        <span class="ank-break-label">Break:</span>
        <span class="ank-break-value">${breakCount}</span><span class="ank-break-max">${breakMax}</span>
      </div>
    `;
  }

  /**
   * Update the toggle button to show the selected action from row 0.
   */
  function _updateToggleAction() {
    const el = document.getElementById('ank-toggle-action');
    if (!el) return;
    const selection = ArkActionPlanner.getFirstRowSelection();
    if (!selection) {
      el.innerHTML = '';
      el.classList.remove('ank-toggle-action-active');
      return;
    }
    el.classList.add('ank-toggle-action-active');
    el.innerHTML = `
      <span class="ank-toggle-action-card">
        <span class="ank-toggle-action-icon action-cards-summary">
          <div>
            <div class="summary-action-card" data-type="${selection.displayName}" data-lvl="${selection.lvl}" data-number="${selection.number}">
              <div class="icon-container icon-container-action-${selection.type}">
                <div class="arknova-icon icon-action-${selection.type}"></div>
              </div>
            </div>
          </div>
        </span>
      </span>
    `;
  }

  /**
   * Initialize the action planner in the right column.
   * Call after create().
   */
  function initActionPlan(playerId) {
    const container = document.getElementById('ank-plan-rows-container');
    if (container) {
      ArkActionPlanner.onRender(_updateToggleAction);
      ArkActionPlanner.init(playerId, container);
    }
  }

  /**
   * Refresh action plan from BGA DOM.
   */
  function refreshActionPlan() {
    ArkActionPlanner.refreshFromDOM();
  }

  /**
   * Full refresh of all sidebar sections.
   */
  function refresh() {
    updateGameSummary();
    _renderAutoReminders();
  }

  return {
    create,
    injectSettings,
    onToggleChange,
    getToggles,
    updateGameSummary,
    initActionPlan,
    refreshActionPlan,
    refresh,
  };
})();
