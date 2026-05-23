/**
 * Storage Manager - IndexedDB operations  
 */
const StorageManager = {
  dbName: 'NovelReaderDB',
  dbVersion: 1,
  db: null,

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { this.db = request.result; resolve(this.db); };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('series')) {
          const seriesStore = db.createObjectStore('series', { keyPath: 'id' });
          seriesStore.createIndex('url', 'url', { unique: false });
        }
        if (!db.objectStoreNames.contains('chapters')) {
          const chapterStore = db.createObjectStore('chapters', { keyPath: 'id' });
          chapterStore.createIndex('seriesId', 'seriesId', { unique: false });
          chapterStore.createIndex('url', 'url', { unique: true });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('crawlQueue')) {
          const queueStore = db.createObjectStore('crawlQueue', { keyPath: 'id' });
          queueStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  },

  async saveChapter(chapter) {
    if (!this.db) await this.init();
    const transaction = this.db.transaction(['chapters'], 'readwrite');
    const store = transaction.objectStore('chapters');
    const chapterData = {
      id: `${chapter.seriesId}-${Date.now()}`,
      seriesId: chapter.seriesId,
      title: chapter.title,
      url: chapter.url,
      content: chapter.content,
      html: chapter.html,
      addedDate: new Date().toISOString(),
      wordCount: chapter.content.split(/\s+/).length
    };
    return new Promise((resolve, reject) => {
      const request = store.add(chapterData);
      request.onsuccess = () => resolve(chapterData.id);
      request.onerror = () => reject(request.error);
    });
  },

  async getChapters(seriesId) {
    if (!this.db) await this.init();
    const transaction = this.db.transaction(['chapters'], 'readonly');
    const store = transaction.objectStore('chapters');
    const index = store.index('seriesId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(seriesId);
      request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(a.addedDate) - new Date(b.addedDate)));
      request.onerror = () => reject(request.error);
    });
  },

  async saveSeries(series) {
    if (!this.db) await this.init();
    const transaction = this.db.transaction(['series'], 'readwrite');
    const store = transaction.objectStore('series');
    const seriesData = {
      id: series.id || `series-${Date.now()}`,
      title: series.title,
      url: series.url,
      author: series.author || 'Unknown',
      cover: series.cover || null,
      description: series.description || '',
      addedDate: series.addedDate || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    return new Promise((resolve, reject) => {
      const request = series.id ? store.put(seriesData) : store.add(seriesData);
      request.onsuccess = () => resolve(seriesData.id);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllSeries() {
    if (!this.db) await this.init();
    const transaction = this.db.transaction(['series'], 'readonly');
    const store = transaction.objectStore('series');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)));
      request.onerror = () => reject(request.error);
    });
  },

  async saveSetting(key, value) {
    if (!this.db) await this.init();
    const transaction = this.db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getSetting(key, defaultValue = null) {
    if (!this.db) await this.init();
    const transaction = this.db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ? request.result.value : defaultValue);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllSettings() {
    if (!this.db) await this.init();
    const transaction = this.db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const settings = {};
        request.result.forEach(item => settings[item.key] = item.value);
        resolve(settings);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async addToCrawlQueue(item) {
    if (!this.db) await this.init();
    const transaction = this.db.transaction(['crawlQueue'], 'readwrite');
    const store = transaction.objectStore('crawlQueue');
    const queueItem = {
      id: `${item.seriesId}-${item.url}-${Date.now()}`,
      seriesId: item.seriesId,
      url: item.url,
      title: item.title || 'Untitled',
      status: 'pending',
      addedDate: new Date().toISOString()
    };
    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => resolve(queueItem.id);
      request.onerror = () => reject(request.error);
    });
  },

  async getPendingQueue() {
    if (!this.db) await this.init();
    const transaction = this.db.transaction(['crawlQueue'], 'readonly');
    const store = transaction.objectStore('crawlQueue');
    const index = store.index('status');
    return new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async updateQueueStatus(id, status) {
    if (!this.db) await this.init();
    const transaction = this.db.transaction(['crawlQueue'], 'readwrite');
    const store = transaction.objectStore('crawlQueue');
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        item.status = status;
        const updateRequest = store.put(item);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      };
    });
  },

  async getStats() {
    if (!this.db) await this.init();
    const stats = { totalSeries: 0, totalChapters: 0, totalWords: 0, storageSize: 0 };
    const seriesTx = this.db.transaction(['series'], 'readonly');
    const seriesStore = seriesTx.objectStore('series');
    stats.totalSeries = await new Promise((resolve, reject) => {
      const req = seriesStore.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const chaptersTx = this.db.transaction(['chapters'], 'readonly');
    const chaptersStore = chaptersTx.objectStore('chapters');
    const chapters = await new Promise((resolve, reject) => {
      const req = chaptersStore.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    stats.totalChapters = chapters.length;
    stats.totalWords = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
    return stats;
  }
};
