/**
 * Grouped Shopping List Card for Home Assistant
 * Groups items by [CATEGORY] bracket prefixes with emoji headers.
 * Uses DOM diffing (not innerHTML rebuild) so iOS WKWebView doesn't
 * dismiss the keyboard on every hass update.
 */

const CATEGORY_EMOJI = {
  PRODUCE: '🥬',
  MEAT: '🥩',
  DAIRY: '🧀',
  FROZEN: '🧊',
  BAKERY: '🍞',
  PANTRY: '🥫',
  BEVERAGES: '☕',
  SNACKS: '🍿',
  HEALTH: '💊',
  HOUSEHOLD: '🏠',
  OTHER: '📦',
};

const CATEGORY_ORDER = [
  'PRODUCE', 'MEAT', 'DAIRY', 'FROZEN', 'BAKERY',
  'PANTRY', 'BEVERAGES', 'SNACKS', 'HEALTH', 'HOUSEHOLD', 'OTHER',
];

const UNCATEGORIZED_EMOJI = '📝';
const UNCATEGORIZED_LABEL = 'UNCATEGORIZED';

function parseItem(summary) {
  const match = summary.match(/^\[([A-Z]+)\]\s*(.*)$/);
  if (match) {
    return { category: match[1], name: match[2] };
  }
  return { category: null, name: summary };
}

class GroupedShoppingListCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._items = [];
    this._completedCollapsed = true;
    this._debounceTimer = null;
    this._lastEntityState = null;
    this._shellBuilt = false;
    this._initialFetchDone = false;
    this._inputFocused = false;
    this._pendingRender = false;
    // Persistent DOM references
    this._countBadge = null;
    this._addInput = null;
    this._itemsContainer = null;
  }

  static getConfigElement() {
    return document.createElement('grouped-shopping-list-card-editor');
  }

  static getStubConfig() {
    return { entity: 'todo.shopping_list', title: 'Shopping List' };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity (e.g. todo.shopping_list)');
    }
    this._config = { title: 'Shopping List', ...config };
    // Rebuild shell if config changes (e.g. title)
    this._shellBuilt = false;
    this._initialFetchDone = false;
  }

  set hass(hass) {
    this._hass = hass;

    const entityId = this._config.entity;
    if (!entityId) return;

    // Initial fetch on first hass set
    if (!this._initialFetchDone) {
      this._initialFetchDone = true;
      this._fetchItems();
      return;
    }

    // Only re-fetch when our entity's state actually changes
    const stateObj = hass.states[entityId];
    const newState = stateObj ? stateObj.last_changed : null;
    if (newState !== this._lastEntityState) {
      this._lastEntityState = newState;
      this._debouncedFetch();
    }
  }

  _debouncedFetch() {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => this._fetchItems(), 200);
  }

  async _fetchItems() {
    if (!this._hass || !this._config.entity) return;
    try {
      const result = await this._hass.callWS({
        type: 'todo/item/list',
        entity_id: this._config.entity,
      });
      this._items = result.items || [];
      this._renderItems();
    } catch (e) {
      console.error('grouped-shopping-list-card: Failed to fetch items', e);
    }
  }

  async _addItem(name) {
    if (!name.trim()) return;
    try {
      await this._hass.callService('todo', 'add_item', { item: name.trim() }, { entity_id: this._config.entity });
      this._debouncedFetch();
    } catch (e) {
      console.error('grouped-shopping-list-card: Failed to add item', e);
    }
  }

  async _toggleItem(uid, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'needs_action' : 'completed';
    try {
      await this._hass.callService('todo', 'update_item',
        { item: uid, status: newStatus },
        { entity_id: this._config.entity }
      );
      this._debouncedFetch();
    } catch (e) {
      console.error('grouped-shopping-list-card: Failed to toggle item', e);
    }
  }

  async _deleteItem(uid) {
    try {
      await this._hass.callService('todo', 'remove_item',
        { item: [uid] },
        { entity_id: this._config.entity }
      );
      this._debouncedFetch();
    } catch (e) {
      console.error('grouped-shopping-list-card: Failed to delete item', e);
    }
  }

  /**
   * Build the static shell once: styles, ha-card, header, input, items container.
   * This is only called once (or when config changes). The input element persists
   * across item updates so the keyboard never gets yanked away.
   */
  _buildShell() {
    const shadow = this.shadowRoot;
    shadow.innerHTML = '';

    const style = document.createElement('style');
    style.textContent = `
      :host {
        --card-padding: 16px;
      }
      ha-card {
        padding: 0;
        overflow: hidden;
      }
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 16px 8px;
        font-size: 18px;
        font-weight: 500;
        color: var(--primary-text-color);
      }
      .card-header .count {
        font-size: 14px;
        color: var(--secondary-text-color);
        font-weight: 400;
        background: var(--divider-color, rgba(0,0,0,0.12));
        border-radius: 12px;
        padding: 2px 10px;
        min-width: 20px;
        text-align: center;
      }
      .add-item-row {
        padding: 4px 16px 12px;
      }
      .add-item-row ha-textfield {
        display: block;
        width: 100%;
        --mdc-text-field-fill-color: var(--input-fill-color, var(--secondary-background-color, rgba(0,0,0,0.04)));
        --mdc-text-field-idle-line-color: var(--divider-color, rgba(0,0,0,0.12));
        --mdc-text-field-hover-line-color: var(--primary-color);
        --mdc-text-field-ink-color: var(--primary-text-color);
        --mdc-text-field-label-ink-color: var(--secondary-text-color);
        --mdc-shape-small: 10px;
        --mdc-typography-subtitle1-font-size: 14px;
        --mdc-typography-subtitle1-font-family: inherit;
      }
      .category-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px 4px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.08em;
        color: var(--secondary-text-color);
        text-transform: uppercase;
      }
      .category-header .line {
        flex: 1;
        height: 1px;
        background: var(--divider-color, rgba(0,0,0,0.12));
      }
      .item-row {
        display: flex;
        align-items: center;
        padding: 6px 8px 6px 16px;
        gap: 8px;
        transition: background-color 0.15s;
      }
      .item-row:hover {
        background: var(--secondary-background-color, rgba(0,0,0,0.04));
      }
      .item-row .checkbox {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        border: 2px solid var(--divider-color, rgba(0,0,0,0.25));
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
        background: transparent;
        padding: 0;
        color: transparent;
      }
      .item-row .checkbox:hover {
        border-color: var(--primary-color);
      }
      .item-row .checkbox.checked {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: var(--text-primary-color, #fff);
      }
      .item-row .checkbox svg {
        width: 14px;
        height: 14px;
        fill: currentColor;
      }
      .item-row .name {
        flex: 1;
        font-size: 14px;
        color: var(--primary-text-color);
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .item-row .name.completed {
        text-decoration: line-through;
        color: var(--secondary-text-color);
        opacity: 0.7;
      }
      .item-row .delete-btn {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.15s, background-color 0.15s;
        color: var(--secondary-text-color);
        padding: 0;
      }
      .item-row:hover .delete-btn {
        opacity: 0.7;
      }
      .item-row .delete-btn:hover {
        opacity: 1;
        background: var(--divider-color, rgba(0,0,0,0.08));
        color: var(--error-color, #db4437);
      }
      .item-row .delete-btn svg {
        width: 18px;
        height: 18px;
        fill: currentColor;
      }
      .completed-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px 16px 4px;
        cursor: pointer;
        user-select: none;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.08em;
        color: var(--secondary-text-color);
        text-transform: uppercase;
      }
      .completed-header .line {
        flex: 1;
        height: 1px;
        background: var(--divider-color, rgba(0,0,0,0.12));
      }
      .completed-header .chevron {
        transition: transform 0.2s;
        display: flex;
      }
      .completed-header .chevron.collapsed {
        transform: rotate(-90deg);
      }
      .completed-header .chevron svg {
        width: 18px;
        height: 18px;
        fill: var(--secondary-text-color);
      }
      .completed-section {
        overflow: hidden;
        transition: max-height 0.3s ease;
      }
      .completed-section.collapsed {
        max-height: 0 !important;
      }
      .bottom-pad {
        height: 8px;
      }
      .empty-state {
        padding: 24px 16px;
        text-align: center;
        color: var(--secondary-text-color);
        font-size: 14px;
      }
      @media (hover: none) {
        .item-row .delete-btn {
          opacity: 0.5;
        }
      }
    `;
    shadow.appendChild(style);

    const card = document.createElement('ha-card');

    // Header
    const header = document.createElement('div');
    header.className = 'card-header';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = this._config.title || 'Shopping List';
    header.appendChild(titleSpan);
    this._countBadge = document.createElement('span');
    this._countBadge.className = 'count';
    this._countBadge.textContent = '0';
    header.appendChild(this._countBadge);
    card.appendChild(header);

    // Add item input — persists across renders, never destroyed
    const addRow = document.createElement('div');
    addRow.className = 'add-item-row';

    // Prevent HA card action system from intercepting touch/click on input area
    addRow.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: true });
    addRow.addEventListener('mousedown', (e) => { e.stopPropagation(); });
    addRow.addEventListener('click', (e) => { e.stopPropagation(); });
    addRow.addEventListener('pointerdown', (e) => { e.stopPropagation(); });

    this._addInput = document.createElement('ha-textfield');
    this._addInput.placeholder = '+ Add an item...';

    this._addInput.addEventListener('focus', () => { this._inputFocused = true; });
    this._addInput.addEventListener('blur', () => {
      this._inputFocused = false;
      if (this._pendingRender) {
        this._pendingRender = false;
        this._renderItems();
      }
    });

    this._addInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = this._addInput.value;
        this._addItem(val);
        this._addInput.value = '';
        this._addInput.focus();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this._addInput.value = '';
        this._addInput.blur();
      }
    });
    addRow.appendChild(this._addInput);
    card.appendChild(addRow);

    // Items container — diffed on updates, never torn down
    this._itemsContainer = document.createElement('div');
    card.appendChild(this._itemsContainer);

    shadow.appendChild(card);
    this._shellBuilt = true;
  }

  /**
   * Diff-update the items container. Only adds/removes/reorders the DOM nodes
   * that actually changed, so the input and its keyboard state are untouched.
   */
  _renderItems() {
    if (!this._shellBuilt) {
      this._buildShell();
    }

    if (this._inputFocused) {
      this._pendingRender = true;
      return;
    }

    const active = [];
    const completed = [];

    for (const item of this._items) {
      if (item.status === 'completed') {
        completed.push(item);
      } else {
        active.push(item);
      }
    }

    // Update count badge (outside items container — always safe)
    this._countBadge.textContent = active.length;

    // Group active items by category
    const groups = {};
    const uncategorized = [];
    for (const item of active) {
      const parsed = parseItem(item.summary);
      if (parsed.category) {
        if (!groups[parsed.category]) groups[parsed.category] = [];
        groups[parsed.category].push({ ...item, displayName: parsed.name });
      } else {
        uncategorized.push({ ...item, displayName: parsed.name });
      }
    }

    // Build ordered category list
    const orderedCategories = [];
    for (const cat of CATEGORY_ORDER) {
      if (groups[cat]) orderedCategories.push(cat);
    }
    for (const cat of Object.keys(groups)) {
      if (!CATEGORY_ORDER.includes(cat)) orderedCategories.push(cat);
    }

    // Build desired element descriptors (keyed for diffing)
    const desired = [];

    if (active.length === 0 && completed.length === 0) {
      desired.push({ key: 'empty', type: 'empty' });
    }

    // Uncategorized first
    if (uncategorized.length > 0) {
      desired.push({ key: 'cat:UNCATEGORIZED', type: 'category', emoji: UNCATEGORIZED_EMOJI, label: UNCATEGORIZED_LABEL });
      for (const item of uncategorized) {
        desired.push({ key: `item:${item.uid}`, type: 'item', item, completed: false });
      }
    }

    // Categorized groups
    for (const cat of orderedCategories) {
      const emoji = CATEGORY_EMOJI[cat] || '📦';
      desired.push({ key: `cat:${cat}`, type: 'category', emoji, label: cat });
      for (const item of groups[cat]) {
        desired.push({ key: `item:${item.uid}`, type: 'item', item, completed: false });
      }
    }

    // Completed section
    if (completed.length > 0) {
      desired.push({ key: 'completed-header', type: 'completed-header', count: completed.length });
      desired.push({ key: 'completed-section', type: 'completed-section', items: completed });
    }

    // Bottom padding
    desired.push({ key: 'bottom-pad', type: 'bottom-pad' });

    this._diffChildren(this._itemsContainer, desired);
  }

  /**
   * Diff a container's children against a desired list of descriptors.
   * Reuses existing nodes by data-key, only adding/removing/reordering what changed.
   */
  _diffChildren(container, desired) {
    // Index existing children by data-key
    const existingByKey = new Map();
    for (const child of Array.from(container.children)) {
      const key = child.dataset.key;
      if (key) existingByKey.set(key, child);
    }

    const desiredKeys = new Set(desired.map(d => d.key));

    // Remove children no longer in the desired list
    for (const [key, child] of existingByKey) {
      if (!desiredKeys.has(key)) {
        child.remove();
        existingByKey.delete(key);
      }
    }

    // Walk desired list: reuse or create each node, ensure correct position
    for (let i = 0; i < desired.length; i++) {
      const desc = desired[i];
      let node = existingByKey.get(desc.key);
      if (node) {
        this._updateNode(node, desc);
      } else {
        node = this._createNode(desc);
      }
      // Ensure node is at position i
      const current = container.children[i];
      if (current !== node) {
        container.insertBefore(node, current || null);
      }
    }
  }

  /** Create a new DOM node from a descriptor. */
  _createNode(desc) {
    let node;
    switch (desc.type) {
      case 'empty':
        node = document.createElement('div');
        node.className = 'empty-state';
        node.textContent = 'Your shopping list is empty';
        break;
      case 'category':
        node = this._createCategoryHeader(desc.emoji, desc.label);
        break;
      case 'item':
        node = this._createItemRow(desc.item, desc.completed);
        break;
      case 'completed-header':
        node = this._createCompletedHeader(desc.count);
        break;
      case 'completed-section':
        node = this._createCompletedSection(desc.items);
        break;
      case 'bottom-pad':
        node = document.createElement('div');
        node.className = 'bottom-pad';
        break;
    }
    node.dataset.key = desc.key;
    return node;
  }

  /** Patch an existing DOM node to match an updated descriptor. */
  _updateNode(node, desc) {
    switch (desc.type) {
      case 'item':
        this._updateItemRow(node, desc.item, desc.completed);
        break;
      case 'completed-header':
        this._updateCompletedHeader(node, desc.count);
        break;
      case 'completed-section':
        this._updateCompletedSection(node, desc.items);
        break;
      // category, empty, bottom-pad are static — no update needed
    }
  }

  _createCategoryHeader(emoji, label) {
    const div = document.createElement('div');
    div.className = 'category-header';
    const emojiSpan = document.createElement('span');
    emojiSpan.textContent = emoji;
    div.appendChild(emojiSpan);
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    div.appendChild(labelSpan);
    const line = document.createElement('span');
    line.className = 'line';
    div.appendChild(line);
    return div;
  }

  _createItemRow(item, isCompleted) {
    const row = document.createElement('div');
    row.className = 'item-row';
    // Store item data on the element so event handlers always read current values
    row._itemUid = item.uid;
    row._itemStatus = item.status;

    const checkbox = document.createElement('button');
    checkbox.className = 'checkbox' + (isCompleted ? ' checked' : '');
    checkbox.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    checkbox.addEventListener('click', () => this._toggleItem(row._itemUid, row._itemStatus));
    row.appendChild(checkbox);

    const name = document.createElement('span');
    name.className = 'name' + (isCompleted ? ' completed' : '');
    name.textContent = item.displayName;
    row.appendChild(name);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._deleteItem(row._itemUid);
    });
    row.appendChild(delBtn);

    return row;
  }

  /** Patch an existing item row's text, checkbox, and stored data without recreating it. */
  _updateItemRow(row, item, isCompleted) {
    row._itemUid = item.uid;
    row._itemStatus = item.status;

    const checkbox = row.querySelector('.checkbox');
    if (checkbox) checkbox.classList.toggle('checked', isCompleted);

    const name = row.querySelector('.name');
    if (name) {
      name.textContent = item.displayName;
      name.classList.toggle('completed', isCompleted);
    }
  }

  _createCompletedHeader(count) {
    const header = document.createElement('div');
    header.className = 'completed-header';

    const leftLine = document.createElement('span');
    leftLine.className = 'line';
    header.appendChild(leftLine);

    const label = document.createElement('span');
    label.className = 'comp-label';
    label.textContent = `Completed (${count})`;
    header.appendChild(label);

    const rightLine = document.createElement('span');
    rightLine.className = 'line';
    header.appendChild(rightLine);

    const chevron = document.createElement('span');
    chevron.className = 'chevron' + (this._completedCollapsed ? ' collapsed' : '');
    chevron.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>';
    header.appendChild(chevron);

    // Click handler looks up section dynamically so it works even if the
    // section DOM node was removed and recreated between renders.
    header.addEventListener('click', () => {
      this._completedCollapsed = !this._completedCollapsed;
      const chev = header.querySelector('.chevron');
      const section = this._itemsContainer.querySelector('[data-key="completed-section"]');
      if (chev) chev.classList.toggle('collapsed', this._completedCollapsed);
      if (section) {
        section.classList.toggle('collapsed', this._completedCollapsed);
        if (!this._completedCollapsed) {
          section.style.maxHeight = (section.children.length * 44 + 20) + 'px';
        }
      }
    });

    return header;
  }

  _updateCompletedHeader(node, count) {
    const label = node.querySelector('.comp-label');
    if (label) label.textContent = `Completed (${count})`;
    const chevron = node.querySelector('.chevron');
    if (chevron) chevron.classList.toggle('collapsed', this._completedCollapsed);
  }

  _createCompletedSection(items) {
    const section = document.createElement('div');
    section.className = 'completed-section' + (this._completedCollapsed ? ' collapsed' : '');

    for (const item of items) {
      const parsed = parseItem(item.summary);
      const row = this._createItemRow({ ...item, displayName: parsed.name }, true);
      row.dataset.key = `item:${item.uid}`;
      section.appendChild(row);
    }

    if (!this._completedCollapsed) {
      section.style.maxHeight = (items.length * 44 + 20) + 'px';
    }

    return section;
  }

  _updateCompletedSection(node, items) {
    // Diff completed item rows within the section
    const desired = items.map(item => {
      const parsed = parseItem(item.summary);
      return {
        key: `item:${item.uid}`,
        type: 'item',
        item: { ...item, displayName: parsed.name },
        completed: true,
      };
    });

    this._diffChildren(node, desired);

    // Update collapse state and max-height
    node.classList.toggle('collapsed', this._completedCollapsed);
    if (!this._completedCollapsed) {
      node.style.maxHeight = (items.length * 44 + 20) + 'px';
    }
  }

  disconnectedCallback() {
    clearTimeout(this._debounceTimer);
  }

  getCardSize() {
    return 3;
  }
}

class GroupedShoppingListCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        .editor {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--secondary-text-color);
          margin-bottom: 4px;
        }
        input {
          width: 100%;
          box-sizing: border-box;
          padding: 8px 12px;
          border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
          border-radius: 8px;
          background: var(--input-fill-color, var(--secondary-background-color));
          color: var(--primary-text-color);
          font-size: 14px;
          font-family: inherit;
        }
      </style>
      <div class="editor">
        <div>
          <label>Entity</label>
          <input id="entity" value="${this._config.entity || ''}">
        </div>
        <div>
          <label>Title (optional)</label>
          <input id="title" value="${this._config.title || ''}" placeholder="Shopping List">
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('entity').addEventListener('input', (e) => {
      this._config = { ...this._config, entity: e.target.value };
      this._fireChanged();
    });
    this.shadowRoot.getElementById('title').addEventListener('input', (e) => {
      this._config = { ...this._config, title: e.target.value };
      this._fireChanged();
    });
  }

  _fireChanged() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('grouped-shopping-list-card', GroupedShoppingListCard);
customElements.define('grouped-shopping-list-card-editor', GroupedShoppingListCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'grouped-shopping-list-card',
  name: 'Grouped Shopping List',
  description: 'Shopping list grouped by [CATEGORY] bracket prefixes with emoji headers.',
  preview: true,
});
