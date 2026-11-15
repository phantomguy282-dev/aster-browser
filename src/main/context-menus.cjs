'use strict';
/**
 * ASTER context menus (desktop).
 *
 * Builds element-aware native menus from webContents 'context-menu' events.
 * Only actions valid for the probed element and supported by the engine are
 * shown. All navigation goes through the app's existing URL policy; no menu
 * item bypasses site-control, adblock or permission decisions.
 */
const { MenuItem } = (() => { try { return require('electron'); } catch { return {}; } })();

const MAX_TEXT = 400;

function clipped(text) {
  const clean = String(text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  return clean.length > 60 ? clean.slice(0, 57) + '…' : clean;
}

class ContextMenus {
  constructor(app) {
    this.app = app;
    this.lastTabId = null;
    this.menu = null; // Built lazily; class require happens in main process only.
  }

  /**
   * Attach to a tab's webContents. Called from Tabs when creating views.
   */
  attach(tab) {
    const wc = tab.view.webContents;
    wc.on('context-menu', (event, params) => {
      event.preventDefault();
      this.show(tab, params);
    });
  }

  show(tab, params) {
    const Electron = require('electron');
    const Menu = Electron.Menu;
    this.lastTabId = tab.id;
    const items = this.buildItems(tab, params, Electron);
    if (!items.length) return;
    this.menu = Menu.buildFromTemplate(items);
    this.menu.popup({ window: this.app.win });
  }

  buildItems(tab, p, Electron) {
    const command = (action, payload = {}) => () => {
      // Route through the same hardened command path as the renderer.
      this.app.command(action, payload).catch(err => {
        if (this.app.win && !this.app.win.isDestroyed()) {
          new Electron.Notification ? null : null;
        }
      });
    };
    const wc = tab.view.webContents;
    const items = [];
    const label = clipped(p.selectionText) || clipped(p.misspelledWord);

    // --- Editable fields -------------------------------------------------
    if (p.isEditable) {
      items.push(
        { label: 'Undo', role: 'undo' }, { label: 'Redo', role: 'redo' }, { type: 'separator' },
        { label: 'Cut', role: 'cut', enabled: p.editFlags.canCut },
        { label: 'Copy', role: 'copy', enabled: p.editFlags.canCopy },
        { label: 'Paste', role: 'paste', enabled: p.editFlags.canPaste },
        { label: 'Paste and match style', role: 'pasteAndMatchStyle', enabled: p.editFlags.canPaste },
        { label: 'Select all', role: 'selectAll', enabled: p.editFlags.canSelectAll }, { type: 'separator' }
      );
    }

    // --- Selected text ----------------------------------------------------
    if (p.selectionText && !p.isEditable) {
      items.push(
        { label: 'Copy', role: 'copy' },
        { label: `Search the web for “${clipped(p.selectionText)}”`, click: () => this.searchFor(tab, p.selectionText) },
        { type: 'separator' }
      );
    }

    // --- Links -------------------------------------------------------------
    if (p.linkURL) {
      items.push(
        { label: 'Open link in new tab', click: () => this.openLink(tab, p.linkURL, false) },
        { label: 'Open link in new private tab', click: () => this.openLink(tab, p.linkURL, true) },
        { label: 'Copy link address', click: () => Electron.clipboard.writeText(p.linkURL) },
        { type: 'separator' }
      );
    }

    // --- Images -------------------------------------------------------------
    if (p.hasImageContents || p.mediaType === 'image') {
      const src = p.srcURL || p.linkURL;
      if (src) {
        items.push(
          { label: 'Open image in new tab', click: () => this.openLink(tab, src, false) },
          { label: 'Copy image address', click: () => Electron.clipboard.writeText(src) },
          { label: 'Save image as…', click: () => this.saveMedia(tab, src, 'image', Electron) },
          { type: 'separator' }
        );
      }
    }

    // --- Media (video/audio) -------------------------------------------------
    if (p.mediaType === 'video' || p.mediaType === 'audio') {
      if (p.mediaFlags?.canToggleControls) items.push({ label: p.mediaFlags.isControlsVisible ? 'Hide controls' : 'Show controls', click: () => wc.executeJavaScript(`(()=>{const m=${JSON.stringify(p.x)},v=document.elementFromPoint(${p.x},${p.y});if(v){v.controls=${!p.mediaFlags.isControlsVisible}}})()`).catch(() => {}) });
      if (p.mediaFlags?.canLoop) items.push({ label: p.mediaFlags.isLooping ? 'Stop looping' : 'Loop', click: () => wc.executeJavaScript(`(()=>{const v=document.elementFromPoint(${p.x},${p.y});if(v){v.loop=${!p.mediaFlags.isLooping}}})()`).catch(() => {}) });
      items.push({ type: 'separator' });
    }

    // --- Page actions ---------------------------------------------------------
    const isWeb = /^https?:/i.test(tab.url || '');
    if (isWeb) {
      items.push(
        { label: 'Back', enabled: wc.navigationHistory.canGoBack(), click: () => wc.goBack() },
        { label: 'Forward', enabled: wc.navigationHistory.canGoForward(), click: () => wc.goForward() },
        { label: 'Reload', click: () => wc.reload() },
        { type: 'separator' },
        { label: 'Save page as…', click: () => this.savePage(tab, Electron) },
        { label: 'Bookmark this page…', click: () => this.bookmarkPage(tab) },
        { label: 'Copy page address', click: () => Electron.clipboard.writeText(tab.url) },
        { label: 'Print…', click: () => wc.print().catch(() => {}) },
        { type: 'separator' },
        { label: 'View page source', click: () => this.viewSource(tab) },
        { label: 'Inspect element', click: () => { try { wc.inspectElement(p.x, p.y); } catch { wc.openDevTools({ mode: 'detach' }); } } }
      );
      if (p.selectionText) items.push({ label: 'Search with default engine', visible: false });
    } else if (items.length && items[items.length - 1].type !== 'separator') {
      items.push({ type: 'separator' });
    }

    // --- Tab actions (right-click on page background) -----------------------
    if (!p.linkURL && !p.hasImageContents && p.mediaType === 'none' && !p.isEditable && !p.selectionText) {
      items.push(
        { type: 'separator' },
        { label: 'Duplicate tab', click: () => this.app.command('duplicateTab', { id: tab.id }).catch(() => {}) },
        { label: state_pin(tab) ? 'Unpin tab' : 'Pin tab', click: () => this.app.command('pinTab', { id: tab.id }).catch(() => {}) },
        { label: 'Reopen closed tab', click: () => this.app.command('restoreTab').catch(() => {}) },
        { label: 'Close tab', click: () => this.app.command('closeTab', { id: tab.id }).catch(() => {}) }
      );
    }
    return items;
  }

  // -- helpers ---------------------------------------------------------------
  searchFor(tab, text) {
    const engine = (this.app.store.data.settings.searchEngine) || 'google';
    const q = encodeURIComponent(String(text).slice(0, MAX_TEXT));
    const engines = { google: `https://www.google.com/search?q=${q}`, bing: `https://www.bing.com/search?q=${q}`, duckduckgo: `https://duckduckgo.com/?q=${q}` };
    this.openLink(tab, engines[engine] || engines.google, false);
  }

  openLink(tab, url, priv) {
    // create() runs the same will-navigate/site-control/adblock gates as renderer navigation.
    this.app.tabs.create(url, priv === true).catch(() => {});
  }

  async savePage(tab, Electron) {
    const { dialog } = Electron;
    const r = await dialog.showSaveDialog(this.app.win, { defaultPath: (tab.title || 'page').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80) + '.html', filters: [{ name: 'Web page', extensions: ['html'] }] });
    if (r.canceled || !r.filePath) return;
    try { await tab.view.webContents.savePage(r.filePath, 'HTMLComplete'); } catch { /* user feedback via toast is renderer's job; silent fail mirrors capturePage */ }
  }

  bookmarkPage(tab) {
    // Opens the same editor the renderer uses, via the shared UI command path.
    this.app.win?.webContents.send('aster:open-bookmark-editor', { url: tab.url, title: tab.title });
  }

  viewSource(tab) {
    this.app.tabs.create('view-source:' + tab.url, false).catch(() => {});
  }

  async saveMedia(tab, url, kind, Electron) {
    const { dialog, DownloadURL } = Electron;
    const wc = tab.view.webContents;
    const r = await dialog.showSaveDialog(this.app.win, { defaultPath: 'aster-media' });
    if (r.canceled || !r.filePath) return;
    wc.downloadURL(url);
  }
}

function state_pin(tab) {
  return tab.pinned === true;
}

module.exports = { ContextMenus };
