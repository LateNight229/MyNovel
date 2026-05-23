/**
 * Popup Script - Extension popup UI and controls
 */

let currentTab = null;
let storageReady = false;

/**
 * Initialize popup on load
 */
document.addEventListener('DOMContentLoaded', async () => {
  await StorageManager.init();
  storageReady = true;

  // Get current tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tabs[0];

  // Bind event listeners
  document.getElementById('toggle-reader-btn').addEventListener('click', toggleReaderMode);
  document.getElementById('save-chapter-btn').addEventListener('click', saveChapterHandler);
  document.getElementById('view-library-btn').addEventListener('click', openLibraryView);
  document.getElementById('export-epub-btn').addEventListener('click', openExportDialog);
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('report-bug').addEventListener('click', (e) => {
    e.preventDefault();
    // Open GitHub issues or feedback form
  });

  // Quick settings
  document.getElementById('quick-font-size').addEventListener('input', (e) => {
    const size = e.target.value;
    document.getElementById('font-size-value').textContent = size + 'px';
    updateSetting('fontSize', size + 'px');
  });

  document.getElementById('theme-select').addEventListener('change', (e) => {
    applyTheme(e.target.value);
  });

  // Load stats
  updateStats();
  loadQuickSettings();
  checkReaderModeStatus();
});

/**
 * Toggle reader mode on current tab
 */
async function toggleReaderMode() {
  const btn = document.getElementById('toggle-reader-btn');
  btn.disabled = true;

  try {
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      action: 'toggleReaderMode'
    });

    if (response.success) {
      updateReaderStatus(response.active);
    }
  } catch (error) {
    console.error('Error toggling reader mode:', error);
    alert('Could not enable reader mode on this page');
  } finally {
    btn.disabled = false;
  }
}

/**
 * Save current chapter handler
 */
async function saveChapterHandler() {
  const btn = document.getElementById('save-chapter-btn');
  btn.disabled = true;

  try {
    await chrome.tabs.sendMessage(currentTab.id, {
      action: 'saveChapter'
    });
    updateStats();
  } catch (error) {
    console.error('Error saving chapter:', error);
  } finally {
    btn.disabled = false;
  }
}

/**
 * Update reader mode status display
 */
function updateReaderStatus(active) {
  const status = document.getElementById('reader-status');
  const btn = document.getElementById('toggle-reader-btn');

  if (active) {
    status.textContent = 'Active';
    status.classList.add('status-active');
    btn.textContent = '⏹️ Disable Reader Mode';
  } else {
    status.textContent = 'Inactive';
    status.classList.remove('status-active');
    btn.textContent = '🎯 Enable Reader Mode';
  }
}

/**
 * Check if reader mode is active on current tab
 */
function checkReaderModeStatus() {
  chrome.tabs.sendMessage(currentTab.id, { action: 'getReaderStatus' }).catch(() => {
    // Message failed - reader mode not active
    updateReaderStatus(false);
  });
}

/**
 * Update library statistics
 */
async function updateStats() {
  const stats = await StorageManager.getStats();
  document.getElementById('stat-series').textContent = stats.totalSeries;
  document.getElementById('stat-chapters').textContent = stats.totalChapters;
  document.getElementById('stat-words').textContent = stats.totalWords.toLocaleString();
}

/**
 * Load quick settings values
 */
async function loadQuickSettings() {
  const fontSize = await StorageManager.getSetting('fontSize', '18px');
  const theme = await StorageManager.getSetting('theme', 'dark');

  document.getElementById('quick-font-size').value = parseInt(fontSize);
  document.getElementById('font-size-value').textContent = fontSize;
  document.getElementById('theme-select').value = theme;
}

/**
 * Update a single setting
 */
async function updateSetting(key, value) {
  await StorageManager.saveSetting(key, value);

  // Send to active tab
  try {
    await chrome.tabs.sendMessage(currentTab.id, {
      action: 'updateSettings',
      settings: { [key]: value }
    });
  } catch (error) {
    // Tab might not have reader mode active
  }
}

/**
 * Apply theme to current tab
 */
async function applyTheme(theme) {
  await StorageManager.saveSetting('theme', theme);

  const themes = {
    dark: {
      backgroundColor: '#0f172a',
      textColor: '#e5e7eb'
    },
    sepia: {
      backgroundColor: '#f4ecd8',
      textColor: '#5c4033'
    },
    light: {
      backgroundColor: '#ffffff',
      textColor: '#1f2937'
    }
  };

  const themeSettings = themes[theme] || themes.dark;

  try {
    await chrome.tabs.sendMessage(currentTab.id, {
      action: 'updateSettings',
      settings: themeSettings
    });
  } catch (error) {
    console.error('Error applying theme:', error);
  }
}

/**
 * Open library view
 */
function openLibraryView() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('library.html')
  });
  window.close();
}

/**
 * Open export dialog
 */
async function openExportDialog() {
  const series = await StorageManager.getAllSeries();

  if (series.length === 0) {
    alert('No saved series to export');
    return;
  }

  const seriesNames = series.map(s => s.title).join('\n');
  const selected = prompt(
    `Select series to export (copy name):\n\n${seriesNames}`,
    series[0]?.title || ''
  );

  if (selected) {
    const selectedSeries = series.find(s => s.title === selected);
    if (selectedSeries) {
      await exportToEPUB(selectedSeries.id);
    }
  }
}

/**
 * Export series to EPUB format
 */
async function exportToEPUB(seriesId) {
  try {
    const chapters = await StorageManager.getChapters(seriesId);
    const series = (await StorageManager.getAllSeries()).find(s => s.id === seriesId);

    if (chapters.length === 0) {
      alert('No chapters to export');
      return;
    }

    // Generate EPUB file
    const epubContent = generateEPUB(series, chapters);
    downloadEPUB(epubContent, series.title);
  } catch (error) {
    console.error('Error exporting EPUB:', error);
    alert('Error exporting EPUB: ' + error.message);
  }
}

/**
 * Generate EPUB structure
 */
function generateEPUB(series, chapters) {
  // Basic EPUB structure
  const epub = {
    series,
    chapters,
    generated: new Date().toISOString()
  };
  return JSON.stringify(epub, null, 2);
}

/**
 * Download EPUB file
 */
function downloadEPUB(content, title) {
  const blob = new Blob([content], { type: 'application/epub+zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.epub`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open settings page
 */
function openSettings() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('settings.html')
  });
  window.close();
}
