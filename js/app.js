/* ============================================================
   app.js — bootstraps everything on DOMContentLoaded.
   Wires DOM events to BookmarkModel + UI + FileHandler.
   ============================================================ */

(function (global) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- Theme ---------- */
    var savedTheme = global.AppStorage.getTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);
    var themeBtn = document.getElementById('theme-toggle');
    themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    themeBtn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      global.AppStorage.saveTheme(next);
      themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
    });

    /* ---------- Init data + UI ---------- */
    global.BookmarkModel.init();

    global.UI.init({
      onEdit: function (id) {
        var bm = global.BookmarkModel.getById(id);
        if (bm) global.UI.fillForm(bm);
      },
      onDelete: function (id) {
        var bm = global.BookmarkModel.getById(id);
        if (!bm) return;
        global.UI.confirm('Delete "' + bm.title + '"? This cannot be undone.', function () {
          global.BookmarkModel.remove(id);
          render();
          global.UI.notify('Bookmark deleted', 'success');
        });
      },
      onPreview: function (id) {
        var bm = global.BookmarkModel.getById(id);
        if (bm) global.UI.openPreview(bm);
      }
    });

    function render() {
      global.UI.renderCategories();
      global.UI.renderBookmarks();
    }
    render();

    /* ---------- Form: add / edit ---------- */
    var form = document.getElementById('bookmark-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var id       = document.getElementById('bookmark-id').value.trim();
      var title    = document.getElementById('bm-title').value.trim();
      var url      = document.getElementById('bm-url').value.trim();
      var tags     = document.getElementById('bm-tags').value;
      var category = document.getElementById('bm-category').value.trim() || 'Uncategorized';
      var fileInput = document.getElementById('bm-file');
      var file     = fileInput.files && fileInput.files[0];

      if (!title) { global.UI.notify('Title is required', 'error'); return; }
      if (!url && !file && !id) {
        global.UI.notify('Provide a URL or upload an HTML file', 'error');
        return;
      }

      function commit(payload) {
        if (id) {
          global.BookmarkModel.update(id, payload);
          global.UI.notify('Bookmark updated', 'success');
        } else {
          global.BookmarkModel.add(payload);
          global.UI.notify('Bookmark added', 'success');
        }
        global.UI.resetForm();
        fileInput.value = '';
        render();
      }

      if (file) {
        global.FileHandler.readHtmlFile(file)
          .then(function (htmlContent) {
            commit({
              title: title,
              url: url,
              tags: tags,
              category: category,
              type: 'html',
              htmlContent: htmlContent
            });
          })
          .catch(function (err) { global.UI.notify(err.message, 'error'); });
      } else {
        commit({
          title: title,
          url: url,
          tags: tags,
          category: category,
          type: id ? undefined : 'link' // keep existing type on edit
        });
      }
    });

    document.getElementById('form-cancel').addEventListener('click', function () {
      global.UI.resetForm();
      document.getElementById('bm-file').value = '';
    });

    /* ---------- Search ---------- */
    var searchInput = document.getElementById('search-input');
    var searchTimer;
    searchInput.addEventListener('input', function (e) {
      clearTimeout(searchTimer);
      var v = e.target.value;
      searchTimer = setTimeout(function () {
        global.UI.setSearchQuery(v);
        global.UI.renderBookmarks();
      }, 120);
    });

    /* ---------- Category filter (event delegation) ---------- */
    document.getElementById('category-filters').addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      global.UI.setActiveCategory(btn.dataset.category);
      global.UI.renderCategories();
      global.UI.renderBookmarks();
    });

    /* ---------- Export ---------- */
    document.getElementById('export-btn').addEventListener('click', function () {
      var n = global.FileHandler.exportBookmarks();
      global.UI.notify('Exported ' + n + ' bookmark' + (n === 1 ? '' : 's'), 'success');
    });

    /* ---------- Import ---------- */
    document.getElementById('import-input').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      global.FileHandler.importBookmarks(file)
        .then(function (data) {
          global.UI.confirm(
            'Import ' + data.length + ' bookmarks? This replaces your current data.',
            function () {
              global.BookmarkModel.replaceAll(data);
              render();
              global.UI.notify('Imported ' + data.length + ' bookmarks', 'success');
            }
          );
        })
        .catch(function (err) { global.UI.notify(err.message, 'error'); })
        .then(function () { e.target.value = ''; });
    });

  });

})(window);
