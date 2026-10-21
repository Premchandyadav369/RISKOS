/**
 * RISKOS Electron Native Desktop Workstation Launcher
 * Supports multi-window Bloomberg quad walls, native hardware acceleration, and WebGPU.
 */

const { app, BrowserWindow, screen, globalShortcut, Menu } = require('electron');
const path = require('path');

// Enable GPU hardware acceleration and WebGPU features
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('enable-features', 'Vulkan,DefaultANGLEVulkan,WebGPU');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

let mainWindow = null;

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1920, width),
    height: Math.min(1080, height),
    title: 'RISKOS Institutional Terminal',
    backgroundColor: '#05070d',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webgl: true
    }
  });

  mainWindow.loadFile('index.html');

  // Register Global Bloomberg Shortcuts
  globalShortcut.register('CommandOrControl+K', () => {
    mainWindow.webContents.executeJavaScript('window.UniversalPalette && window.UniversalPalette.open()');
  });

  globalShortcut.register('Alt+A', () => {
    mainWindow.webContents.executeJavaScript('window.QuantCopilot && window.QuantCopilot.getInstance && window.QuantCopilot.getInstance().toggle()');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

app.whenReady().then(() => {
  createMainWindow();

  // Create Institutional Terminal Menu
  const template = [
    {
      label: 'RISKOS',
      submenu: [
        { label: 'About RISKOS', click: () => mainWindow.webContents.executeJavaScript('alert("RISKOS Institutional Terminal v2.0\\nArchitect: Premchand Yadav")') },
        { type: 'separator' },
        { label: 'Quit', role: 'quit' }
      ]
    },
    {
      label: 'Desks',
      submenu: [
        { label: 'Executive Dashboard', click: () => mainWindow.loadFile('index.html') },
        { label: '8 Trading Desks', click: () => mainWindow.loadFile('app.html') },
        { label: 'HFT Microstructure Desk', click: () => mainWindow.loadFile('hft.html') },
        { label: 'Goldman Sachs Quant Desk', click: () => mainWindow.loadFile('gs_quant.html') },
        { label: 'Autonomous Fleet (41 Bots)', click: () => mainWindow.loadFile('fleet.html') },
        { label: 'Macro Observatory', click: () => mainWindow.loadFile('observatory.html') },
        { label: '80 Quant Labs & Academy', click: () => mainWindow.loadFile('learn.html') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
