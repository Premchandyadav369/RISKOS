/**
 * RISKOS Electron Standalone Desktop Application
 * ==============================================================================
 * Multi-window desktop packaging with global kill switch shortcut, system tray,
 * and high-frequency local IPC.
 * Architect: Premchand Yadav
 */

const { app, BrowserWindow, globalShortcut, Menu, Tray, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1280,
    minHeight: 800,
    backgroundColor: '#060a14',
    title: 'RISKOS Institutional Quantitative Workstation',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Global Emergency Kill Switch Shortcut: Ctrl+Shift+K
  globalShortcut.register('CommandOrControl+Shift+K', () => {
    console.log('[ELECTRON SHIELD] Global Emergency Kill Switch triggered!');
    if (mainWindow) {
      mainWindow.webContents.send('riskos:emergency-kill-switch', {
        timestamp: Date.now(),
        reason: 'GLOBAL_HOTKEY_TRIGGERED'
      });
    }
  });
}

function createTray() {
  // Use blank tray icon if no image available
  tray = new Tray(path.join(__dirname, '..', 'assets', 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'RISKOS Institutional Core v2.0.0', enabled: false },
    { type: 'separator' },
    { label: 'Show Master Terminal', click: () => { if (mainWindow) mainWindow.show(); } },
    {
      label: '⚡ Emergency Kill Switch (Pull Quotes)',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('riskos:emergency-kill-switch', { reason: 'TRAY_CLICK' });
        }
      }
    },
    { type: 'separator' },
    { label: 'Quit RISKOS', click: () => { app.quit(); } }
  ]);
  tray.setToolTip('RISKOS High-Frequency Terminal');
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  createWindow();
  try {
    createTray();
  } catch (err) {
    // Tray image may not exist in CI/headless mode
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('riskos:system-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage()
  };
});
