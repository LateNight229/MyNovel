/**
 * Content Detector - Heuristic engine for novel content extraction
 */

const ContentDetector = {
  contentSelectors: {
    main: ['.chapter-content', '.chapter_content', '.content', '.post-content', '.article-content', '.story-content', '[class*="chapter"]', '[class*="content"]', 'article', 'main'],
    title: ['.chapter-title', '.chapter_title', 'h1', '[class*="title"]'],
    ads: ['.advertisement', '.ad', '.ads', '[class*="ad"]', '[id*="ad"]', 'iframe[src*="ad"]', 'ins.adsbygoogle']
  },
  
  detectMainContent() {
    for (const selector of this.contentSelectors.main) {
      const element = document.querySelector(selector);
      if (element && this.isValidContent(element)) return element;
    }
    return this.findLargestTextBlock();
  },

  findLargestTextBlock() {
    let largestBlock = null;
    let maxChars = 0;
    document.querySelectorAll('div, article, section, main').forEach(el => {
      if (this.isValidContent(el)) {
        const textLength = el.innerText.length;
        if (textLength > maxChars) {
          maxChars = textLength;
          largestBlock = el;
        }
      }
    });
    return largestBlock;
  },

  isValidContent(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return element.innerText.length > 500;
  },

  removeAds(container) {
    this.contentSelectors.ads.forEach(selector => {
      try {
        container.querySelectorAll(selector).forEach(el => el.remove());
      } catch (e) {}
    });
    
    const allElements = container.querySelectorAll('*');
    allElements.forEach(el => {
      const className = (el.className || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      if ((className.includes('ad') || id.includes('ad') || className.includes('banner') || id.includes('banner') || className.includes('sponsor')) && el.offsetHeight < 300) {
        el.remove();
      }
    });
  },

  extractChapterMetadata() {
    return {
      title: this.detectChapterTitle(),
      url: window.location.href,
      timestamp: new Date().toISOString(),
      domain: new URL(window.location.href).hostname
    };
  },

  detectChapterTitle() {
    for (const selector of this.contentSelectors.title) {
      const element = document.querySelector(selector);
      if (element && element.innerText.trim().length > 0) return element.innerText.trim();
    }
    return document.title;
  },

  isNovelPage() {
    const text = document.body.innerText.toLowerCase();
    const novelKeywords = ['chapter', 'chương', 'episode', 'part', 'section', 'phần', 'story', 'truyện', 'novel', 'web novel'];
    const keywordCount = novelKeywords.filter(kw => text.includes(kw)).length;
    const mainContent = this.detectMainContent();
    return keywordCount > 0 || (mainContent && mainContent.innerText.length > 2000);
  },

  cleanupContent(element) {
    if (!element) return;
    element.querySelectorAll('script, style, noscript').forEach(el => el.remove());
    element.querySelectorAll('p').forEach(p => {
      if (!p.innerText.trim()) p.remove();
    });
  },

  detectPagination() {
    const chapters = [];
    const chapterPatterns = ['a[href*="chapter"]', 'a[href*="chap"]', 'a[href*="episode"]', 'a[class*="chapter"]'];
    for (const pattern of chapterPatterns) {
      document.querySelectorAll(pattern).forEach(link => {
        const href = link.getAttribute('href');
        const text = link.innerText.trim();
        if (text.length > 0 && href && !chapters.find(c => c.url === href)) {
          chapters.push({ title: text, url: new URL(href, window.location.href).href });
        }
      });
    }
    return chapters;
  }
};
