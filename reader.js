const ReadingProgress = {
    save: function(novelId, chapterIndex, scrollTop, progressPercent) {
        const progress = {
            novelId,
            chapterIndex,
            scrollTop,
            progressPercent,
            timestamp: Date.now()
        };
        localStorage.setItem(`progress_${novelId}`, JSON.stringify(progress));
    },

    load: function(novelId) {
        const data = localStorage.getItem(`progress_${novelId}`);
        return data ? JSON.parse(data) : null;
    },

    delete: function(novelId) {
        localStorage.removeItem(`progress_${novelId}`);
    }
};

const Reader = {
    currentNovelId: null,
    currentChapterIndex: 0,
    chapters: [],
    autoSaveInterval: null,

    init: function() {
        document.getElementById('nextBtn').addEventListener('click', () => this.nextChapter());
        document.getElementById('prevBtn').addEventListener('click', () => this.prevChapter());
        document.getElementById('toggleReaderMode').addEventListener('click', () => this.toggleReaderMode());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.nextChapter();
            if (e.key === 'ArrowLeft') this.prevChapter();
        });

        window.addEventListener('scroll', () => this.autoSave());
        window.addEventListener('beforeunload', () => this.autoSave());
    },

    loadNovel: function(novelId, chaptersArray) {
        this.currentNovelId = novelId;
        this.chapters = chaptersArray;
        
        const progress = ReadingProgress.load(novelId);
        this.currentChapterIndex = progress ? progress.chapterIndex : 0;

        this.displayChapter(this.currentChapterIndex);
        
        if (progress) {
            setTimeout(() => {
                window.scrollTo(0, progress.scrollTop);
            }, 100);
        }
    },

    displayChapter: function(index) {
        if (index < 0 || index >= this.chapters.length) return;

        this.currentChapterIndex = index;
        const chapter = this.chapters[index];

        document.getElementById('chapterTitle').textContent = chapter.title;
        document.getElementById('content').innerHTML = chapter.content;
        document.getElementById('chapterInfo').textContent = `${index + 1} / ${this.chapters.length}`;
        
        window.scrollTo(0, 0);
        this.autoSave();
    },

    nextChapter: function() {
        if (this.currentChapterIndex < this.chapters.length - 1) {
            this.displayChapter(this.currentChapterIndex + 1);
        }
    },

    prevChapter: function() {
        if (this.currentChapterIndex > 0) {
            this.displayChapter(this.currentChapterIndex - 1);
        }
    },

    autoSave: function() {
        if (!this.currentNovelId) return;

        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progressPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

        ReadingProgress.save(
            this.currentNovelId,
            this.currentChapterIndex,
            scrollTop,
            progressPercent
        );
    },

    toggleReaderMode: function() {
        document.body.classList.toggle('reader-mode');
        localStorage.setItem('readerMode', document.body.classList.contains('reader-mode'));
    }
};

window.addEventListener('DOMContentLoaded', () => {
    Reader.init();
    if (localStorage.getItem('readerMode') === 'true') {
        document.body.classList.add('reader-mode');
    }
});
