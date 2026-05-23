/**
 * Background Worker - Handles crawling, background tasks, and messaging
 */

/**
 * Listen for messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startCrawl') {
    crawlChapters(request.seriesId, request.chapterUrls);
    sendResponse({ success: true, message: 'Crawl started' });
  }
  if (request.action === 'getCrawlStatus') {
    getCrawlStatus(request.seriesId).then(status => {
      sendResponse(status);
    });
    return true; // Keep channel open for async response
  }
  if (request.action === 'readerModeActive') {
    // Update badge or status
    console.log('Reader mode active:', request.active);
  }
});

/**
 * Crawl multiple chapters
 */
async function crawlChapters(seriesId, chapterUrls) {
  await StorageManager.init();

  for (let i = 0; i < chapterUrls.length; i++) {
    const url = chapterUrls[i];
    try {
      await addToCrawlQueue(seriesId, url);
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  }

  // Process queue
  processQueue();
}

/**
 * Process crawl queue
 */
async function processQueue() {
  const queue = await StorageManager.getPendingQueue();

  for (const item of queue) {
    try {
      await StorageManager.updateQueueStatus(item.id, 'in_progress');

      // Fetch content
      const response = await fetch(item.url);
      const html = await response.text();

      // Parse content
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract content (inject ContentDetector logic)
      const mainContent = findMainContent(doc);
      const textContent = mainContent ? mainContent.innerText : '';

      // Save chapter
      await StorageManager.saveChapter({
        seriesId: item.seriesId,
        title: item.title,
        url: item.url,
        content: textContent,
        html: mainContent ? mainContent.innerHTML : ''
      });

      await StorageManager.updateQueueStatus(item.id, 'completed');

      // Notify UI
      chrome.runtime.sendMessage({
        action: 'crawlProgress',
        completed: true,
        url: item.url
      }).catch(() => {
        // UI might be closed
      });
    } catch (error) {
      console.error('Error processing queue item:', error);
      await StorageManager.updateQueueStatus(item.id, 'failed');
    }
  }
}

/**
 * Find main content in parsed HTML
 */
function findMainContent(doc) {
  const selectors = [
    '.chapter-content', '.chapter_content',
    '.content', '.post-content',
    '.article-content', '.story-content',
    'article', 'main'
  ];

  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element && element.innerText.length > 500) {
      return element;
    }
  }

  // Fallback: find largest text block
  let largest = null;
  let maxChars = 0;

  doc.querySelectorAll('div, section, article').forEach(el => {
    const text = el.innerText;
    if (text.length > maxChars && text.length > 500) {
      maxChars = text.length;
      largest = el;
    }
  });

  return largest;
}

/**
 * Add item to crawl queue
 */
async function addToCrawlQueue(seriesId, url) {
  await StorageManager.addToCrawlQueue({
    seriesId,
    url,
    title: new URL(url).pathname.split('/').pop()
  });
}

/**
 * Get crawl status for a series
 */
async function getCrawlStatus(seriesId) {
  const queue = await StorageManager.getPendingQueue();
  const seriesQueue = queue.filter(item => item.seriesId === seriesId);

  return {
    pending: seriesQueue.filter(item => item.status === 'pending').length,
    inProgress: seriesQueue.filter(item => item.status === 'in_progress').length,
    completed: seriesQueue.filter(item => item.status === 'completed').length
  };
}

/**
 * Update badge based on unread count
 */
async function updateBadge() {
  try {
    const stats = await StorageManager.getStats();
    if (stats.totalChapters > 0) {
      chrome.action.setBadgeText({ text: stats.totalChapters.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#38bdf8' });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

/**
 * Initialize background worker
 */
async function init() {
  await StorageManager.init();
  updateBadge();

  // Update badge every minute
  setInterval(updateBadge, 60000);

  // Check for queue items on startup
  setTimeout(processQueue, 2000);
}

// Start background worker
init();
