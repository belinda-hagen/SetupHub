import { categories, programs } from './data/programs.js';

const searchInput = document.querySelector('#searchInput');
const categorySelect = document.querySelector('#categorySelect');
const actionModeFilters = document.querySelector('#actionModeFilters');
const commandPlatformFilters = document.querySelector('#commandPlatformFilters');
const programGrid = document.querySelector('#programGrid');
const toolbar = document.querySelector('.toolbar');
const resultsBar = document.querySelector('.results-bar');
const catalog = document.querySelector('.catalog');
const setupListPage = document.querySelector('#setupListPage');
const setupListPageBody = document.querySelector('.setup-list-page-body');
const setupListSummary = document.querySelector('#setupListSummary');
const resultsLabel = document.querySelector('#resultsLabel');
const viewListBtn = document.querySelector('#viewListBtn');
const viewGridBtn = document.querySelector('#viewGridBtn');
const statusMessage = document.querySelector('#statusMessage');
const statusMessageText = document.querySelector('#statusMessageText');
const statusMessageClose = document.querySelector('#statusMessageClose');
const downloadsBadge = document.querySelector('#downloadsBadge');
const downloadsButton = document.querySelector('#downloadsButton');
const downloadsPanel = document.querySelector('#downloadsPanel');
const downloadsList = document.querySelector('#downloadsList');
const clearDownloadsButton = document.querySelector('#clearDownloadsButton');
const notificationBadge = document.querySelector('#notificationBadge');
const notificationsButton = document.querySelector('#notificationsButton');
const notificationsPanel = document.querySelector('#notificationsPanel');
const notificationsList = document.querySelector('#notificationsList');
const clearNotificationsButton = document.querySelector('#clearNotificationsButton');
const homeButton = document.querySelector('#homeButton');
const setupListBadge = document.querySelector('#setupListBadge');
const setupListButton = document.querySelector('#setupListButton');
const setupListItems = document.querySelector('#setupListItems');
const setupListBackButton = document.querySelector('#setupListBackButton');
const setupListViewListButton = document.querySelector('#setupListViewListButton');
const setupListViewGridButton = document.querySelector('#setupListViewGridButton');
const addCustomAppButton = document.querySelector('#addCustomAppButton');
const copySetupListButton = document.querySelector('#copySetupListButton');
const clearSetupListButton = document.querySelector('#clearSetupListButton');
const settingsButton = document.querySelector('#settingsButton');
const githubRepoButton = document.querySelector('#githubRepoButton');
const minimizeWindowButton = document.querySelector('#minimizeWindowButton');
const toggleMaximizeWindowButton = document.querySelector('#toggleMaximizeWindowButton');
const closeWindowButton = document.querySelector('#closeWindowButton');
const customAppBackdrop = document.querySelector('#customAppBackdrop');
const customAppForm = document.querySelector('#customAppForm');
const customAppCloseButton = document.querySelector('#customAppCloseButton');
const customAppCancelButton = document.querySelector('#customAppCancelButton');
const customAppNameInput = document.querySelector('#customAppNameInput');
const customAppUrlInput = document.querySelector('#customAppUrlInput');
const customAppCommandInput = document.querySelector('#customAppCommandInput');
const customAppCommandHelp = document.querySelector('#customAppCommandHelp');
const customAppIconInput = document.querySelector('#customAppIconInput');
const customAppIconPreview = document.querySelector('#customAppIconPreview');
const customAppIconPreviewImage = document.querySelector('#customAppIconPreviewImage');
const customAppIconPreviewFallback = document.querySelector('#customAppIconPreviewFallback');
const clearCustomAppIconButton = document.querySelector('#clearCustomAppIconButton');
const cardTemplate = document.querySelector('#programCardTemplate');
const updateToast = document.querySelector('#updateToast');
const updateToastTitle = document.querySelector('#updateToastTitle');
const updateToastMessage = document.querySelector('#updateToastMessage');
const updateToastProgress = document.querySelector('#updateToastProgress');
const updateToastProgressBar = document.querySelector('#updateToastProgressBar');
const updateToastProgressText = document.querySelector('#updateToastProgressText');
const updateToastActions = document.querySelector('#updateToastActions');
const updateToastPrimary = document.querySelector('#updateToastPrimary');
const updateToastSecondary = document.querySelector('#updateToastSecondary');
const updateToastClose = document.querySelector('#updateToastClose');

const actionModes = [
  {
    id: 'install',
    label: 'Install',
    status: 'Cards install with commands for the current device platform.',
  },
  {
    id: 'command',
    label: 'Copy command',
    status: 'Cards copy the install command to clipboard.',
  },
];

const commandPlatforms = [
  { id: 'windows', label: 'Windows' },
  { id: 'mac', label: 'macOS' },
  { id: 'linux', label: 'Linux' },
];

const REPOSITORY_URL = 'https://github.com/belinda-hagen/SetupHub';

const hostPlatform = normalizeHostPlatform(window.setupHubApi.hostPlatform);

const SETUP_LIST_KEY = 'setuphub_setup_list';
const SETUP_LIST_VIEW_KEY = 'setuphub_setup_list_view';

const state = {
  activeCategory: 'all',
  actionMode: 'install',
  commandPlatform: hostPlatform,
  searchTerm: '',
  downloads: [],
  notifications: [],
  openPanel: null,
  activePage: 'catalog',
  viewMode: 'grid',
  setupListViewMode: localStorage.getItem(SETUP_LIST_VIEW_KEY) === 'list' ? 'list' : 'grid',
  setupList: JSON.parse(localStorage.getItem(SETUP_LIST_KEY) || '[]'),
};

let toastTimer = null;
let customAppIconDataUrl = null;

function showToast(message) {
  statusMessageText.textContent = message;
  statusMessage.classList.add('visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    statusMessage.classList.remove('visible');
  }, 2400);
}

function hideToast() {
  statusMessage.classList.remove('visible');
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
}

statusMessageClose.addEventListener('click', hideToast);

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function copyTextToClipboard(text) {
  const result = await window.setupHubApi.copyText(text);

  if (!result?.ok) {
    throw new Error(result?.error || 'Clipboard write failed.');
  }
}

function createFeedItem(entry, options = {}) {
  const item = document.createElement('article');
  item.className = `feed-item${options.emphasis ? ' is-emphasis' : ''}`;
  item.innerHTML = `
    <div class="feed-item-copy">
      <strong>${entry.title}</strong>
      <p>${entry.message}</p>
    </div>
    <span class="feed-item-time">${formatTime(entry.timestamp)}</span>
  `;
  return item;
}

function renderNotifications() {
  const unreadCount = state.notifications.filter((entry) => !entry.read).length;

  if (unreadCount <= 0) {
    notificationBadge.classList.add('hidden');
  } else {
    notificationBadge.classList.remove('hidden');
    notificationBadge.textContent = String(unreadCount);
  }

  if (state.notifications.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'dropdown-empty';
    empty.innerHTML = '<strong>No notifications</strong><p>Actions you take in SetupHub will appear here.</p>';
    notificationsList.replaceChildren(empty);
    return;
  }

  notificationsList.replaceChildren(...state.notifications.map((entry) => createFeedItem(entry)));
}

function renderDownloads() {
  if (state.downloads.length === 0) {
    downloadsBadge.classList.add('hidden');
    const empty = document.createElement('div');
    empty.className = 'dropdown-empty';
    empty.innerHTML = '<strong>No installs yet</strong><p>Programs you launch from the Install button will show up here.</p>';
    downloadsList.replaceChildren(empty);
    return;
  }

  downloadsBadge.classList.remove('hidden');
  downloadsBadge.textContent = String(state.downloads.length);

  const items = state.downloads.map((entry) => {
    const item = createFeedItem(
      {
        title: entry.name,
        message: entry.status,
        timestamp: entry.timestamp,
      },
      { emphasis: entry.state === 'running' }
    );
    return item;
  });

  downloadsList.replaceChildren(...items);
}

function addNotification(title, message) {
  state.notifications.unshift({
    id: crypto.randomUUID(),
    title,
    message,
    timestamp: Date.now(),
    read: false,
  });
  state.notifications = state.notifications.slice(0, 12);
  renderNotifications();
}

function setPanel(panelName) {
  state.openPanel = state.openPanel === panelName ? null : panelName;

  const notificationsOpen = state.openPanel === 'notifications';
  const downloadsOpen = state.openPanel === 'downloads';

  notificationsPanel.classList.toggle('hidden', !notificationsOpen);
  downloadsPanel.classList.toggle('hidden', !downloadsOpen);
  notificationsButton.setAttribute('aria-expanded', String(notificationsOpen));
  downloadsButton.setAttribute('aria-expanded', String(downloadsOpen));

  if (notificationsOpen) {
    state.notifications = state.notifications.map((entry) => ({ ...entry, read: true }));
    renderNotifications();
  }
}

function setPage(pageName) {
  state.activePage = pageName === 'setupList' ? 'setupList' : 'catalog';
  const setupListActive = state.activePage === 'setupList';

  setPanel(null);
  toolbar.classList.toggle('hidden', setupListActive);
  resultsBar.classList.toggle('hidden', setupListActive);
  catalog.classList.toggle('hidden', setupListActive);
  setupListPage.classList.toggle('hidden', !setupListActive);
  homeButton.classList.toggle('is-active', !setupListActive);
  setupListButton.classList.toggle('is-active', setupListActive);
  syncSetupListGridCardWidth();
}

function clearPanel(panelName) {
  if (panelName === 'notifications') {
    state.notifications = [];
    renderNotifications();
    return;
  }

  state.downloads = [];
  renderDownloads();
}

// ── SETUP LIST ─────────────────────────────────────────────────────────────

function saveSetupList() {
  localStorage.setItem(SETUP_LIST_KEY, JSON.stringify(state.setupList));
}

function getCatalogGridColumnCount() {
  if (window.innerWidth <= 600) {
    return 1;
  }

  if (window.innerWidth <= 900) {
    return 2;
  }

  return 3;
}

function syncSetupListGridCardWidth() {
  const containerWidth = state.activePage === 'setupList'
    ? setupListPageBody.clientWidth
    : catalog.clientWidth;

  if (!containerWidth) {
    return;
  }

  const columns = getCatalogGridColumnCount();
  const gap = 12;
  const cardWidth = Math.max(0, Math.floor((containerWidth - (gap * (columns - 1))) / columns));
  setupListItems.style.setProperty('--setup-list-grid-columns', String(columns));
  setupListItems.style.setProperty('--setup-list-card-width', `${cardWidth}px`);
}

function applySetupListViewMode() {
  const isGrid = state.setupList.length === 1 || state.setupListViewMode === 'grid';
  setupListItems.classList.add('program-grid');
  setupListItems.classList.toggle('is-grid', isGrid);
  setupListViewListButton.classList.toggle('active', !isGrid);
  setupListViewGridButton.classList.toggle('active', isGrid);
  setupListViewListButton.setAttribute('aria-pressed', String(!isGrid));
  setupListViewGridButton.setAttribute('aria-pressed', String(isGrid));
  syncSetupListGridCardWidth();
}

function setSetupListViewMode(mode) {
  state.setupListViewMode = mode === 'grid' ? 'grid' : 'list';
  localStorage.setItem(SETUP_LIST_VIEW_KEY, state.setupListViewMode);
  applySetupListViewMode();
}

function isInSetupList(programName) {
  return state.setupList.some((item) => normalize(item.name) === normalize(programName));
}

function addToSetupList(program) {
  if (isInSetupList(program.name)) return;
  state.setupList.push({
    id: crypto.randomUUID(),
    type: 'catalog',
    programId: program.id,
    name: program.name,
    category: program.category,
    site: program.site,
  });
  saveSetupList();
  renderSetupList();
  refreshSetupListButtons();
}

function removeFromSetupList(programName) {
  const normalizedName = normalize(programName);
  state.setupList = state.setupList.filter((item) => normalize(item.name) !== normalizedName);
  saveSetupList();
  renderSetupList();
  refreshSetupListButtons();
}

function normalizeWebsiteUrl(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return '';
  }

  const candidate = /^[a-z][a-z\d+\-.]*:/i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

function getCustomProgramDescription(site, installCommand) {
  if (site && installCommand) {
    return `User-added app with a website and a ${getPlatformLabel(hostPlatform)} install command.`;
  }

  if (installCommand) {
    return `User-added app with a custom ${getPlatformLabel(hostPlatform)} install command.`;
  }

  return 'User-added app linked to its official website.';
}

function buildHostPlatformCommandData(command) {
  const trimmedCommand = command.trim();

  if (!trimmedCommand) {
    return {
      installCommand: null,
      installCommands: {},
      supportedPlatforms: [],
    };
  }

  if (hostPlatform === 'windows') {
    return {
      installCommand: trimmedCommand,
      installCommands: {},
      supportedPlatforms: ['windows'],
    };
  }

  return {
    installCommand: null,
    installCommands: { [hostPlatform]: trimmedCommand },
    supportedPlatforms: [hostPlatform],
  };
}

function createCustomSetupItem({ name, site, installCommand, iconDataUrl }) {
  const commandData = buildHostPlatformCommandData(installCommand);

  return {
    id: crypto.randomUUID(),
    type: 'custom',
    name: name.trim(),
    category: 'custom',
    site,
    subtitle: 'Custom setup item',
    description: getCustomProgramDescription(site, installCommand),
    tags: ['custom', ...(site ? ['website'] : []), ...(installCommand ? ['manual'] : [])],
    iconDataUrl: iconDataUrl || null,
    ...commandData,
  };
}

function resolveSetupListProgram(item) {
  const catalogProgram = (item.programId && programs.find((entry) => entry.id === item.programId))
    ?? programs.find((entry) => entry.name === item.name);

  if (catalogProgram) {
    return catalogProgram;
  }

  return {
    name: item.name,
    category: item.category || 'custom',
    site: item.site || '',
    subtitle: item.subtitle || 'Custom setup item',
    description: item.description || getCustomProgramDescription(item.site, item.installCommand || ''),
    installCommand: item.installCommand ?? null,
    installCommands: item.installCommands ?? {},
    supportedPlatforms: item.supportedPlatforms ?? [],
    tags: item.tags ?? ['custom'],
    iconDataUrl: item.iconDataUrl || null,
  };
}

function updateCustomAppIconPreview() {
  customAppIconPreviewFallback.textContent = getProgramMonogram({
    name: customAppNameInput.value.trim() || 'Custom App',
  });
  customAppIconPreview.classList.toggle('has-image', Boolean(customAppIconDataUrl));
  clearCustomAppIconButton.classList.toggle('hidden', !customAppIconDataUrl);

  if (!customAppIconDataUrl) {
    customAppIconPreviewImage.removeAttribute('src');
    return;
  }

  customAppIconPreviewImage.src = customAppIconDataUrl;
}

function resetCustomAppForm() {
  customAppForm.reset();
  customAppIconDataUrl = null;
  updateCustomAppIconPreview();
}

function openCustomAppDialog() {
  setPanel(null);
  setPage('setupList');
  customAppBackdrop.classList.remove('hidden');
  customAppNameInput.focus();
}

function closeCustomAppDialog() {
  customAppBackdrop.classList.add('hidden');
  resetCustomAppForm();
}

function requestCustomAppDialogClose(event) {
  event.preventDefault();
  event.stopPropagation();
  closeCustomAppDialog();
}

function renderSetupListEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'dropdown-empty setup-list-empty-state';

  const message = document.createElement('p');
  message.textContent = 'No programs yet. Click + on any card or save a custom app for this machine.';

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'btn btn-ghost';
  action.textContent = 'Add custom app';
  action.addEventListener('click', openCustomAppDialog);

  empty.append(message, action);
  return empty;
}

function refreshSetupListButtons() {
  programGrid.querySelectorAll('.add-to-list-button').forEach((btn) => {
    const name = btn.dataset.programName;
    btn.classList.toggle('is-listed', isInSetupList(name));
    btn.setAttribute('aria-label', isInSetupList(name) ? 'Remove from My Setup List' : 'Add to My Setup List');
    btn.setAttribute('title', isInSetupList(name) ? 'Remove from My Setup List' : 'Add to My Setup List');
  });
  const count = state.setupList.length;
  setupListBadge.textContent = count;
  setupListBadge.classList.toggle('hidden', count === 0);
}

function renderSetupList() {
  const count = state.setupList.length;
  setupListBadge.textContent = count;
  setupListBadge.classList.toggle('hidden', count === 0);
  setupListSummary.textContent = `${count} program${count === 1 ? '' : 's'} saved`;

  if (count === 0) {
    setupListItems.replaceChildren(renderSetupListEmptyState());
    applySetupListViewMode();
    return;
  }

  setupListItems.innerHTML = '';
  state.setupList.forEach((item) => {
    const program = resolveSetupListProgram(item);
    setupListItems.appendChild(buildProgramCard(program, {
      showCommand: true,
      showCommandLabel: true,
      commandPlatform: hostPlatform,
      primaryAction: 'install',
    }));
  });

  applySetupListViewMode();
}

function normalize(value) {
  return value.toLowerCase().trim();
}

function normalizeHostPlatform(value) {
  if (value === 'win32') {
    return 'windows';
  }

  if (value === 'darwin') {
    return 'mac';
  }

  return 'linux';
}

function getPlatformLabel(platform) {
  return commandPlatforms.find((item) => item.id === platform)?.label ?? platform;
}

function getProgramCommand(program, platform) {
  if (platform === 'windows') {
    return program.installCommand;
  }

  return program.installCommands?.[platform] ?? null;
}

function getVisiblePlatform() {
  if (state.actionMode === 'command') {
    return state.commandPlatform;
  }

  return hostPlatform;
}

function supportsProgramOnPlatform(program, platform) {
  const hasInstallCommand = Boolean(getProgramCommand(program, platform));

  if (!hasInstallCommand) {
    return false;
  }

  if (Array.isArray(program.supportedPlatforms) && program.supportedPlatforms.length > 0) {
    return program.supportedPlatforms.includes(platform);
  }

  return true;
}

function getCategoryLabel(id) {
  if (id === 'custom') {
    return 'Custom';
  }

  const found = categories.find((c) => c.id === id);
  return found ? found.label : id;
}

function matchesProgram(program) {
  const categoryMatch = state.activeCategory === 'all' || program.category === state.activeCategory;
  if (!categoryMatch) return false;

  if (!supportsProgramOnPlatform(program, getVisiblePlatform())) {
    return false;
  }

  if (!state.searchTerm) return true;

  const haystack = [program.name, program.subtitle, program.description, ...(program.tags ?? [])]
    .join(' ')
    .toLowerCase();
  return haystack.includes(state.searchTerm);
}

function renderFilters() {
  // populate the category <select> dropdown
  categorySelect.replaceChildren();
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All categories';
  categorySelect.appendChild(allOption);
  categories.slice(1).forEach((category) => {
    const opt = document.createElement('option');
    opt.value = category.id;
    opt.textContent = category.label;
    categorySelect.appendChild(opt);
  });
  categorySelect.value = state.activeCategory;
}

function buildCommandPlatformButton(platform) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'toggle-option';
  button.textContent = platform.label;

  if (platform.id === state.commandPlatform) {
    button.classList.add('active');
  }

  button.addEventListener('click', () => {
    if (state.commandPlatform === platform.id) {
      return;
    }

    state.commandPlatform = platform.id;
    renderCommandPlatforms();
    renderPrograms();
    showToast(`Showing ${platform.label} install commands.`);
  });

  return button;
}

function renderCommandPlatforms() {
  commandPlatformFilters.replaceChildren(...commandPlatforms.map(buildCommandPlatformButton));
}

function buildActionModeButton(mode) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'toggle-option';
  button.textContent = mode.label;

  if (mode.id === state.actionMode) {
    button.classList.add('active');
  }

  button.addEventListener('click', () => {
    if (state.actionMode === mode.id) return;
    state.actionMode = mode.id;
    renderActionModes();
    renderPrograms();
    showToast(mode.status);
  });

  return button;
}

function renderActionModes() {
  actionModeFilters.replaceChildren(...actionModes.map(buildActionModeButton));
  commandPlatformFilters.classList.toggle('hidden', state.actionMode !== 'command');
}

function getProgramMonogram(program) {
  return program.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function getProgramIconUrl(program) {
  if (program.iconDataUrl) {
    return Promise.resolve(program.iconDataUrl);
  }

  if (!program.site && !program.localIcon && !program.iconUrl) {
    return Promise.resolve(null);
  }

  return window.setupHubApi.getProgramIcon(program.site, program.localIcon, program.iconUrl, program.iconColor);
}

async function copyInstallCommand(program) {
  const command = getProgramCommand(program, state.commandPlatform);

  if (!command) {
    showToast(`No ${getPlatformLabel(state.commandPlatform)} install command is available for ${program.name}.`);
    addNotification(program.name, `No ${getPlatformLabel(state.commandPlatform)} command is available yet.`);
    return;
  }

  await copyTextToClipboard(command);
  showToast(`Copied ${getPlatformLabel(state.commandPlatform)} install command for ${program.name}.`);
  addNotification(program.name, `${getPlatformLabel(state.commandPlatform)} install command copied to the clipboard.`);
}

async function installProgram(program) {
  const installCommand = getProgramCommand(program, hostPlatform);

  if (!installCommand) {
    throw new Error(`No ${getPlatformLabel(hostPlatform)} install command is available.`);
  }

  const downloadEntry = {
    id: crypto.randomUUID(),
    name: program.name,
    status: `Opening ${getPlatformLabel(hostPlatform)} installer window...`,
    state: 'starting',
    timestamp: Date.now(),
  };

  state.downloads.unshift(downloadEntry);
  state.downloads = state.downloads.slice(0, 8);
  renderDownloads();

  const result = await window.setupHubApi.installProgram(installCommand);

  if (!result?.ok) {
    state.downloads = state.downloads.map((entry) => {
      if (entry.id !== downloadEntry.id) {
        return entry;
      }

      return {
        ...entry,
        status: `Could not start the ${getPlatformLabel(hostPlatform)} installer window.`,
        state: 'failed',
        timestamp: Date.now(),
      };
    });
    renderDownloads();
    throw new Error(result?.error || 'Install launcher failed.');
  }

  state.downloads = state.downloads.map((entry) => {
    if (entry.id !== downloadEntry.id) {
      return entry;
    }

    return {
      ...entry,
      status: `Running in ${getPlatformLabel(hostPlatform)} terminal. Continue there to complete the install.`,
      state: 'running',
      timestamp: Date.now(),
    };
  });
  renderDownloads();
  showToast(`Started installation for ${program.name}.`);
}

async function openProgramSite(program) {
  const result = await window.setupHubApi.openExternal(program.site);

  if (!result?.ok) {
    throw new Error(result?.error || 'External website launcher failed.');
  }

  showToast(`Opened ${program.name} website.`);
}

async function openRepositorySite() {
  const result = await window.setupHubApi.openExternal(REPOSITORY_URL);

  if (!result?.ok) {
    throw new Error(result?.error || 'External repository launcher failed.');
  }

  showToast('Opened the SetupHub GitHub repository.');
}

function handlePrimaryAction(program) {
  if (state.actionMode === 'command') {
    copyInstallCommand(program).catch(() => {
      showToast(`Could not copy the ${getPlatformLabel(state.commandPlatform)} command for ${program.name}.`);
    });
    return;
  }

  installProgram(program).catch(() => {
    showToast(`No install command is available for ${program.name} on ${getPlatformLabel(hostPlatform)}.`);
  });
}

function buildProgramCard(program, options = {}) {
  const fragment = cardTemplate.content.cloneNode(true);
  const card = fragment.querySelector('.program-card');
  const icon = fragment.querySelector('.card-icon-img');
  const iconFallback = fragment.querySelector('.card-icon-fallback');
  const iconWrap = fragment.querySelector('.card-icon');
  const tag = fragment.querySelector('.card-tag');
  const primaryButton = fragment.querySelector('.install-button');
  const openButton = fragment.querySelector('.open-button');
  const commandBlock = fragment.querySelector('.card-command');
  const commandLabel = fragment.querySelector('.card-command-label');
  const commandCode = fragment.querySelector('.card-command-code');
  const actionMode = options.primaryAction || state.actionMode;
  const commandPlatform = options.commandPlatform || state.commandPlatform;
  const showCommand = options.showCommand || actionMode === 'command';
  const showCommandLabel = Boolean(options.showCommandLabel);
  const selectedCommand = getProgramCommand(program, commandPlatform);
  const installCommand = getProgramCommand(program, hostPlatform);

  icon.alt = `${program.name} logo`;
  iconFallback.textContent = getProgramMonogram(program);
  getProgramIconUrl(program).then((iconUrl) => {
    if (!iconUrl) {
      iconWrap.classList.remove('has-image');
      return;
    }
    icon.src = iconUrl;
    iconWrap.classList.add('has-image');
  });

  tag.textContent = getCategoryLabel(program.category);

  fragment.querySelector('.card-title').textContent = program.name;
  fragment.querySelector('.card-subtitle').textContent = program.subtitle;
  fragment.querySelector('.card-description').textContent = program.description;

  if (showCommand) {
    commandBlock.classList.remove('hidden');
    commandLabel.classList.toggle('hidden', !showCommandLabel);
    commandCode.textContent = selectedCommand || `No install command available for ${getPlatformLabel(commandPlatform)}.`;

    const copyBtn = fragment.querySelector('.card-command-copy');
    if (copyBtn && selectedCommand) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyTextToClipboard(selectedCommand)
          .then(() => {
            showToast(`Copied ${getPlatformLabel(commandPlatform)} command for ${program.name}.`);
          })
          .catch(() => {
            showToast(`Could not copy the ${getPlatformLabel(commandPlatform)} command for ${program.name}.`);
          });
      });
    } else if (copyBtn) {
      copyBtn.classList.add('hidden');
    }
  }

  if (actionMode === 'install') {
    primaryButton.textContent = installCommand ? 'Install' : 'Unavailable';
    primaryButton.disabled = !installCommand;
  } else {
    primaryButton.textContent = selectedCommand ? 'Copy command' : 'No command';
    primaryButton.disabled = !selectedCommand;
  }

  primaryButton.addEventListener('click', () => handlePrimaryAction(program));
  if (program.site) {
    openButton.addEventListener('click', () => {
      openProgramSite(program).catch(() => {
        showToast(`Could not open the website for ${program.name}.`);
      });
    });
  } else {
    openButton.disabled = true;
    openButton.setAttribute('aria-label', 'No website available');
    openButton.setAttribute('title', 'No website available');
  }

  const addToListBtn = fragment.querySelector('.add-to-list-button');
  addToListBtn.dataset.programName = program.name;
  const inList = isInSetupList(program.name);
  addToListBtn.classList.toggle('is-listed', inList);
  addToListBtn.setAttribute('aria-label', inList ? 'Remove from My Setup List' : 'Add to My Setup List');
  addToListBtn.setAttribute('title', inList ? 'Remove from My Setup List' : 'Add to My Setup List');
  addToListBtn.addEventListener('click', () => {
    if (isInSetupList(program.name)) {
      removeFromSetupList(program.name);
      showToast(`Removed "${program.name}" from your Setup List.`);
    } else {
      addToSetupList(program);
      showToast(`Added "${program.name}" to your Setup List.`);
    }
  });

  card.style.animationDelay = `${Math.min(60, programGrid.children.length * 8)}ms`;

  return fragment;
}

function renderEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.innerHTML = `
    <div class="empty-state-icon">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/>
        <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </div>
    <h3>No programs found</h3>
    <p>Try another search term, or save it as a custom app so the setup can continue.</p>
  `;

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'btn btn-ghost empty-state-action';
  action.textContent = 'Add custom app';
  action.addEventListener('click', openCustomAppDialog);
  empty.appendChild(action);

  return empty;
}

function renderPrograms() {
  const filtered = programs.filter(matchesProgram);
  resultsLabel.textContent = `${filtered.length} program${filtered.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    programGrid.replaceChildren(renderEmptyState());
    return;
  }

  programGrid.replaceChildren(...filtered.map(buildProgramCard));
}

// ── UPDATER ────────────────────────────────────────────────────────────────

const updateState = {
  status: 'idle',
  release: null,
  progress: { received: 0, total: 0, percent: 0 },
  error: null,
  dismissed: false,
  isCheckingManually: false,
};

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function setUpdateToastVisible(visible) {
  updateToast.classList.toggle('hidden', !visible);
}

function renderUpdateToast() {
  if (updateState.status === 'idle' || updateState.dismissed) {
    setUpdateToastVisible(false);
    return;
  }

  setUpdateToastVisible(true);

  const showProgress = updateState.status === 'downloading';
  updateToastProgress.classList.toggle('hidden', !showProgress);

  if (showProgress) {
    const { received, total, percent } = updateState.progress;
    updateToastProgressBar.style.width = `${percent}%`;
    updateToastProgressText.textContent = total
      ? `${percent}%`
      : formatBytes(received);
  }

  let title = 'Update available';
  let message = '';
  let primaryLabel = 'Update';
  let secondaryLabel = 'Later';
  let primaryEnabled = true;
  let actionsVisible = true;

  const version = updateState.release?.version;
  const size = updateState.release?.asset?.size;

  switch (updateState.status) {
    case 'available':
      title = `SetupHub ${version} is available`;
      message = size
        ? `You're on ${updateState.currentVersion}. Download size: ${formatBytes(size)}.`
        : `You're on ${updateState.currentVersion}.`;
      primaryLabel = 'Update';
      secondaryLabel = 'Later';
      break;
    case 'downloading': {
      const { received, total } = updateState.progress;
      title = `Downloading ${version}`;
      message = total
        ? `${formatBytes(received)} of ${formatBytes(total)}`
        : `${formatBytes(received)} downloaded`;
      primaryLabel = 'Downloading...';
      secondaryLabel = 'Hide';
      primaryEnabled = false;
      break;
    }
    case 'downloaded':
      title = `${version} ready to install`;
      message = 'SetupHub will replace itself and restart.';
      primaryLabel = 'Restart now';
      secondaryLabel = 'Later';
      break;
    case 'error':
      title = 'Update failed';
      message = updateState.error || 'Something went wrong with the update.';
      primaryLabel = 'Retry';
      secondaryLabel = 'Dismiss';
      break;
    default:
      actionsVisible = false;
      break;
  }

  updateToastTitle.textContent = title;
  updateToastMessage.textContent = message;
  updateToastActions.classList.toggle('hidden', !actionsVisible);
  updateToastPrimary.textContent = primaryLabel;
  updateToastSecondary.textContent = secondaryLabel;
  updateToastPrimary.disabled = !primaryEnabled;
}

function dismissUpdateToast() {
  updateState.dismissed = true;
  renderUpdateToast();
}

function reopenUpdateToastIfRelevant() {
  if (updateState.status !== 'idle' && updateState.status !== 'downloading') {
    updateState.dismissed = false;
    renderUpdateToast();
  }
}

async function handleUpdatePrimaryAction() {
  if (updateState.status === 'available' || updateState.status === 'error') {
    if (updateState.status === 'error' && !updateState.release) {
      updateState.status = 'idle';
      renderUpdateToast();
      await checkForUpdatesManually();
      return;
    }

    updateState.status = 'downloading';
    updateState.progress = { received: 0, total: updateState.release?.asset?.size ?? 0, percent: 0 };
    updateState.error = null;
    renderUpdateToast();

    const result = await window.setupHubApi.downloadUpdate();
    if (!result?.ok) {
      updateState.status = 'error';
      updateState.error = result?.error || 'Download failed.';
      renderUpdateToast();
    }
    return;
  }

  if (updateState.status === 'downloaded') {
    updateToastPrimary.disabled = true;
    const result = await window.setupHubApi.installUpdate();
    if (!result?.ok) {
      updateState.status = 'error';
      updateState.error = result?.error || 'Could not start the installer.';
      renderUpdateToast();
    }
  }
}

function handleUpdateSecondaryAction() {
  dismissUpdateToast();
}

async function checkForUpdatesManually() {
  if (updateState.isCheckingManually) return;
  updateState.isCheckingManually = true;
  showToast('Checking for updates...');

  try {
    const result = await window.setupHubApi.checkForUpdates({ manual: true });
    if (!result?.ok) {
      showToast(result?.error || 'Could not check for updates.');
      return;
    }
    if (!result.available) {
      showToast(`You're on the latest version (${result.currentVersion || ''}).`.trim());
    } else {
      updateState.dismissed = false;
      renderUpdateToast();
    }
  } catch (error) {
    showToast('Could not check for updates.');
  } finally {
    updateState.isCheckingManually = false;
  }
}

window.setupHubApi.onUpdaterAvailable((release) => {
  const sameVersion = updateState.release?.version === release.version;
  if (sameVersion && (updateState.status === 'downloading' || updateState.status === 'downloaded')) {
    updateState.release = release;
    return;
  }
  updateState.status = 'available';
  updateState.release = release;
  updateState.dismissed = false;
  renderUpdateToast();
});

window.setupHubApi.onUpdaterNotAvailable(() => {
  if (updateState.status === 'available' || updateState.status === 'error') {
    updateState.status = 'idle';
    renderUpdateToast();
  }
});

window.setupHubApi.onUpdaterProgress((payload) => {
  updateState.status = 'downloading';
  updateState.progress = payload;
  renderUpdateToast();
});

window.setupHubApi.onUpdaterDownloaded(() => {
  updateState.status = 'downloaded';
  updateState.dismissed = false;
  renderUpdateToast();
});

window.setupHubApi.onUpdaterError((payload) => {
  updateState.status = 'error';
  updateState.error = payload?.message || 'Update failed.';
  updateState.dismissed = false;
  renderUpdateToast();
});

updateToastPrimary.addEventListener('click', () => {
  handleUpdatePrimaryAction().catch(() => {});
});

updateToastSecondary.addEventListener('click', () => {
  handleUpdateSecondaryAction();
});

updateToastClose.addEventListener('click', () => {
  dismissUpdateToast();
});

window.setupHubApi.getCurrentVersion()
  .then((version) => { updateState.currentVersion = version; })
  .catch(() => {});

searchInput.addEventListener('input', (event) => {
  state.searchTerm = normalize(event.target.value);
  renderPrograms();
});

categorySelect.addEventListener('change', (event) => {
  state.activeCategory = event.target.value;
  renderPrograms();
});

notificationsButton.addEventListener('click', () => {
  setPanel('notifications');
});

downloadsButton.addEventListener('click', () => {
  setPanel('downloads');
});

setupListButton.addEventListener('click', () => {
  setPage('setupList');
});

homeButton.addEventListener('click', () => {
  setPage('catalog');
});

setupListBackButton.addEventListener('click', () => {
  setPage('catalog');
});

addCustomAppButton.addEventListener('click', () => {
  openCustomAppDialog();
});

clearNotificationsButton.addEventListener('click', () => {
  clearPanel('notifications');
  showToast('Notifications cleared.');
});

clearDownloadsButton.addEventListener('click', () => {
  clearPanel('downloads');
  showToast('Download activity cleared.');
});

clearSetupListButton.addEventListener('click', () => {
  state.setupList = [];
  saveSetupList();
  renderSetupList();
  refreshSetupListButtons();
  showToast('Setup List cleared.');
});

customAppCloseButton.addEventListener('pointerdown', requestCustomAppDialogClose);
customAppCloseButton.addEventListener('click', requestCustomAppDialogClose);

customAppCancelButton.addEventListener('click', requestCustomAppDialogClose);

customAppBackdrop.addEventListener('click', (event) => {
  if (event.target === customAppBackdrop) {
    closeCustomAppDialog();
  }
});

customAppNameInput.addEventListener('input', () => {
  updateCustomAppIconPreview();
});

clearCustomAppIconButton.addEventListener('click', () => {
  customAppIconDataUrl = null;
  customAppIconInput.value = '';
  updateCustomAppIconPreview();
});

customAppIconInput.addEventListener('change', () => {
  const [file] = customAppIconInput.files || [];

  if (!file) {
    return;
  }

  if (file.size > 1024 * 1024) {
    showToast('Choose an icon image smaller than 1 MB.');
    customAppIconInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    if (typeof reader.result !== 'string') {
      showToast('Could not read that image file.');
      return;
    }

    customAppIconDataUrl = reader.result;
    updateCustomAppIconPreview();
  });
  reader.addEventListener('error', () => {
    showToast('Could not read that image file.');
  });
  reader.readAsDataURL(file);
});

customAppForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = customAppNameInput.value.trim();
  const rawSite = customAppUrlInput.value.trim();
  const site = normalizeWebsiteUrl(rawSite);
  const installCommand = customAppCommandInput.value.trim();

  if (!name) {
    showToast('Enter an app name first.');
    customAppNameInput.focus();
    return;
  }

  if (rawSite && !site) {
    showToast('Enter a valid website URL.');
    customAppUrlInput.focus();
    return;
  }

  if (!site && !installCommand) {
    showToast('Add a website or an install command.');
    customAppUrlInput.focus();
    return;
  }

  if (isInSetupList(name)) {
    showToast(`"${name}" is already in your Setup List.`);
    customAppNameInput.focus();
    return;
  }

  state.setupList.push(createCustomSetupItem({
    name,
    site: site || '',
    installCommand,
    iconDataUrl: customAppIconDataUrl,
  }));
  saveSetupList();
  renderSetupList();
  refreshSetupListButtons();
  closeCustomAppDialog();
  showToast(`Added "${name}" to your Setup List.`);
  addNotification(name, 'Custom app added to your Setup List.');
});

copySetupListButton.addEventListener('click', async () => {
  if (state.setupList.length === 0) {
    showToast('Your Setup List is empty.');
    return;
  }
  const commands = state.setupList
    .map((item) => getProgramCommand(resolveSetupListProgram(item), hostPlatform))
    .filter(Boolean);
  if (commands.length === 0) {
    showToast('No install commands available for your list.');
    return;
  }

  try {
    await copyTextToClipboard(commands.join('\n'));
    showToast(`Copied ${commands.length} install command${commands.length === 1 ? '' : 's'}.`);
  } catch {
    showToast('Could not copy your Setup List commands.');
  }
});

setupListViewListButton.addEventListener('click', () => setSetupListViewMode('list'));
setupListViewGridButton.addEventListener('click', () => setSetupListViewMode('grid'));

settingsButton.addEventListener('click', () => {
  if (updateState.dismissed) {
    reopenUpdateToastIfRelevant();
  }
  checkForUpdatesManually();
});

githubRepoButton.addEventListener('click', () => {
  openRepositorySite().catch(() => {
    showToast('Could not open the SetupHub GitHub repository.');
  });
});

minimizeWindowButton.addEventListener('click', () => {
  window.setupHubApi.windowAction('minimize');
});

toggleMaximizeWindowButton.addEventListener('click', () => {
  window.setupHubApi.windowAction('toggle-maximize');
});

closeWindowButton.addEventListener('click', () => {
  window.setupHubApi.windowAction('close');
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.panel-anchor')) {
    setPanel(null);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !customAppBackdrop.classList.contains('hidden')) {
    closeCustomAppDialog();
    return;
  }

  if (event.key === 'Escape') {
    setPanel(null);
  }
});

window.addEventListener('resize', () => {
  syncSetupListGridCardWidth();
});

function setViewMode(mode) {
  state.viewMode = mode;
  programGrid.classList.toggle('is-grid', mode === 'grid');
  viewListBtn.classList.toggle('active', mode === 'list');
  viewGridBtn.classList.toggle('active', mode === 'grid');
}

viewListBtn.addEventListener('click', () => setViewMode('list'));
viewGridBtn.addEventListener('click', () => setViewMode('grid'));

renderNotifications();
renderDownloads();
renderSetupList();
renderActionModes();
renderCommandPlatforms();
renderFilters();
setPage(state.activePage);
setViewMode(state.viewMode);
applySetupListViewMode();
customAppCommandHelp.textContent = `Used for install and copy actions on ${getPlatformLabel(hostPlatform)}.`;
updateCustomAppIconPreview();
renderPrograms();
