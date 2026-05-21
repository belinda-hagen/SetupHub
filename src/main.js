const fs = require('fs/promises');
const { app, BrowserWindow, clipboard, ipcMain, nativeImage } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const updater = require('./updater');

app.commandLine.appendSwitch('disable-http-cache');
app.setPath('sessionData', path.join(app.getPath('temp'), 'SetupHub-session'));
app.setPath('userData', path.join(app.getPath('temp'), 'SetupHub-user-data'));

const programIconCache = new Map();

function getMimeTypeForIcon(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === '.png') {
    return 'image/png';
  }

  if (extension === '.jpg' || extension === '.jpeg') {
    return 'image/jpeg';
  }

  if (extension === '.webp') {
    return 'image/webp';
  }

  if (extension === '.svg') {
    return 'image/svg+xml';
  }

  return null;
}

async function readLocalProgramIcon(localIconPath) {
  if (!localIconPath) {
    return null;
  }

  const absolutePath = path.resolve(__dirname, '..', 'icons', localIconPath);
  const mimeType = getMimeTypeForIcon(absolutePath);

  if (!mimeType) {
    return null;
  }

  try {
    const buffer = await fs.readFile(absolutePath);
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

async function fetchProgramIcon(iconUrl, iconColor) {
  if (!iconUrl) {
    return null;
  }

  try {
    const response = await fetch(iconUrl);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || getMimeTypeForIcon(iconUrl) || 'image/png';

    if (contentType.includes('svg')) {
      let svgContent = await response.text();

      if (iconColor) {
        svgContent = svgContent.replace('<svg', `<svg color="${iconColor}" fill="${iconColor}"`);
      }

      return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

function launchDetached(binary, args) {
  return new Promise((resolve) => {
    const child = spawn(binary, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    });

    child.once('error', (error) => {
      resolve({ ok: false, error: error.message });
    });

    child.once('spawn', () => {
      child.unref();
      resolve({ ok: true });
    });
  });
}

function escapeAppleScript(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function launchLinuxTerminal(command) {
  const wrappedCommand = `${command}; printf '\n'; echo 'Press Enter to close...'; read _`;
  const candidates = [
    ['x-terminal-emulator', ['-e', 'bash', '-lc', wrappedCommand]],
    ['gnome-terminal', ['--', 'bash', '-lc', wrappedCommand]],
    ['konsole', ['-e', 'bash', '-lc', wrappedCommand]],
    ['xterm', ['-e', 'bash', '-lc', wrappedCommand]],
  ];

  return candidates.reduce(async (previous, [binary, args]) => {
    const result = await previous;

    if (result.ok) {
      return result;
    }

    return launchDetached(binary, args);
  }, Promise.resolve({ ok: false, error: 'No Linux terminal launcher available.' }));
}

ipcMain.handle('setuphub:get-program-icon', async (_event, siteUrl, localIconPath, iconUrl, iconColor) => {
  const cacheKey = `${siteUrl}::${localIconPath || ''}::${iconUrl || ''}::${iconColor || ''}`;

  if (programIconCache.has(cacheKey)) {
    return programIconCache.get(cacheKey);
  }

  const remoteIcon = await fetchProgramIcon(iconUrl, iconColor);

  if (remoteIcon) {
    programIconCache.set(cacheKey, remoteIcon);
    return remoteIcon;
  }

  const localIcon = await readLocalProgramIcon(localIconPath);

  if (localIcon) {
    programIconCache.set(cacheKey, localIcon);
    return localIcon;
  }

  try {
    const iconUrl = `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(siteUrl)}`;
    const response = await fetch(iconUrl);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await response.arrayBuffer());
    const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`;

    programIconCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
});

ipcMain.handle('setuphub:install-program', (_event, installCommand) => {
  if (process.platform === 'win32') {
    return launchDetached('cmd.exe', [
      '/c',
      'start',
      '',
      'powershell.exe',
      '-NoExit',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      installCommand,
    ]);
  }

  if (process.platform === 'darwin') {
    const appleScript = [
      'tell application "Terminal"',
      'activate',
      `do script "${escapeAppleScript(installCommand)}"`,
      'end tell',
    ].join('\n');

    return launchDetached('osascript', ['-e', appleScript]);
  }

  return launchLinuxTerminal(installCommand);
});

ipcMain.handle('setuphub:open-external', (_event, targetUrl) => {
  if (process.platform === 'win32') {
    return launchDetached('cmd.exe', ['/c', 'start', '', targetUrl]);
  }

  if (process.platform === 'darwin') {
    return launchDetached('open', [targetUrl]);
  }

  return launchDetached('xdg-open', [targetUrl]);
});

ipcMain.handle('setuphub:copy-text', (_event, text) => {
  if (typeof text !== 'string') {
    return { ok: false, error: 'Clipboard text must be a string.' };
  }

  try {
    clipboard.writeText(text);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Clipboard write failed.' };
  }
});

ipcMain.handle('setuphub:updater-version', () => updater.getCurrentVersion());
ipcMain.handle('setuphub:updater-check', (_event, options) => updater.checkForUpdates(options || {}));
ipcMain.handle('setuphub:updater-download', () => updater.downloadUpdate());
ipcMain.handle('setuphub:updater-install', () => updater.installUpdate());

ipcMain.handle('setuphub:window-action', (event, action) => {
  const activeWindow = BrowserWindow.fromWebContents(event.sender);

  if (!activeWindow) {
    return false;
  }

  switch (action) {
    case 'minimize':
      activeWindow.minimize();
      return true;
    case 'toggle-maximize':
      if (activeWindow.isMaximized()) {
        activeWindow.unmaximize();
      } else {
        activeWindow.maximize();
      }
      return true;
    case 'close':
      activeWindow.close();
      return true;
    default:
      return false;
  }
});

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const appIcon = nativeImage.createFromPath(iconPath);

  const mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 900,
    minHeight: 620,
    frame: false,
    backgroundColor: '#090c0a',
    autoHideMenuBar: true,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  setTimeout(() => {
    updater.checkForUpdates({ manual: false }).catch(() => {});
  }, 5000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});