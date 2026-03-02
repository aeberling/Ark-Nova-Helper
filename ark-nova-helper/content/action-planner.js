/**
 * Action Planner module for Ark Nova Helper.
 * Lets users plan future turns by selecting action cards and seeing how positions cascade.
 */
const ArkActionPlanner = (() => {
  const ACTION_TYPES = ['build', 'sponsors', 'association', 'animals', 'cards'];
  const DISPLAY_NAMES = {
    build: 'Build',
    sponsors: 'Sponsors',
    association: 'Association',
    animals: 'Animals',
    cards: 'Cards',
  };

  let _playerId = null;
  let _tableId = null;
  let _rows = [];
  let _cardLevels = {};   // { type: lvl }
  let _cardNumbers = {};  // { type: number string }
  let _container = null;
  let _dragFromIndex = null;
  let _cardDragState = null; // { rowIndex, fromIndex } for card-level drag
  let _onRenderCallback = null;


  /**
   * Extract table ID from URL for localStorage key.
   */
  function getTableId() {
    const match = window.location.pathname.match(/\/(\d+)\//);
    return match ? match[1] : 'unknown';
  }

  /**
   * Read current action card state from BGA DOM.
   * Returns array sorted by slot: [{ type, lvl, number, slot }]
   */
  function readCurrentCards(playerId) {
    const board = document.getElementById(`overall_player_board_${playerId}`);
    if (!board) return null;

    const summary = board.querySelector('.action-cards-summary');
    if (!summary) return null;

    const cards = [];
    for (let slot = 1; slot <= 5; slot++) {
      const slotEl = summary.querySelector(`.slot-${slot}`);
      if (!slotEl) continue;
      const cardEl = slotEl.querySelector('.summary-action-card');
      if (!cardEl) continue;
      const type = (cardEl.dataset.type || '').toLowerCase();
      const lvl = parseInt(cardEl.dataset.lvl, 10) || 1;
      const number = cardEl.dataset.number || '0';
      if (type && ACTION_TYPES.includes(type)) {
        cards.push({ type, lvl, number, slot });
      }
    }

    cards.sort((a, b) => a.slot - b.slot);
    return cards.length === 5 ? cards : null;
  }

  /**
   * Get localStorage key.
   */
  function storageKey() {
    return `ank-action-plan-${_tableId}`;
  }

  /**
   * Save state to localStorage.
   */
  function save() {
    try {
      localStorage.setItem(
        storageKey(),
        JSON.stringify({ rows: _rows, cardLevels: _cardLevels, cardNumbers: _cardNumbers })
      );
    } catch (e) {
      // quota exceeded or private mode
    }
  }

  /**
   * Restore state from localStorage.
   * Returns true if successfully restored.
   */
  function restore() {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey()));
      if (data && Array.isArray(data.rows) && data.rows.length > 0) {
        _rows = data.rows;
        if (data.cardLevels) _cardLevels = data.cardLevels;
        if (data.cardNumbers) _cardNumbers = data.cardNumbers;
        return true;
      }
    } catch (e) {
      // corrupted data
    }
    return false;
  }

  /**
   * Create a default row from a card order array.
   */
  function makeRow(cardOrder, selectedAction, xTokens, notes, manualOrder) {
    return {
      cardOrder: cardOrder.slice(),
      selectedAction: selectedAction || null,
      xTokens: xTokens || 0,
      notes: notes || '',
      manualOrder: manualOrder || false,
      completed: false,
    };
  }

  /**
   * Get the index of the first non-completed row (the "active" row).
   * Returns -1 if all rows are completed.
   */
  function activeRowIndex() {
    for (let i = 0; i < _rows.length; i++) {
      if (!_rows[i].completed) return i;
    }
    return -1;
  }

  /**
   * Escape HTML entities for safe insertion into templates.
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Compute the next row's card order after selecting an action.
   * When an action at position N is selected:
   * - Remove selected from position N
   * - Place selected at position 0 (slot 1)
   * - Cards that were before position N shift right by 1
   * - Cards that were after position N stay in place
   */
  function computeNextOrder(currentOrder, selectedType) {
    const idx = currentOrder.indexOf(selectedType);
    if (idx === -1) return currentOrder.slice();

    // Remove selected card
    const remaining = currentOrder.filter((_, i) => i !== idx);
    // Selected goes to slot 1 (index 0), others shift right
    return [selectedType, ...remaining];
  }

  /**
   * Recompute all rows from a given index onward.
   * Each row's card order is derived from the previous row's selection.
   */
  function recomputeFrom(startIndex) {
    const activeIdx = activeRowIndex();
    for (let i = startIndex; i < _rows.length; i++) {
      if (_rows[i].completed) continue; // Skip completed rows
      if (i === activeIdx) continue; // Active row is synced from DOM
      if (_rows[i].manualOrder) continue; // Skip manually reordered rows
      if (_rows[i].selectedAction) continue; // Don't overwrite rows with a selection
      const prev = _rows[i - 1];
      if (prev.selectedAction) {
        _rows[i].cardOrder = computeNextOrder(prev.cardOrder, prev.selectedAction);
      }
    }
  }

  /**
   * Handle user clicking on an action card in a row.
   */
  function selectAction(rowIndex, type) {
    const row = _rows[rowIndex];
    if (!row) return;
    if (row.completed) return; // Can't change completed rows

    // Toggle off if clicking same action
    if (row.selectedAction === type) {
      row.selectedAction = null;
      // Remove any rows below that were auto-generated
      _rows.length = rowIndex + 1;
    } else {
      row.selectedAction = type;

      // Compute next card order
      const nextOrder = computeNextOrder(row.cardOrder, type);

      // If this is the last row, add a new row
      if (rowIndex === _rows.length - 1) {
        _rows.push(makeRow(nextOrder));
      } else {
        // Update next row's card order and recompute (skip if manually ordered)
        if (!_rows[rowIndex + 1].manualOrder) {
          _rows[rowIndex + 1].cardOrder = nextOrder;
        }
        recomputeFrom(rowIndex + 2);
      }
    }

    save();
    render();
  }

  /**
   * Reset the top row's card order and selection to match current BGA DOM state.
   */
  function syncTopRow() {
    if (!_playerId) return;
    const cards = readCurrentCards(_playerId);
    if (!cards) return;
    const newOrder = cards.map((c) => c.type);
    if (_rows.length > 0) {
      _rows[0].cardOrder = newOrder;
      _rows[0].selectedAction = null;
      _rows[0].manualOrder = false;
      save();
      render();
    }
  }

  /**
   * Delete a row. Any row can be deleted as long as it's not the last one.
   */
  function deleteRow(rowIndex) {
    if (rowIndex < 0 || rowIndex >= _rows.length) return;
    if (_rows.length <= 1) return; // Never delete the last row

    _rows.splice(rowIndex, 1);
    recomputeFrom(rowIndex);
    save();
    render();
  }

  /**
   * Update X-token counter for a row.
   */
  function updateXTokens(rowIndex, delta) {
    const row = _rows[rowIndex];
    if (!row) return;
    row.xTokens = Math.max(0, row.xTokens + delta);
    save();
    // Update counter display and slot numbers without full re-render
    const rowEl = _container?.querySelector(`.ank-plan-row[data-row="${rowIndex}"]`);
    if (!rowEl) return;
    const counterEl = rowEl.querySelector('.ank-plan-x-value');
    if (counterEl) {
      counterEl.textContent = row.xTokens;
      counterEl.classList.toggle('ank-plan-x-nonzero', row.xTokens > 0);
    }
    // Update slot numbers to reflect effective strength (slot + xTokens)
    rowEl.querySelectorAll('.ank-plan-card').forEach((cardEl) => {
      const slot = parseInt(cardEl.dataset.slot, 10);
      const numEl = cardEl.querySelector('.ank-plan-slot-num');
      if (numEl) numEl.textContent = slot + row.xTokens;
    });
  }

  /**
   * Handle drag-and-drop reorder of rows.
   */
  function reorderRows(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= _rows.length || toIndex >= _rows.length) return;
    const activeIdx = activeRowIndex();
    if (_rows[fromIndex]?.completed || fromIndex === activeIdx) return;
    if (_rows[toIndex]?.completed || toIndex === activeIdx) return;

    const [moved] = _rows.splice(fromIndex, 1);
    _rows.splice(toIndex, 0, moved);

    // Recompute all rows since order changed
    recomputeFrom(1);
    save();
    render();
  }

  /**
   * Reorder action cards within a row via drag-and-drop.
   */
  function reorderCards(rowIndex, fromCardIndex, toCardIndex) {
    const row = _rows[rowIndex];
    if (!row) return;
    if (fromCardIndex === toCardIndex) return;

    const [moved] = row.cardOrder.splice(fromCardIndex, 1);
    row.cardOrder.splice(toCardIndex, 0, moved);
    row.manualOrder = true;

    recomputeFrom(rowIndex + 1);
    save();
    render();
  }

  /**
   * Reset a row's manual order, recomputing from the previous row (or BGA DOM for row 0).
   */
  function resetManualOrder(rowIndex) {
    const row = _rows[rowIndex];
    if (!row || !row.manualOrder) return;
    row.manualOrder = false;

    if (rowIndex === 0 && _playerId) {
      const cards = readCurrentCards(_playerId);
      if (cards) {
        row.cardOrder = cards.map((c) => c.type);
      }
    } else if (rowIndex > 0) {
      const prev = _rows[rowIndex - 1];
      if (prev.selectedAction) {
        row.cardOrder = computeNextOrder(prev.cardOrder, prev.selectedAction);
      }
    }

    recomputeFrom(rowIndex + 1);
    save();
    render();
  }

  /**
   * Build the HTML for a single action card icon.
   * Wraps in BGA's .action-cards-summary > div > .summary-action-card structure
   * so that BGA's CSS rules for borders, box-shadow, and ::before circle apply.
   */
  function renderCardIcon(type, slot, xTokens) {
    const lvl = _cardLevels[type] || 1;
    const number = _cardNumbers[type] || '0';
    const displayType = DISPLAY_NAMES[type] || type;
    const effective = slot + (xTokens || 0);
    return `
      <div class="ank-plan-card" data-type="${type}" data-slot="${slot}" draggable="true" title="${displayType} (Strength ${effective}${xTokens ? ' = ' + slot + '+' + xTokens + 'X' : ''})">
        <span class="ank-plan-slot-num">${effective}</span>
        <div class="ank-plan-card-icon action-cards-summary">
          <div>
            <div class="summary-action-card" data-type="${displayType}" data-lvl="${lvl}" data-number="${number}">
              <div class="icon-container icon-container-action-${type}">
                <div class="arknova-icon icon-action-${type}"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Build and render all rows into the container.
   */
  function render() {
    if (!_container) return;
    const activeIdx = activeRowIndex();

    let html = '';
    for (let i = 0; i < _rows.length; i++) {
      const row = _rows[i];
      const isCompleted = !!row.completed;
      const isActive = i === activeIdx;
      const canDrag = !isCompleted && !isActive;
      const showDelete = _rows.length > 1;
      const cardsHtml = row.cardOrder
        .map((type, idx) => renderCardIcon(type, idx + 1, row.xTokens))
        .join('');

      html += `
        <div class="ank-plan-row ${row.selectedAction ? 'ank-plan-row-has-selection' : ''} ${isCompleted ? 'ank-plan-row-completed' : ''}"
             data-row="${i}" draggable="${canDrag ? 'true' : 'false'}">
          <div class="ank-plan-drag-handle ${canDrag ? '' : 'ank-plan-drag-disabled'}" title="${isCompleted ? 'Completed' : isActive ? 'Current state' : 'Drag to reorder'}">${isCompleted ? '&#10003;' : '&#10495;'}</div>
          <div class="ank-plan-x-counter">
            <button class="ank-plan-x-minus" data-row="${i}" title="Remove X-token">-</button>
            <span class="ank-plan-x-value ${row.xTokens > 0 ? 'ank-plan-x-nonzero' : ''}">${row.xTokens}</span>
            <button class="ank-plan-x-plus" data-row="${i}" title="Add X-token">+</button>
          </div>
          <div class="ank-plan-cards">
            ${cardsHtml}
          </div>
          ${row.manualOrder ? `<button class="ank-plan-manual-reset" data-row="${i}" title="Reset to auto order">↺</button>` : '<div class="ank-plan-manual-reset-spacer"></div>'}
          ${i === 0 ? `<button class="ank-plan-sync" data-row="0" title="Reset to current game state">&#8635;</button>` : ''}
          ${showDelete ? `<button class="ank-plan-delete" data-row="${i}" title="${isCompleted ? 'Dismiss' : 'Delete this row'}">&times;</button>` : '<div class="ank-plan-delete-spacer"></div>'}
          <textarea class="ank-plan-notes" data-row="${i}" rows="1" placeholder="Notes...">${escapeHtml(row.notes || '')}</textarea>
        </div>
      `;
    }

    _container.innerHTML = html;

    // Mark selected cards
    _rows.forEach((row, i) => {
      if (row.selectedAction) {
        const cardEl = _container.querySelector(
          `.ank-plan-row[data-row="${i}"] .ank-plan-card[data-type="${row.selectedAction}"]`
        );
        if (cardEl) cardEl.classList.add('ank-plan-card-selected');
      }
    });

    // Attach event listeners
    attachEvents();

    if (_onRenderCallback) _onRenderCallback();
  }

  /**
   * Attach click/drag events to rendered rows.
   */
  function attachEvents() {
    if (!_container) return;

    // Card selection clicks
    _container.querySelectorAll('.ank-plan-card').forEach((el) => {
      el.addEventListener('click', (e) => {
        const rowEl = el.closest('.ank-plan-row');
        const rowIndex = parseInt(rowEl.dataset.row, 10);
        const type = el.dataset.type;
        selectAction(rowIndex, type);
      });
    });

    // Card drag-and-drop (reorder within a row)
    _container.querySelectorAll('.ank-plan-card').forEach((cardEl) => {
      cardEl.addEventListener('dragstart', (e) => {
        e.stopPropagation(); // Prevent row drag
        const rowEl = cardEl.closest('.ank-plan-row');
        const rowIndex = parseInt(rowEl.dataset.row, 10);
        const allCards = Array.from(rowEl.querySelectorAll('.ank-plan-card'));
        const cardIndex = allCards.indexOf(cardEl);
        _cardDragState = { rowIndex, fromIndex: cardIndex };
        cardEl.classList.add('ank-plan-card-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      cardEl.addEventListener('dragend', () => {
        cardEl.classList.remove('ank-plan-card-dragging');
        _container.querySelectorAll('.ank-plan-card-dragover').forEach((el) => {
          el.classList.remove('ank-plan-card-dragover');
        });
        _cardDragState = null;
      });

      cardEl.addEventListener('dragover', (e) => {
        if (!_cardDragState) return;
        const rowEl = cardEl.closest('.ank-plan-row');
        const rowIndex = parseInt(rowEl.dataset.row, 10);
        if (rowIndex !== _cardDragState.rowIndex) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        rowEl.querySelectorAll('.ank-plan-card-dragover').forEach((el) => {
          el.classList.remove('ank-plan-card-dragover');
        });
        cardEl.classList.add('ank-plan-card-dragover');
      });

      cardEl.addEventListener('dragleave', () => {
        cardEl.classList.remove('ank-plan-card-dragover');
      });

      cardEl.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        cardEl.classList.remove('ank-plan-card-dragover');
        if (!_cardDragState) return;
        const rowEl = cardEl.closest('.ank-plan-row');
        const rowIndex = parseInt(rowEl.dataset.row, 10);
        if (rowIndex !== _cardDragState.rowIndex) return;
        const allCards = Array.from(rowEl.querySelectorAll('.ank-plan-card'));
        const toIndex = allCards.indexOf(cardEl);
        if (toIndex !== _cardDragState.fromIndex) {
          reorderCards(rowIndex, _cardDragState.fromIndex, toIndex);
        }
        _cardDragState = null;
      });
    });

    // X-token buttons
    _container.querySelectorAll('.ank-plan-x-minus').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateXTokens(parseInt(btn.dataset.row, 10), -1);
      });
    });

    _container.querySelectorAll('.ank-plan-x-plus').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateXTokens(parseInt(btn.dataset.row, 10), 1);
      });
    });

    // Sync top row button
    _container.querySelectorAll('.ank-plan-sync').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        syncTopRow();
      });
    });

    // Delete buttons
    _container.querySelectorAll('.ank-plan-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteRow(parseInt(btn.dataset.row, 10));
      });
    });

    // Manual order reset buttons
    _container.querySelectorAll('.ank-plan-manual-reset').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetManualOrder(parseInt(btn.dataset.row, 10));
      });
    });

    // Textarea notes
    _container.querySelectorAll('.ank-plan-notes').forEach((ta) => {
      // Prevent drag when interacting with textarea
      ta.addEventListener('dragstart', (e) => e.preventDefault());

      // Auto-resize and save on input
      ta.addEventListener('input', () => {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
        const rowIndex = parseInt(ta.dataset.row, 10);
        if (_rows[rowIndex]) {
          _rows[rowIndex].notes = ta.value;
          save();
        }
      });

      // Auto-resize on initial render if content exists
      if (ta.value) {
        requestAnimationFrame(() => {
          ta.style.height = 'auto';
          ta.style.height = ta.scrollHeight + 'px';
        });
      }
    });

    // Drag-and-drop
    _container.querySelectorAll('.ank-plan-row[draggable="true"]').forEach((rowEl) => {
      rowEl.addEventListener('dragstart', (e) => {
        _dragFromIndex = parseInt(rowEl.dataset.row, 10);
        rowEl.classList.add('ank-plan-row-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      rowEl.addEventListener('dragend', () => {
        rowEl.classList.remove('ank-plan-row-dragging');
        _container.querySelectorAll('.ank-plan-row-dragover').forEach((el) => {
          el.classList.remove('ank-plan-row-dragover');
        });
        _dragFromIndex = null;
      });

      rowEl.addEventListener('dragover', (e) => {
        if (_cardDragState) return; // Card drag in progress
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        rowEl.classList.add('ank-plan-row-dragover');
      });

      rowEl.addEventListener('dragleave', () => {
        rowEl.classList.remove('ank-plan-row-dragover');
      });

      rowEl.addEventListener('drop', (e) => {
        if (_cardDragState) return; // Card drag in progress
        e.preventDefault();
        rowEl.classList.remove('ank-plan-row-dragover');
        const toIndex = parseInt(rowEl.dataset.row, 10);
        if (_dragFromIndex !== null && _dragFromIndex !== toIndex) {
          reorderRows(_dragFromIndex, toIndex);
        }
        _dragFromIndex = null;
      });
    });
  }

  /**
   * Refresh card levels/numbers from BGA DOM and update the active row's order.
   * Does NOT auto-complete, auto-reset, or remove any rows.
   */
  function refreshFromDOM() {
    if (!_playerId) return;
    const cards = readCurrentCards(_playerId);
    if (!cards) return;

    // Update levels and numbers for display
    cards.forEach((c) => {
      _cardLevels[c.type] = c.lvl;
      _cardNumbers[c.type] = c.number;
    });

    // Update active row's card order to match current BGA state,
    // but only if it doesn't already have a selected action.
    const newOrder = cards.map((c) => c.type);
    const activeIdx = activeRowIndex();
    if (activeIdx >= 0 && activeIdx < _rows.length && !_rows[activeIdx].selectedAction) {
      _rows[activeIdx].cardOrder = newOrder;
      save();
    }

    render();
  }

  /**
   * Initialize the action planner.
   * @param {string} playerId
   * @param {Element} container - DOM element to render into
   */
  function init(playerId, container) {
    _playerId = playerId;
    _tableId = getTableId();
    _container = container;

    // Read current state from BGA
    const currentCards = readCurrentCards(playerId);

    if (currentCards) {
      currentCards.forEach((c) => {
        _cardLevels[c.type] = c.lvl;
        _cardNumbers[c.type] = c.number;
      });
      const currentOrder = currentCards.map((c) => c.type);

      // Try to restore from localStorage
      const restored = restore();

      if (restored) {
        // Sync active row with BGA state if it has no selection
        const activeIdx = activeRowIndex();
        if (activeIdx >= 0 && !_rows[activeIdx].selectedAction) {
          _rows[activeIdx].cardOrder = currentOrder;
        }
      } else {
        // Fresh start: row 0 = current state, row 1 = same (pending selection)
        _rows = [makeRow(currentOrder), makeRow(currentOrder)];
      }
    } else {
      // Can't read cards yet, try restoring from storage
      if (!restore()) {
        _rows = [];
      }
    }

    save();
    render();
  }

  /**
   * Register a callback invoked after every render.
   */
  function onRender(fn) {
    _onRenderCallback = fn;
  }

  /**
   * Get the selected action for the first row (row 0), if any.
   * Returns { type, displayName, lvl, number } or null.
   */
  function getFirstRowSelection() {
    const activeIdx = activeRowIndex();
    if (activeIdx < 0 || !_rows[activeIdx]?.selectedAction) return null;
    const type = _rows[activeIdx].selectedAction;
    return {
      type,
      displayName: DISPLAY_NAMES[type] || type,
      lvl: _cardLevels[type] || 1,
      number: _cardNumbers[type] || '0',
    };
  }

  return {
    init,
    render,
    refreshFromDOM,
    readCurrentCards,
    onRender,
    getFirstRowSelection,
  };
})();
