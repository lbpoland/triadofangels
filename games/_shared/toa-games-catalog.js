/* ToA Games — Catalog renderer
   - Reads /games/catalog.json
   - Renders catalog cards
   - Accessible filter UI (search + tag chips)
   - Never invents entries; ignores invalid records
*/
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);

  const SAFE_STATUS = new Set(['live', 'prototype', 'archived']);
  const SAFE_TYPE = new Set(['demo', 'game', 'tool']);

  function normalizeText(s) {
    return String(s || '').trim();
  }

  function safePath(p) {
    const s = normalizeText(p);
    if (!s.startsWith('/')) return null;
    if (s.includes('..')) return null;
    // Enforce games-only listing for this hub.
    if (!s.startsWith('/games/')) return null;
    return s;
  }

  function asTags(arr) {
    if (!Array.isArray(arr)) return [];
    const out = [];
    for (const t of arr) {
      const v = normalizeText(t).toLowerCase();
      if (!v) continue;
      if (v.length > 30) continue;
      out.push(v);
    }
    return Array.from(new Set(out)).slice(0, 12);
  }

  function normalizeItem(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const id = normalizeText(raw.id).toLowerCase();
    const title = normalizeText(raw.title);
    const subtitle = normalizeText(raw.subtitle);
    const status = normalizeText(raw.status).toLowerCase();
    const type = normalizeText(raw.type).toLowerCase();
    const path = safePath(raw.path);
    const description = normalizeText(raw.description);
    const tags = asTags(raw.tags);
    const updatedAt = normalizeText(raw.updatedAt);

    if (!id || id.length > 60) return null;
    if (!title) return null;
    if (!path) return null;
    if (!SAFE_STATUS.has(status)) return null;
    if (!SAFE_TYPE.has(type)) return null;

    return {
      id,
      title,
      subtitle,
      status,
      type,
      path,
      description,
      tags,
      updatedAt
    };
  }

  function buildPill(text) {
    const span = document.createElement('span');
    span.className = 'pill pill--accent';
    span.textContent = text;
    return span;
  }

  function card(item) {
    const art = document.createElement('article');
    art.className = 'product-block';
    art.setAttribute('data-id', item.id);
    art.setAttribute('data-status', item.status);
    art.setAttribute('data-type', item.type);
    art.setAttribute('data-tags', item.tags.join(','));

    const h = document.createElement('h3');
    h.textContent = item.title;

    const meta = document.createElement('p');
    meta.className = 'u-mt-10';

    const statusLabel = item.status === 'live' ? 'Playable' : (item.status === 'prototype' ? 'Prototype' : 'Archived');
    meta.appendChild(buildPill(statusLabel));

    if (item.subtitle) {
      const sub = document.createElement('span');
      sub.className = 'u-ml-10';
      sub.textContent = item.subtitle;
      meta.appendChild(sub);
    }

    const desc = document.createElement('p');
    desc.textContent = item.description || 'Playable build hosted on triadofangels.com.';

    const tags = document.createElement('p');
    tags.className = 'u-mt-10';
    if (item.tags.length) {
      tags.innerHTML = '<strong>Tags:</strong> ' + item.tags.map(t => `<span class="pill">${escapeHtml(t)}</span>`).join(' ');
    }

    const actions = document.createElement('p');
    actions.className = 'u-mt-18';

    const a = document.createElement('a');
    a.className = 'cta-button';
    a.href = item.path;
    a.textContent = 'Play';

    actions.appendChild(a);

    art.appendChild(h);
    art.appendChild(meta);
    art.appendChild(desc);
    if (item.tags.length) art.appendChild(tags);
    art.appendChild(actions);

    return art;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function uniqueTags(items) {
    const set = new Set();
    for (const it of items) {
      for (const t of it.tags) set.add(t);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  function renderChips(container, tags, onToggle) {
    container.innerHTML = '';

    // All chip
    const all = document.createElement('button');
    all.type = 'button';
    all.className = 'chip';
    all.setAttribute('aria-pressed', 'true');
    all.setAttribute('data-tag', '');
    all.textContent = 'All';
    all.addEventListener('click', () => onToggle(''));
    container.appendChild(all);

    for (const t of tags) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('data-tag', t);
      b.textContent = t;
      b.addEventListener('click', () => onToggle(t));
      container.appendChild(b);
    }
  }

  function setPressed(container, activeTag) {
    const buttons = Array.from(container.querySelectorAll('button.chip'));
    for (const b of buttons) {
      const t = b.getAttribute('data-tag') || '';
      const pressed = activeTag ? (t === activeTag) : (t === '');
      b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    }
  }

  function applyFilter(items, query, tag) {
    const q = normalizeText(query).toLowerCase();
    const t = normalizeText(tag).toLowerCase();

    return items.filter((it) => {
      if (t && !it.tags.includes(t)) return false;
      if (!q) return true;

      const hay = (
        it.title + ' ' +
        it.subtitle + ' ' +
        it.description + ' ' +
        it.tags.join(' ') + ' ' +
        it.status + ' ' +
        it.type
      ).toLowerCase();

      return hay.includes(q);
    });
  }

  function setCount(el, shown, total) {
    el.textContent = `Showing ${shown} of ${total} build${total === 1 ? '' : 's'}.`;
  }

  async function loadCatalog() {
    const res = await fetch('/games/catalog.json', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('Catalog fetch failed');
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    const normalized = [];
    for (const raw of items) {
      const it = normalizeItem(raw);
      if (it) normalized.push(it);
    }

    // Only list playable-first in UI ordering
    normalized.sort((a, b) => {
      const pa = a.status === 'live' ? 0 : (a.status === 'prototype' ? 1 : 2);
      const pb = b.status === 'live' ? 0 : (b.status === 'prototype' ? 1 : 2);
      if (pa !== pb) return pa - pb;
      return a.title.localeCompare(b.title);
    });

    return normalized;
  }

  async function boot() {
    const list = $('#games-list');
    const tagsWrap = $('#games-tags');
    const q = $('#games-q');
    const clear = $('#games-clear');
    const count = $('#games-count');
    const loading = $('#games-loading');
    const err = $('#games-error');

    if (!list || !tagsWrap || !q || !clear || !count) return;

    function showError(msg) {
      if (loading) loading.hidden = true;
      if (err) {
        err.textContent = msg;
        err.hidden = false;
      }
    }

    let items = [];
    try {
      items = await loadCatalog();
    } catch (e) {
      showError('Unable to load the games catalog right now.');
      return;
    }

    if (loading) loading.hidden = true;

    const tags = uniqueTags(items);

    let activeTag = '';
    let query = '';

    const rerender = () => {
      const filtered = applyFilter(items, query, activeTag);
      list.innerHTML = '';
      for (const it of filtered) list.appendChild(card(it));
      setCount(count, filtered.length, items.length);

      if (!filtered.length) {
        const n = document.createElement('div');
        n.className = 'notice';
        n.textContent = 'No builds match your filters.';
        list.appendChild(n);
      }
    };

    const onToggle = (tag) => {
      activeTag = tag || '';
      setPressed(tagsWrap, activeTag);
      rerender();
    };

    renderChips(tagsWrap, tags, onToggle);
    setPressed(tagsWrap, activeTag);

    q.addEventListener('input', () => {
      query = q.value;
      rerender();
    });

    clear.addEventListener('click', () => {
      q.value = '';
      query = '';
      activeTag = '';
      setPressed(tagsWrap, activeTag);
      rerender();
      try { q.focus({ preventScroll: true }); } catch {}
    });

    rerender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();