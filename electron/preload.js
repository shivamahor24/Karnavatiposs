/**
 * Anndevta POS — Electron Preload Script
 *
 * Exposes a minimal, safe API to the renderer via contextBridge.
 * Node integration is disabled in the renderer for security.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /** App version from package.json */
  getVersion: () => ipcRenderer.invoke('get-version'),

  /** Open the log directory in Windows Explorer */
  openLogs: () => ipcRenderer.invoke('open-logs'),

  /** Platform info */
  platform: process.platform,

  /** Secure persistent auth storage APIs */
  setAuthData: (key, value) => ipcRenderer.invoke('set-auth-data', { key, value }),
  getAuthData: (key) => ipcRenderer.invoke('get-auth-data', { key }),
  deleteAuthData: (key) => ipcRenderer.invoke('delete-auth-data', { key }),
  clearAuthData: () => ipcRenderer.invoke('clear-auth-data'),

  /** Logger bridge */
  log: (tag, message) => ipcRenderer.send('log-from-renderer', { tag, message }),

  /** Printer API for Desktop Printing & Auto-Cut */
  printer: {
    getPrinters: () =>
      ipcRenderer.invoke('printer:get-printers'),
  
    print: (html, printerName, paperWidth) =>
      ipcRenderer.invoke('printer:print', {
        html,
        printerName,
        paperWidth
      }),
  
    printParcel: (
      kitchenHTML,
      customerHTML,
      printerName,
      paperWidth
    ) =>
      ipcRenderer.invoke('printer:print-parcel', {
        kitchenHTML,
        customerHTML,
        printerName,
        paperWidth
      }),
  
    testPrint: (printerName, paperWidth) =>
      ipcRenderer.invoke('printer:test-print', {
        printerName,
        paperWidth
      }),
  },
});

