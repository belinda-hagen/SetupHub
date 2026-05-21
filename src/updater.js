const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.allowDowngrade = false;

let lastUpdateInfo = null;

function broadcast(channel, payload) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  }
}

function buildReleasePayload(info) {
  const file = Array.isArray(info?.files) ? info.files[0] : null;
  return {
    version: info?.version || '',
    notes: typeof info?.releaseNotes === 'string' ? info.releaseNotes : '',
    asset: {
      name: file?.url || '',
      size: file?.size ?? 0,
    },
  };
}

autoUpdater.on('checking-for-update', () => {
  broadcast('updater:checking', {});
});

autoUpdater.on('update-available', (info) => {
  lastUpdateInfo = info;
  broadcast('updater:available', buildReleasePayload(info));
});

autoUpdater.on('update-not-available', (info) => {
  broadcast('updater:not-available', {
    currentVersion: app.getVersion(),
    latestVersion: info?.version || '',
  });
});

autoUpdater.on('download-progress', (progress) => {
  broadcast('updater:progress', {
    received: progress?.transferred ?? 0,
    total: progress?.total ?? 0,
    percent: Math.min(100, Math.round(progress?.percent ?? 0)),
  });
});

autoUpdater.on('update-downloaded', (info) => {
  broadcast('updater:downloaded', {
    version: info?.version || lastUpdateInfo?.version || '',
  });
});

autoUpdater.on('error', (err) => {
  broadcast('updater:error', {
    message: err?.message || 'Update failed.',
  });
});

function parseVersion(value) {
  if (!value) return null;
  const cleaned = String(value).trim().replace(/^v/i, '');
  const parts = cleaned.split('.').map((part) => {
    const num = parseInt(part, 10);
    return Number.isFinite(num) ? num : 0;
  });
  while (parts.length < 3) parts.push(0);
  return parts;
}

function isNewer(latest, current) {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  if (!a || !b) return false;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return false;
}

async function checkForUpdates() {
  // electron-updater needs an embedded app-update.yml that is only present
  // in packaged builds. In dev, short-circuit instead of erroring.
  if (!app.isPackaged) {
    return {
      ok: true,
      available: false,
      currentVersion: app.getVersion(),
      reason: 'dev-mode',
    };
  }

  try {
    const result = await autoUpdater.checkForUpdates();
    const currentVersion = app.getVersion();
    const latestVersion = result?.updateInfo?.version || '';
    const available = isNewer(latestVersion, currentVersion);
    return { ok: true, available, currentVersion, latestVersion };
  } catch (error) {
    return { ok: false, error: error?.message || 'Update check failed.' };
  }
}

async function downloadUpdate() {
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error?.message || 'Download failed.' };
  }
}

async function installUpdate() {
  try {
    // Defer so the IPC response can return before the app quits.
    // (isSilent=true, isForceRunAfter=true) matches our one-click NSIS config
    // and relaunches the app after install.
    setImmediate(() => autoUpdater.quitAndInstall(true, true));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error?.message || 'Install failed.' };
  }
}

module.exports = {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  getCurrentVersion: () => app.getVersion(),
};
