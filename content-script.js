/**
 * Content Script - Transforms novel pages into distraction-free reader mode
 */

let isReaderModeActive = false;
let originalDOM = null;

/**
 * Initialize reader mode on page load
 */
async function initReaderMode() {
  if (!ContentDetector.isNovelPage()) {
    console.log('Novel Reader Mode: Not a novel page');
    return;
  }

  await StorageManager.init();

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleReaderMode') {
      toggleReaderMode();
      sendResponse({ success: true, active: isReaderModeActive });
    }
    if (request.action === 'updateSettings') {
      applySettings(request.settings);
      sendResponse({ success: true });
    }
    if (request.action === 'saveChapter') {
      saveCurrentChapter(request.seriesId);
      sendResponse({ success: true });
    }
  });

  // Auto-activate on novel pages (optional)
  const autoEnable = await StorageManager.getSetting('autoEnableReaderMode', false);
  if (autoEnable) {
    toggleReaderMode();
  }
}

/**
 * Toggle reader mode on/off
 */
function toggleReaderMode() {
  if (isReaderModeActive) {
    disableReaderMode();
  } else {
    enableReaderMode();
  }
}

/**
 * Enable distraction-free reader mode
 */
function enableReaderMode() {
  // Save original DOM state
  originalDOM = document.documentElement.innerHTML;

  // Find main content
  const mainContent = ContentDetector.detectMainContent();
  if (!mainContent) {
    alert('Novel Reader Mode: Could not detect content');
    return;
  }

  // Clean up and remove ads
  ContentDetector.removeAds(mainContent);
  ContentDetector.cleanupContent(mainContent);

  // Create reader container
  const readerContainer = document.createElement('div');
  readerContainer.id = 'nr-reader-container';
  readerContainer.className = 'nr-reader-mode';

  // Extract chapter metadata
  const metadata = ContentDetector.extractChapterMetadata();

  // Create reader UI
  const readerUI = document.createElement('div');
  readerUI.className = 'nr-reader-ui';
  readerUI.innerHTML = `
    <div class="nr-controls">
      <div class="nr-title">${metadata.title}</div>
      <div class="nr-buttons">
        <button id="nr-settings-btn" class="nr-btn">⚙️ Settings</button>
        <button id="nr-save-btn" class="nr-btn">💾 Save</button>
        <button id="nr-close-btn" class="nr-btn">✕ Exit</button>
      </div>
    </div>
    <div id="nr-content" class="nr-content"></div>
  `;

  readerContainer.appendChild(readerUI);
  document.body.innerHTML = '';
  document.body.appendChild(readerContainer);

  // Move content to reader
  const contentDiv = document.getElementById('nr-content');
  contentDiv.appendChild(mainContent.cloneNode(true));

  // Apply user settings
  applyDefaultSettings();

  // Attach event listeners
  document.getElementById('nr-close-btn').addEventListener('click', disableReaderMode);
  document.getElementById('nr-settings-btn').addEventListener('click', showSettingsPanel);
  document.getElementById('nr-save-btn').addEventListener('click', () => {
    showSaveDialog();
  });

  isReaderModeActive = true;
  chrome.runtime.sendMessage({ action: 'readerModeActive', active: true });
}

/**
 * Disable reader mode (restore original page)
 */
function disableReaderMode() {
  if (originalDOM) {
    document.documentElement.innerHTML = originalDOM;
  }
  isReaderModeActive = false;
  chrome.runtime.sendMessage({ action: 'readerModeActive', active: false });
}

/**
 * Apply default reader settings
 */
async function applyDefaultSettings() {
  const settings = await StorageManager.getAllSettings();
  applySettings(settings);
}

/**
 * Apply reader settings to content
 */
function applySettings(settings) {
  const container = document.getElementById('nr-reader-container');
  if (!container) return;

  const fontSize = settings.fontSize || '18px';
  const fontFamily = settings.fontFamily || "'Georgia', serif";
  const lineHeight = settings.lineHeight || '1.8';
  const textColor = settings.textColor || '#e5e7eb';
  const backgroundColor = settings.backgroundColor || '#0f172a';
  const maxWidth = settings.maxWidth || '700px';

  const styles = `
    #nr-reader-container {
      background-color: ${backgroundColor};
      color: ${textColor};
      font-family: ${fontFamily};
      font-size: ${fontSize};
      line-height: ${lineHeight};
    }

    #nr-content {
      max-width: ${maxWidth};
      margin: 0 auto;
      padding: 40px 20px;
    }

    #nr-content p {
      margin-bottom: 1.5em;
    }

    #nr-content h1,
    #nr-content h2,
    #nr-content h3 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
  `;

  let styleTag = document.getElementById('nr-settings-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'nr-settings-style';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = styles;
}

/**
 * Show settings panel
 */
function showSettingsPanel() {
  const panel = document.createElement('div');
  panel.className = 'nr-modal';
  panel.innerHTML = `
    <div class="nr-modal-content">
      <h2>Reader Settings</h2>
      <div class="nr-setting">
        <label>Font Size (px)</label>
        <input type="range" id="nr-font-size" min="12" max="32" value="18">
        <span id="nr-font-size-display">18px</span>
      </div>
      <div class="nr-setting">
        <label>Font Family</label>
        <select id="nr-font-family">
          <option value="'Georgia', serif">Georgia</option>
          <option value="'Merriweather', serif">Merriweather</option>
          <option value="'Droid Serif', serif">Droid Serif</option>
          <option value="'Segoe UI', sans-serif">Segoe UI</option>
        </select>
      </div>
      <div class="nr-setting">
        <label>Line Height</label>
        <input type="range" id="nr-line-height" min="1.2" max="2.0" step="0.1" value="1.8">
        <span id="nr-line-height-display">1.8</span>
      </div>
      <div class="nr-setting">
        <label>Text Color</label>
        <input type="color" id="nr-text-color" value="#e5e7eb">
      </div>
      <div class="nr-setting">
        <label>Background Color</label>
        <input type="color" id="nr-bg-color" value="#0f172a">
      </div>
      <div class="nr-setting">
        <label>
          <input type="checkbox" id="nr-auto-enable">
          Auto-enable reader mode on novel pages
        </label>
      </div>
      <div class="nr-modal-buttons">
        <button class="nr-btn" id="nr-save-settings">Save</button>
        <button class="nr-btn" id="nr-close-modal">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // Load current settings
  StorageManager.getAllSettings().then(settings => {
    document.getElementById('nr-font-size').value = parseInt(settings.fontSize || '18');
    document.getElementById('nr-font-family').value = settings.fontFamily || "'Georgia', serif";
    document.getElementById('nr-line-height').value = parseFloat(settings.lineHeight || '1.8');
    document.getElementById('nr-text-color').value = settings.textColor || '#e5e7eb';
    document.getElementById('nr-bg-color').value = settings.backgroundColor || '#0f172a';
    document.getElementById('nr-auto-enable').checked = settings.autoEnableReaderMode || false;
  });

  // Update display values
  document.getElementById('nr-font-size').addEventListener('input', (e) => {
    document.getElementById('nr-font-size-display').textContent = e.target.value + 'px';
  });
  document.getElementById('nr-line-height').addEventListener('input', (e) => {
    document.getElementById('nr-line-height-display').textContent = e.target.value;
  });

  // Save settings
  document.getElementById('nr-save-settings').addEventListener('click', async () => {
    const settings = {
      fontSize: document.getElementById('nr-font-size').value + 'px',
      fontFamily: document.getElementById('nr-font-family').value,
      lineHeight: document.getElementById('nr-line-height').value,
      textColor: document.getElementById('nr-text-color').value,
      backgroundColor: document.getElementById('nr-bg-color').value,
      autoEnableReaderMode: document.getElementById('nr-auto-enable').checked
    };

    for (const [key, value] of Object.entries(settings)) {
      await StorageManager.saveSetting(key, value);
    }

    applySettings(settings);
    panel.remove();
  });

  document.getElementById('nr-close-modal').addEventListener('click', () => {
    panel.remove();
  });
}

/**
 * Save current chapter to offline storage
 */
async function saveCurrentChapter() {
  const metadata = ContentDetector.extractChapterMetadata();
  const content = document.getElementById('nr-content');

  if (!content) {
    alert('No content to save');
    return;
  }

  // Create series if needed
  const seriesId = `series-${window.location.hostname}`;
  await StorageManager.saveSeries({
    id: seriesId,
    title: metadata.title,
    url: window.location.href,
    author: 'Unknown'
  });

  // Save chapter
  try {
    const chapterId = await StorageManager.saveChapter({
      seriesId,
      title: metadata.title,
      url: metadata.url,
      content: content.innerText,
      html: content.innerHTML
    });

    alert(`Chapter saved! (ID: ${chapterId})`);
  } catch (error) {
    alert('Error saving chapter: ' + error.message);
  }
}

/**
 * Show save dialog
 */
function showSaveDialog() {
  const dialog = document.createElement('div');
  dialog.className = 'nr-modal';
  dialog.innerHTML = `
    <div class="nr-modal-content">
      <h2>Save Chapter</h2>
      <p>Save this chapter for offline reading?</p>
      <div class="nr-modal-buttons">
        <button class="nr-btn" id="nr-confirm-save">Yes, Save</button>
        <button class="nr-btn" id="nr-cancel-save">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  document.getElementById('nr-confirm-save').addEventListener('click', async () => {
    await saveCurrentChapter();
    dialog.remove();
  });

  document.getElementById('nr-cancel-save').addEventListener('click', () => {
    dialog.remove();
  });
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReaderMode);
} else {
  initReaderMode();
}
