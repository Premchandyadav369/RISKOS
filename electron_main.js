/**
 * RISKOS Electron Native Desktop Workstation Launcher
 * Supports multi-window Bloomberg quad walls, native hardware acceleration, and WebGPU.
 */

const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

// Enable GPU hardware acceleration and WebGPU features
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('enable-features', 'Vulkan,DefaultANGLEVulkan,WebGPU');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const mainWindow = new BrowserWindow({
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
  return mainWindow;
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
