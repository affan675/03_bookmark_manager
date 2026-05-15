/* ============================================================
   fileHandler.js — file I/O helpers.
   - readHtmlFile(file)  → Promise<string>  (for HTML uploads)
   - exportBookmarks()                        (download JSON)
   - importBookmarks(file) → Promise<array>  (parse JSON file)
   Exposes window.FileHandler.
   ============================================================ */

(function (global) {
  'use strict';

  var MAX_HTML_BYTES = 2 * 1024 * 1024; // 2MB safety cap (localStorage is small)

  function readHtmlFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('No file provided'));
      var name = (file.name || '').toLowerCase();
      var isHtml = /\.html?$/.test(name) || file.type === 'text/html';
      if (!isHtml) return reject(new Error('Please select a .html or .htm file'));
      if (file.size > MAX_HTML_BYTES) {
        return reject(new Error('File too large (max 2MB for localStorage).'));
      }

      var reader = new FileReader();
      reader.onload  = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('Could not read file')); };
      reader.readAsText(file);
    });
  }

  function exportBookmarks() {
    var data = global.BookmarkModel.exportData();
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    var ts   = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = 'affan-bookmarks-' + ts + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return data.length;
  }

  function importBookmarks(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('No file provided'));
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(String(reader.result || '[]'));
          if (!Array.isArray(parsed)) throw new Error('JSON must be an array of bookmarks');
          resolve(parsed);
        } catch (err) {
          reject(new Error('Invalid JSON file: ' + err.message));
        }
      };
      reader.onerror = function () { reject(new Error('Could not read file')); };
      reader.readAsText(file);
    });
  }

  global.FileHandler = {
    readHtmlFile: readHtmlFile,
    exportBookmarks: exportBookmarks,
    importBookmarks: importBookmarks
  };

})(window);
