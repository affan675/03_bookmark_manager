/* ============================================================
   storage.js — the ONLY file that touches localStorage.
   Exposes a global `Storage` object (window.AppStorage to avoid
   clashing with the built-in window.Storage interface).
   ============================================================ */

(function (global) {
  'use strict';

  var STORAGE_KEY = 'affan_bookmarks';
  var THEME_KEY   = 'affan_theme';

  var AppStorage = {

    /**
     * Read all bookmarks. Always returns an array.
     * Returns [] if nothing stored or if data is corrupt.
     */
    getAll: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        var parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('[storage] Failed to parse bookmarks:', e);
        return [];
      }
    },

    /**
     * Persist the full bookmarks array.
     * Returns true on success, false on failure (e.g. quota exceeded).
     */
    saveAll: function (bookmarks) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks || []));
        return true;
      } catch (e) {
        console.error('[storage] Failed to save bookmarks:', e);
        return false;
      }
    },

    /** Wipe all bookmark data. */
    clearAll: function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
      } catch (e) {
        return false;
      }
    },

    /** True if no bookmark key exists yet (used to decide on seeding). */
    isFirstRun: function () {
      return localStorage.getItem(STORAGE_KEY) === null;
    },

    /* --- Theme persistence (light/dark) --- */
    getTheme: function () {
      try { return localStorage.getItem(THEME_KEY) || 'light'; }
      catch (e) { return 'light'; }
    },
    saveTheme: function (theme) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    },

    /** Expose key names for debugging. */
    KEYS: { STORAGE_KEY: STORAGE_KEY, THEME_KEY: THEME_KEY }
  };

  global.AppStorage = AppStorage;

})(window);
