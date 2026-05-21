const { contextBridge, ipcRenderer } = require('electron');

const updaterEventChannels = {
  onUpdaterChecking: 'updater:checking',
  onUpdaterAvailable: 'updater:available',
  onUpdaterNotAvailable: 'updater:not-available',
  onUpdaterProgress: 'updater:progress',
  onUpdaterDownloaded: 'updater:downloaded',
  onUpdaterError: 'updater:error',
};

const updaterApi = {
  getCurrentVersion() {
    return ipcRenderer.invoke('setuphub:updater-version');
  },
  checkForUpdates(options) {
    return ipcRenderer.invoke('setuphub:updater-check', options);
  },
  downloadUpdate() {
    return ipcRenderer.invoke('setuphub:updater-download');
  },
  installUpdate() {
    return ipcRenderer.invoke('setuphub:updater-install');
  },
};

for (const [methodName, channel] of Object.entries(updaterEventChannels)) {
  updaterApi[methodName] = (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  };
}

contextBridge.exposeInMainWorld('setupHubApi', {
  hostPlatform: process.platform,
  copyText(text) {
    return ipcRenderer.invoke('setuphub:copy-text', text);
  },
  windowAction(action) {
    return ipcRenderer.invoke('setuphub:window-action', action);
  },
  getProgramIcon(siteUrl, localIconPath, iconUrl, iconColor) {
    return ipcRenderer.invoke('setuphub:get-program-icon', siteUrl, localIconPath, iconUrl, iconColor);
  },
  installProgram(command) {
    return ipcRenderer.invoke('setuphub:install-program', command);
  },
  openExternal(url) {
    return ipcRenderer.invoke('setuphub:open-external', url);
  },
  ...updaterApi,
});
