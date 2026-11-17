/**
 * RISKOS Electron Preload Bridge
 * Architect: Premchand Yadav
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('RiskosDesktopBridge', {
  isDesktop: true,
  getSystemInfo: () => ipcRenderer.invoke('riskos:system-info'),
  onEmergencyKillSwitch: (callback) => {
    ipcRenderer.on('riskos:emergency-kill-switch', (event, data) => callback(data));
  }
});
