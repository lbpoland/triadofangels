// js/finder-runtime-helpers.js
// Shared streaming finder helpers extracted from the page controller so
// finder indexing/status logic can live in a dedicated helper owner.

const safeText = (value) => (typeof value === 'string' ? value.trim() : '');
const lower = (value) => safeText(value).toLowerCase();

export function normalizeStreamFinderScope(scope) {
  const value = lower(scope);
  if (value === 'triad' || value === 'toa' || value === 'social') return value;
  return 'all';
}

export function buildStreamFinderStatusText({ shownLinks = 0, shownCards = 0, scope = 'all', query = '' } = {}) {
  const cleanScope = normalizeStreamFinderScope(scope);
  const hasQuery = Boolean(safeText(query));
  const scopeLabel = cleanScope === 'all' ? 'All' : (cleanScope === 'toa' ? 'ToA Studios' : (cleanScope === 'triad' ? 'Triad' : 'Social'));
  if (!hasQuery) return `Showing all ${shownLinks} verified links across ${shownCards} sections (Scope: ${scopeLabel}).`;
  if (!shownLinks) return `No matches (Scope: ${scopeLabel}).`;
  return `${shownLinks} matches across ${shownCards} sections (Scope: ${scopeLabel}).`;
}

export function syncStreamFinderScopeButtons(buttons, activeScope) {
  const cleanScope = normalizeStreamFinderScope(activeScope);
  for (const button of Array.isArray(buttons) ? buttons : []) {
    if (!button || typeof button.getAttribute !== 'function' || typeof button.setAttribute !== 'function') continue;
    const buttonScope = normalizeStreamFinderScope(button.getAttribute('data-stream-scope'));
    button.setAttribute('aria-pressed', buttonScope === cleanScope ? 'true' : 'false');
  }
  return cleanScope;
}

export function syncStreamFinderClearButton(clearBtn, query = '') {
  if (!clearBtn || typeof clearBtn.hidden === 'undefined') return false;
  const hasValue = Boolean(safeText(query));
  clearBtn.hidden = !hasValue;
  return hasValue;
}

export function syncStreamFinderControllerUi({ buttons = [], clearBtn = null, activeScope = 'all', query = '' } = {}) {
  const scope = syncStreamFinderScopeButtons(buttons, activeScope);
  const hasQuery = syncStreamFinderClearButton(clearBtn, query);
  return { scope, hasQuery };
}

export function buildStreamFinderIndex(grid, { cardSelector = '.stream-card', listSelector = '.stream-links' } = {}) {
  if (!grid || typeof grid.querySelectorAll !== 'function') return [];
  const cards = Array.from(grid.querySelectorAll(cardSelector));
  return cards.map((card) => {
    const cardScope = lower(card.getAttribute('data-stream-scope') || card.id);
    const list = card.querySelector(listSelector);
    const items = list ? Array.from(list.querySelectorAll('.stream-item')) : [];
    const anchors = list ? Array.from(list.querySelectorAll('a')).filter((anchor) => !anchor.closest('.stream-item')) : [];
    const units = items.length ? items : anchors;
    return {
      card,
      cardScope,
      units: units.map((unit) => ({
        el: unit,
        hay: items.length
          ? lower(unit.dataset.search)
          : lower(`${safeText(unit.textContent)} ${safeText(unit.getAttribute && unit.getAttribute('href'))}`),
      })),
    };
  });
}



export function readStreamFinderUrlState(search = '') {
  try {
    const params = new URLSearchParams(String(search || ''));
    return {
      q: safeText(params.get('q') || ''),
      scope: normalizeStreamFinderScope(params.get('scope') || 'all'),
    };
  } catch {
    return { q: '', scope: 'all' };
  }
}

export function readStreamFinderControllerState({ search = '', buttons = [] } = {}) {
  const urlState = readStreamFinderUrlState(search);
  const scope = syncStreamFinderScopeButtons(buttons, urlState.scope);
  return { q: safeText(urlState.q), scope };
}

export function applyStreamFinderControllerState({ inputEl = null, buttons = [], clearBtn = null, search = '', query, scope } = {}) {
  let nextQuery = typeof query === 'undefined' ? '' : safeText(query);
  let nextScope = typeof scope === 'undefined' ? '' : normalizeStreamFinderScope(scope);

  if (typeof query === 'undefined' && typeof scope === 'undefined') {
    const urlState = readStreamFinderUrlState(search);
    nextQuery = safeText(urlState.q);
    nextScope = normalizeStreamFinderScope(urlState.scope || 'all');
  } else {
    if (typeof query === 'undefined') nextQuery = safeText(inputEl?.value);
    if (typeof scope === 'undefined') nextScope = normalizeStreamFinderScope('all');
  }

  if (inputEl && typeof inputEl.value !== 'undefined') inputEl.value = nextQuery;
  const uiState = syncStreamFinderControllerUi({ buttons, clearBtn, activeScope: nextScope, query: nextQuery });
  return { q: nextQuery, scope: uiState.scope, hasQuery: uiState.hasQuery };
}

export function syncStreamFinderFromUrlState({ index = [], inputEl = null, buttons = [], clearBtn = null, statusEl = null, emptyEl = null, search = '' } = {}) {
  const controllerState = applyStreamFinderControllerState({
    inputEl,
    buttons,
    clearBtn,
    search,
  });
  return applyStreamFinderRenderedState(index, {
    inputEl,
    buttons,
    clearBtn,
    statusEl,
    emptyEl,
    query: controllerState.q,
    scope: controllerState.scope,
  });
}

export function clearAndFocusStreamFinderRuntimeState({ index = [], inputEl = null, buttons = [], clearBtn = null, statusEl = null, emptyEl = null, scope = 'all', focusOptions = { preventScroll: true } } = {}) {
  const nextState = applyStreamFinderRenderedState(index, {
    inputEl,
    buttons,
    clearBtn,
    statusEl,
    emptyEl,
    query: '',
    scope: normalizeStreamFinderScope(scope || 'all'),
  });
  try {
    inputEl?.focus(focusOptions);
  } catch {}
  return nextState;
}

export function handleStreamFinderEscapeRuntimeState({ index = [], inputEl = null, buttons = [], clearBtn = null, statusEl = null, emptyEl = null, scope = 'all', focusOptions = { preventScroll: true } } = {}) {
  const hasQuery = Boolean(safeText(inputEl?.value));
  if (!hasQuery) {
    return {
      query: '',
      scope: normalizeStreamFinderScope(scope),
      hasQuery: false,
      cleared: false,
    };
  }
  const nextState = clearAndFocusStreamFinderRuntimeState({
    index,
    inputEl,
    buttons,
    clearBtn,
    statusEl,
    emptyEl,
    scope,
    focusOptions,
  });
  return {
    ...nextState,
    query: '',
    cleared: true,
  };
}

export function applyStreamFinderScopeSelectionRuntimeState({ buttonEl = null, index = [], inputEl = null, buttons = [], clearBtn = null, statusEl = null, emptyEl = null, scope = 'all' } = {}) {
  const nextScope = normalizeStreamFinderScope(buttonEl && typeof buttonEl.getAttribute === 'function' ? buttonEl.getAttribute('data-stream-scope') : scope);
  return applyStreamFinderRenderedState(index, {
    inputEl,
    buttons,
    clearBtn,
    statusEl,
    emptyEl,
    query: safeText(inputEl?.value),
    scope: nextScope,
  });
}

export function buildStreamFinderUrlHref({ pathname = '/', hash = '', search = '', query = '', scope = 'all' } = {}) {
  try {
    const params = new URLSearchParams(String(search || ''));
    const cleanQ = safeText(query);
    const cleanScope = normalizeStreamFinderScope(scope);
    if (cleanQ) params.set('q', cleanQ);
    else params.delete('q');
    if (cleanScope && cleanScope !== 'all') params.set('scope', cleanScope);
    else params.delete('scope');
    const qs = params.toString();
    return qs ? `${pathname}?${qs}${hash || ''}` : `${pathname}${hash || ''}`;
  } catch {
    return `${pathname}${hash || ''}`;
  }
}

export function applyStreamFinderHistoryState({ historyObj = null, locationObj = null, query = '', scope = 'all' } = {}) {
  try {
    if (!historyObj || typeof historyObj.replaceState !== 'function' || !locationObj) return '';
    const href = buildStreamFinderUrlHref({
      pathname: safeText(locationObj.pathname) || '/',
      search: safeText(locationObj.search) || '',
      hash: safeText(locationObj.hash) || '',
      query,
      scope,
    });
    historyObj.replaceState(null, '', href);
    return href;
  } catch {
    return '';
  }
}

export function applyStreamFinderUiState({ statusEl = null, emptyEl = null, finderState = {} } = {}) {
  const state = finderState && typeof finderState === 'object' ? finderState : {};
  if (statusEl) statusEl.textContent = safeText(state.statusText);
  if (emptyEl && typeof emptyEl.hidden !== 'undefined') emptyEl.hidden = !Boolean(state.empty);
  return state;
}

export function applyStreamFinderRuntimeUiState({ inputEl = null, buttons = [], clearBtn = null, statusEl = null, emptyEl = null, finderState = {} } = {}) {
  const state = finderState && typeof finderState === 'object' ? finderState : {};
  const controllerState = applyStreamFinderControllerState({
    inputEl,
    buttons,
    clearBtn,
    query: safeText(state.query ?? inputEl?.value),
    scope: normalizeStreamFinderScope(state.scope || 'all'),
  });
  const nextState = {
    ...state,
    query: controllerState.q,
    scope: controllerState.scope,
  };
  applyStreamFinderUiState({ statusEl, emptyEl, finderState: nextState });
  return {
    ...nextState,
    hasQuery: controllerState.hasQuery,
  };
}

export function applyStreamFinderState(index, { query = '', scope = 'all' } = {}) {
  const cleanScope = normalizeStreamFinderScope(scope);
  const q = lower(query);
  const hasQuery = Boolean(q);
  let shownCards = 0;
  let shownLinks = 0;
  for (const entry of Array.isArray(index) ? index : []) {
    const scopeOk = cleanScope === 'all' || entry.cardScope === cleanScope;
    if (!scopeOk) {
      entry.card.hidden = true;
      for (const unit of entry.units || []) unit.el.hidden = true;
      continue;
    }
    let any = false;
    for (const unit of entry.units || []) {
      const match = !hasQuery || unit.hay.includes(q);
      unit.el.hidden = !match;
      if (match) {
        any = true;
        shownLinks += 1;
      }
    }
    const showCard = !hasQuery || any;
    entry.card.hidden = !showCard;
    if (showCard) shownCards += 1;
  }
  return {
    scope: cleanScope,
    query: safeText(query),
    shownCards,
    shownLinks,
    empty: shownLinks === 0,
    statusText: buildStreamFinderStatusText({ shownLinks, shownCards, scope: cleanScope, query }),
  };
}

export function resetStreamFinderControllerState({ inputEl = null, buttons = [], clearBtn = null, scope = 'all' } = {}) {
  return applyStreamFinderControllerState({
    inputEl,
    buttons,
    clearBtn,
    query: '',
    scope: normalizeStreamFinderScope(scope || 'all'),
  });
}

export function applyStreamFinderRenderedState(index, { inputEl = null, buttons = [], clearBtn = null, statusEl = null, emptyEl = null, query = '', scope = 'all' } = {}) {
  const finderState = applyStreamFinderState(index, { query: safeText(query ?? inputEl?.value), scope: normalizeStreamFinderScope(scope || 'all') });
  return applyStreamFinderRuntimeUiState({
    inputEl,
    buttons,
    clearBtn,
    statusEl,
    emptyEl,
    finderState,
  });
}
