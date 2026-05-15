/* ============================================================
   ui.js — all DOM rendering, modals, notifications.
   Exposes window.UI. Calls into BookmarkModel for data.
   App-level event wiring lives in app.js.
   ============================================================ */

(function (global) {
  'use strict';

  /* ---------- element refs (cached on init) ---------- */
  var els = {};
  var state = {
    activeCategory: 'All',
    searchQuery: '',
    onEdit: null,    // callback(id) set by app.js
    onDelete: null,  // callback(id)
    onPreview: null  // callback(id)
  };

  /* ---------- helpers ---------- */

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var key in attrs) {
        if (key === 'class') node.className = attrs[key];
        else if (key === 'dataset') {
          for (var dk in attrs.dataset) node.dataset[dk] = attrs.dataset[dk];
        } else if (key.indexOf('on') === 0 && typeof attrs[key] === 'function') {
          node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
        } else if (attrs[key] !== false && attrs[key] != null) {
          node.setAttribute(key, attrs[key]);
        }
      }
    }
    if (children != null) {
      if (!Array.isArray(children)) children = [children];
      children.forEach(function (c) {
        if (c == null) return;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  /* ---------- public API ---------- */

  var UI = {

    init: function (callbacks) {
      els.grid          = document.getElementById('bookmarks-grid');
      els.empty         = document.getElementById('empty-state');
      els.filters       = document.getElementById('category-filters');
      els.notifications = document.getElementById('notifications');
      els.previewModal  = document.getElementById('preview-modal');
      els.previewIframe = document.getElementById('preview-iframe');
      els.previewTitle  = document.getElementById('preview-title');
      els.confirmModal  = document.getElementById('confirm-modal');
      els.confirmMsg    = document.getElementById('confirm-message');
      els.confirmOk     = document.getElementById('confirm-ok');
      els.categoryDataList = document.getElementById('category-suggestions');

      callbacks = callbacks || {};
      state.onEdit    = callbacks.onEdit;
      state.onDelete  = callbacks.onDelete;
      state.onPreview = callbacks.onPreview;

      // close-modal buttons (event delegation)
      document.addEventListener('click', function (e) {
        if (e.target.matches('[data-close-modal]')) UI.closeModals();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') UI.closeModals();
      });
    },

    setSearchQuery: function (q) { state.searchQuery = q || ''; },
    setActiveCategory: function (c) { state.activeCategory = c || 'All'; },
    getActiveCategory: function () { return state.activeCategory; },

    /** Render the category filter chips. */
    renderCategories: function () {
      var cats = ['All'].concat(global.BookmarkModel.getCategories());
      els.filters.innerHTML = '';
      cats.forEach(function (c) {
        var btn = el('button', {
          type: 'button',
          class: 'chip' + (c === state.activeCategory ? ' active' : ''),
          dataset: { category: c }
        }, c);
        els.filters.appendChild(btn);
      });

      // Update <datalist> for the form's category input
      if (els.categoryDataList) {
        els.categoryDataList.innerHTML = '';
        global.BookmarkModel.getCategories().forEach(function (c) {
          var opt = document.createElement('option');
          opt.value = c;
          els.categoryDataList.appendChild(opt);
        });
      }
    },

    /** Render bookmark cards based on current search + category. */
    renderBookmarks: function () {
      var list = global.BookmarkModel.search(state.searchQuery, state.activeCategory);
      els.grid.innerHTML = '';

      if (list.length === 0) {
        els.empty.classList.remove('hidden');
        els.empty.textContent = global.BookmarkModel.getAll().length === 0
          ? 'No bookmarks yet. Add your first one above!'
          : 'No bookmarks match your search.';
        return;
      }
      els.empty.classList.add('hidden');

      list.forEach(function (bm) {
        els.grid.appendChild(buildCard(bm));
      });
    },

    /** Show HTML preview in iframe modal. */
    openPreview: function (bookmark) {
      if (!bookmark) return;
      els.previewTitle.textContent = bookmark.title || 'Preview';
      // srcdoc handles escaping internally; just assign string
      els.previewIframe.srcdoc = bookmark.htmlContent || '<p style="font-family:sans-serif;padding:20px">No HTML content stored.</p>';
      els.previewModal.classList.remove('hidden');
    },

    /** Confirm dialog. onConfirm called if user clicks OK. */
    confirm: function (message, onConfirm) {
      els.confirmMsg.textContent = message || 'Are you sure?';
      els.confirmModal.classList.remove('hidden');
      // replace handler to avoid stacking
      var newBtn = els.confirmOk.cloneNode(true);
      els.confirmOk.parentNode.replaceChild(newBtn, els.confirmOk);
      els.confirmOk = newBtn;
      els.confirmOk.addEventListener('click', function () {
        UI.closeModals();
        if (typeof onConfirm === 'function') onConfirm();
      });
    },

    closeModals: function () {
      els.previewModal.classList.add('hidden');
      els.previewIframe.srcdoc = '';
      els.confirmModal.classList.add('hidden');
    },

    /** Toast notification. type: 'success' | 'error' | 'info' */
    notify: function (message, type) {
      var n = el('div', { class: 'notification ' + (type || 'info') }, message);
      els.notifications.appendChild(n);
      setTimeout(function () {
        n.classList.add('fade-out');
        setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 220);
      }, 2600);
    },

    /** Fill the form with a bookmark's values for editing. */
    fillForm: function (bm) {
      document.getElementById('bookmark-id').value = bm.id;
      document.getElementById('bm-title').value    = bm.title;
      document.getElementById('bm-url').value      = bm.url;
      document.getElementById('bm-tags').value     = bm.tags.join(', ');
      document.getElementById('bm-category').value = bm.category;
      document.getElementById('form-submit').textContent = 'Save changes';
      document.getElementById('form-cancel').classList.remove('hidden');
      document.getElementById('form-title').textContent = 'Edit bookmark';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    resetForm: function () {
      var form = document.getElementById('bookmark-form');
      form.reset();
      document.getElementById('bookmark-id').value = '';
      document.getElementById('form-submit').textContent = 'Add Bookmark';
      document.getElementById('form-cancel').classList.add('hidden');
      document.getElementById('form-title').textContent = 'Add a bookmark';
    }
  };

  /* ---------- card builder ---------- */

  function buildCard(bm) {
    var isHtml = bm.type === 'html';

    var typeBadge = el('span', { class: 'card-type' + (isHtml ? ' html' : '') }, isHtml ? 'HTML' : 'LINK');
    var category  = el('div',  { class: 'card-category' }, bm.category);
    var title     = el('div',  { class: 'card-title' }, bm.title);

    var children = [typeBadge, category, title];

    if (!isHtml && bm.url) {
      children.push(el('a', {
        class: 'card-url', href: bm.url, target: '_blank', rel: 'noopener noreferrer'
      }, bm.url));
    } else if (isHtml) {
      children.push(el('div', { class: 'card-url' }, 'Local HTML file'));
    }

    if (bm.tags && bm.tags.length) {
      var meta = el('div', { class: 'card-meta' });
      bm.tags.forEach(function (t) { meta.appendChild(el('span', { class: 'tag' }, '#' + t)); });
      children.push(meta);
    }

    // Actions
    var actions = el('div', { class: 'card-actions' });

    if (isHtml) {
      actions.appendChild(el('button', {
        class: 'btn btn-primary btn-sm', type: 'button',
        onclick: function () { if (state.onPreview) state.onPreview(bm.id); }
      }, 'Preview'));
    } else if (bm.url) {
      actions.appendChild(el('a', {
        class: 'btn btn-primary btn-sm', href: bm.url, target: '_blank', rel: 'noopener noreferrer'
      }, 'Open'));
    }

    actions.appendChild(el('button', {
      class: 'btn btn-ghost btn-sm', type: 'button',
      onclick: function () { if (state.onEdit) state.onEdit(bm.id); }
    }, 'Edit'));

    actions.appendChild(el('button', {
      class: 'btn btn-danger btn-sm', type: 'button',
      onclick: function () { if (state.onDelete) state.onDelete(bm.id); }
    }, 'Delete'));

    children.push(actions);

    return el('div', { class: 'card', dataset: { id: bm.id } }, children);
  }

  global.UI = UI;

})(window);
