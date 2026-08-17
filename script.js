/* ============================================================
   ПОЛИЧКА — логіка застосунку
   Дані зберігаються у localStorage браузера (без бекенду).
   ============================================================ */
(() => {
  'use strict';

  const STORAGE_KEY = 'shelf-items-v1';
  const PALETTE = ['#c9a15a', '#c08a92', '#93a487', '#7f9bb0', '#a97c5b', '#8c5866'];

  const CATEGORY_META = {
    movies: { label: 'Фільм / серіал', subtitle: 'Режисер', empty: 'Поличка чекає на перший фільм чи серіал' },
    books:  { label: 'Книга',          subtitle: 'Автор',    empty: 'Тут поки що жодної книги — самий час це змінити' },
    music:  { label: 'Музика',         subtitle: 'Виконавець', empty: 'Тиша. Додай першу платівку' },
  };

  /* ---------- утиліти ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function uid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- сховище ---------- */
  function loadItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Не вдалось прочитати поличку зі сховища', e);
      return [];
    }
  }

  function saveItems(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return true;
    } catch (e) {
      console.error('Не вдалось зберегти поличку', e);
      showToast('Не вдалось зберегти — сховище браузера переповнене');
      return false;
    }
  }

  let items = loadItems();

  /* ---------- зорепад у фоні ---------- */
  function buildStars() {
    const host = $('#stars');
    const count = window.innerWidth < 640 ? 40 : 70;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'star';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.animationDelay = (Math.random() * 4.5).toFixed(2) + 's';
      s.style.opacity = (Math.random() * .5 + .2).toFixed(2);
      frag.appendChild(s);
    }
    host.appendChild(frag);
  }

  /* ---------- toast ---------- */
  let toastTimer = null;
  function showToast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2400);
  }

  /* ---------- рендер полиць ---------- */
  function itemsFor(category) {
    return items.filter(i => i.category === category);
  }

  function renderAll() {
    Object.keys(CATEGORY_META).forEach(renderShelf);
  }

  function renderShelf(category) {
    const host = $('#shelf-' + category);
    host.innerHTML = '';
    const list = itemsFor(category);

    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'shelf-empty';
      empty.innerHTML = `<span>${CATEGORY_META[category].empty}</span>`;
      for (let i = 0; i < 5; i++) {
        const mote = document.createElement('span');
        mote.className = 'mote';
        mote.style.left = (10 + i * 18) + '%';
        mote.style.animationDelay = (i * .9).toFixed(2) + 's';
        empty.appendChild(mote);
      }
      host.appendChild(empty);
    } else {
      list.forEach(item => host.appendChild(buildItemEl(item)));
    }

    const addTile = document.createElement('button');
    addTile.className = 'add-tile';
    addTile.type = 'button';
    addTile.setAttribute('aria-label', 'Додати ' + CATEGORY_META[category].label.toLowerCase());
    addTile.textContent = '+';
    addTile.addEventListener('click', () => openModal({ mode: 'add', category }));
    host.appendChild(addTile);
  }

  function buildItemEl(item) {
    const h = hashString(item.id);
    const wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.className = 'item item--' + (item.category === 'movies' ? 'cassette' : item.category === 'books' ? 'book' : 'vinyl');
    wrap.style.setProperty('--item-color', item.color || PALETTE[h % PALETTE.length]);
    wrap.style.setProperty('--tilt', ((h % 5) - 2) + 'deg');
    wrap.setAttribute('aria-label', item.title);

    if (item.category === 'movies') {
      wrap.innerHTML = `
        <div class="cassette">
          <div class="cassette__window"><span class="reel"></span><span class="reel"></span></div>
          <div class="cassette__label"><span class="cassette__title">${escapeHtml(item.title)}</span></div>
        </div>`;
    } else if (item.category === 'books') {
      wrap.style.setProperty('--item-height', (150 + (h % 46)) + 'px');
      wrap.innerHTML = `
        <div class="book"><span class="book__title">${escapeHtml(item.title)}</span></div>`;
    } else {
      wrap.innerHTML = `
        <div class="sleeve">
          <span class="record-peek"></span>
          <span class="vinyl__title">${escapeHtml(item.title)}</span>
        </div>`;
    }

    wrap.addEventListener('click', () => openModal({ mode: 'edit', item }));
    return wrap;
  }

  /* ---------- вкладки ---------- */
  function initTabs() {
    $$('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const category = tab.dataset.category;
        $$('.tab').forEach(t => {
          t.classList.toggle('is-active', t === tab);
          t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        });
        $$('.shelf-section').forEach(sec => {
          const active = sec.dataset.category === category;
          sec.hidden = !active;
          sec.classList.toggle('is-active', active);
        });
      });
    });
  }

  /* ---------- модальне вікно ---------- */
  const overlay = () => $('#modalOverlay');
  let currentEdit = null; // {mode, category, item}
  let pendingCoverData = null;
  let selectedColor = null;

  function buildSwatches() {
    const host = $('#swatches');
    host.innerHTML = '';
    PALETTE.forEach(color => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.style.background = color;
      b.setAttribute('aria-label', 'Колір ' + color);
      b.addEventListener('click', () => {
        selectedColor = color;
        $$('.swatch', host).forEach(s => s.classList.toggle('is-selected', s === b));
      });
      host.appendChild(b);
    });
  }

  function selectSwatch(color) {
    selectedColor = color;
    $$('.swatch').forEach(s => s.classList.toggle('is-selected', s.style.background === hexToRgbString(color)));
  }

  // helper because style.background reads back as rgb()
  function hexToRgbString(hex) {
    const v = hex.replace('#', '');
    const num = parseInt(v, 16);
    const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
    return `rgb(${r}, ${g}, ${b})`;
  }

  function openModal({ mode, category, item }) {
    currentEdit = { mode, item };
    pendingCoverData = item ? (item.cover || null) : null;
    const cat = mode === 'edit' ? item.category : category;

    $('#modalHeading').textContent = mode === 'edit' ? 'Про цю річ' : 'Нова річ на поличці';
    $('#fieldCategory').value = cat;
    $('#fieldCategory').disabled = mode === 'edit';
    $('#fieldSubtitleLabel').textContent = CATEGORY_META[cat].subtitle + (mode === 'edit' ? '' : ' (необов\'язково)');
    $('#fieldTitle').value = item ? item.title : '';
    $('#fieldSubtitle').value = item ? (item.subtitle || '') : '';
    $('#fieldComment').value = item ? (item.comment || '') : '';
    $('#fileName').textContent = item && item.cover ? 'зображення завантажено' : 'не обрано';
    $('#fieldCoverFile').value = '';
    $('#deleteBtn').hidden = mode !== 'edit';

    selectedColor = (item && item.color) ? item.color : PALETTE[hashString(item ? item.id : uid()) % PALETTE.length];
    selectSwatch(selectedColor);
    renderModalVisual(cat);

    overlay().hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#fieldTitle').focus(), 50);
  }

  function renderModalVisual(category) {
    const host = $('#modalVisual');
    host.innerHTML = '';

    if (category === 'music') {
      const tt = document.createElement('div');
      tt.className = 'turntable is-playing';
      tt.innerHTML = `
        <div class="turntable__plate">
          <div class="record">
            <div class="record__label" id="recordLabel"></div>
          </div>
          <div class="turntable__arm"></div>
        </div>
        <p class="turntable__caption">зараз крутиться</p>`;
      host.appendChild(tt);
      updateRecordLabel();
    } else {
      const frame = document.createElement('div');
      frame.className = 'cover-frame';
      frame.id = 'coverFrame';
      host.appendChild(frame);
      updateCoverFrame();
    }
  }

  function updateCoverFrame() {
    const frame = $('#coverFrame');
    if (!frame) return;
    const title = $('#fieldTitle').value.trim() || (currentEdit.item ? currentEdit.item.title : '');
    if (pendingCoverData) {
      frame.innerHTML = `<img src="${pendingCoverData}" alt="Обкладинка: ${escapeHtml(title)}">`;
    } else {
      frame.innerHTML = `<div class="cover-fallback" style="background:linear-gradient(160deg, ${selectedColor}, #241a29);">${escapeHtml((title || '?').charAt(0).toUpperCase())}</div>`;
    }
  }

  function updateRecordLabel() {
    const label = $('#recordLabel');
    if (!label) return;
    const title = $('#fieldTitle').value.trim() || (currentEdit.item ? currentEdit.item.title : '');
    if (pendingCoverData) {
      label.style.backgroundImage = `url(${pendingCoverData})`;
      label.textContent = '';
    } else {
      label.style.backgroundImage = 'none';
      label.style.background = selectedColor;
      label.textContent = (title || '?').charAt(0).toUpperCase();
    }
  }

  function refreshVisual() {
    if (!currentEdit) return;
    const cat = $('#fieldCategory').value;
    if (cat === 'music') updateRecordLabel();
    else updateCoverFrame();
  }

  function closeModal() {
    overlay().hidden = true;
    document.body.style.overflow = '';
    currentEdit = null;
    pendingCoverData = null;
  }

  function handleFileInput(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Це не схоже на зображення');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      pendingCoverData = reader.result;
      $('#fileName').textContent = file.name;
      refreshVisual();
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    const title = $('#fieldTitle').value.trim();
    if (!title) {
      showToast('Дай цій речі назву');
      $('#fieldTitle').focus();
      return;
    }
    const category = $('#fieldCategory').value;
    const payload = {
      category,
      title,
      subtitle: $('#fieldSubtitle').value.trim(),
      comment: $('#fieldComment').value.trim(),
      cover: pendingCoverData || null,
      color: selectedColor,
    };

    if (currentEdit.mode === 'edit') {
      const idx = items.findIndex(i => i.id === currentEdit.item.id);
      if (idx > -1) items[idx] = { ...items[idx], ...payload };
      showToast('Збережено');
    } else {
      items.push({ id: uid(), addedAt: Date.now(), ...payload });
      showToast('Додано на поличку');
    }
    saveItems(items);
    renderShelf(category);
    closeModal();
  }

  function handleDelete() {
    if (!currentEdit || currentEdit.mode !== 'edit') return;
    const { category, id } = currentEdit.item;
    items = items.filter(i => i.id !== id);
    saveItems(items);
    renderShelf(category);
    showToast('Прибрано з полички');
    closeModal();
  }

  /* ---------- ініціалізація ---------- */
  function init() {
    buildStars();
    buildSwatches();
    renderAll();
    initTabs();

    $('#addBtn').addEventListener('click', () => {
      const activeTab = $('.tab.is-active');
      const category = activeTab ? activeTab.dataset.category : 'movies';
      openModal({ mode: 'add', category });
    });

    $('#modalClose').addEventListener('click', closeModal);
    overlay().addEventListener('click', (e) => { if (e.target === overlay()) closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay().hidden) closeModal();
    });

    $('#fieldCategory').addEventListener('change', (e) => {
      const cat = e.target.value;
      $('#fieldSubtitleLabel').textContent = CATEGORY_META[cat].subtitle + (currentEdit.mode === 'edit' ? '' : ' (необов\'язково)');
      renderModalVisual(cat);
    });
    $('#fieldTitle').addEventListener('input', refreshVisual);
    $('#fieldCoverFile').addEventListener('change', handleFileInput);
    $('#saveBtn').addEventListener('click', handleSave);
    $('#deleteBtn').addEventListener('click', handleDelete);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
