/* ============================================================
   bookmarkModel.js — pure data operations.
   No DOM. No localStorage directly (it asks AppStorage).
   Exposes window.BookmarkModel.
   ============================================================ */

(function (global) {
  'use strict';

  var bookmarks = []; // in-memory cache, mirrors storage

  /* ---------- helpers ---------- */

  function uid() {
    return 'bm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function parseTags(tagsInput) {
    if (Array.isArray(tagsInput)) return tagsInput.map(String).map(trim).filter(Boolean);
    if (typeof tagsInput !== 'string') return [];
    return tagsInput.split(',').map(trim).filter(Boolean);
  }

  function trim(s) { return String(s).trim(); }

  function persist() {
    return global.AppStorage.saveAll(bookmarks);
  }

  function normalize(input) {
    var type = input.type === 'html' ? 'html' : 'link';
    return {
      id: input.id || uid(),
      title: trim(input.title || 'Untitled'),
      url: trim(input.url || ''),
      tags: parseTags(input.tags),
      category: trim(input.category || 'Uncategorized'),
      type: type,
      htmlContent: type === 'html' ? (input.htmlContent || '') : '',
      createdAt: input.createdAt || Date.now()
    };
  }

  /* ---------- public API ---------- */

  var BookmarkModel = {

    /** Load from storage into memory. Seeds defaults on first run. */
    init: function () {
      if (global.AppStorage.isFirstRun()) {
        bookmarks = [
          normalize({
            title: 'Claude AI',
            url: 'https://claude.ai',
            tags: 'ai,chat',
            category: 'AI Tools',
            type: 'link'
          }),
          normalize({
            title: 'MDN Web Docs',
            url: 'https://developer.mozilla.org',
            tags: 'learning,html',
            category: 'Learning',
            type: 'link'
          })
        ];
        persist();
      } else {
        bookmarks = global.AppStorage.getAll().map(normalize);
      }
      return bookmarks;
    },

    /** Return a shallow copy of all bookmarks. */
    getAll: function () { return bookmarks.slice(); },

    getById: function (id) {
      for (var i = 0; i < bookmarks.length; i++) {
        if (bookmarks[i].id === id) return bookmarks[i];
      }
      return null;
    },

    /** Add a new bookmark. Returns the saved object. */
    add: function (data) {
      var bm = normalize(data);
      bookmarks.unshift(bm);
      persist();
      return bm;
    },

    /** Update an existing bookmark by id. Returns updated object or null. */
    update: function (id, data) {
      for (var i = 0; i < bookmarks.length; i++) {
        if (bookmarks[i].id === id) {
          var merged = normalize({
            id: id,
            title:       data.title       != null ? data.title       : bookmarks[i].title,
            url:         data.url         != null ? data.url         : bookmarks[i].url,
            tags:        data.tags        != null ? data.tags        : bookmarks[i].tags,
            category:    data.category    != null ? data.category    : bookmarks[i].category,
            type:        data.type        || bookmarks[i].type,
            htmlContent: data.htmlContent != null ? data.htmlContent : bookmarks[i].htmlContent,
            createdAt:   bookmarks[i].createdAt
          });
          bookmarks[i] = merged;
          persist();
          return merged;
        }
      }
      return null;
    },

    /** Delete by id. Returns true if removed. */
    remove: function (id) {
      var before = bookmarks.length;
      bookmarks = bookmarks.filter(function (b) { return b.id !== id; });
      if (bookmarks.length !== before) {
        persist();
        return true;
      }
      return false;
    },

    /**
     * Search + filter.
     * @param {string} query    case-insensitive, matches title or any tag
     * @param {string} category category filter ('All' or '' = no filter)
     */
    search: function (query, category) {
      var q = (query || '').toLowerCase().trim();
      var cat = (category || '').trim();
      var matchesAll = !cat || cat === 'All';

      return bookmarks.filter(function (b) {
        if (!matchesAll && b.category !== cat) return false;
        if (!q) return true;
        if (b.title.toLowerCase().indexOf(q) !== -1) return true;
        for (var i = 0; i < b.tags.length; i++) {
          if (b.tags[i].toLowerCase().indexOf(q) !== -1) return true;
        }
        return false;
      });
    },

    /** Unique sorted list of categories currently in use. */
    getCategories: function () {
      var set = {};
      for (var i = 0; i < bookmarks.length; i++) {
        var c = bookmarks[i].category || 'Uncategorized';
        set[c] = true;
      }
      return Object.keys(set).sort();
    },

    /** Replace the entire dataset (used by import). */
    replaceAll: function (newBookmarks) {
      if (!Array.isArray(newBookmarks)) return false;
      bookmarks = newBookmarks.map(normalize);
      return persist();
    },

    /** Export-ready plain array. */
    exportData: function () {
      return bookmarks.slice();
    }
  };

  global.BookmarkModel = BookmarkModel;

})(window);
