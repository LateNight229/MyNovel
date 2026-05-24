const Library = {
    novels: [],

    init: function() {
        this.load();
        this.render();
    },

    add: function(novel) {
        this.novels.push({
            id: Date.now().toString(),
            title: novel.title,
            author: novel.author,
            chapters: novel.chapters
        });
        this.save();
    },

    get: function(novelId) {
        return this.novels.find(n => n.id === novelId);
    },

    load: function() {
        const data = localStorage.getItem('library');
        this.novels = data ? JSON.parse(data) : [];
    },

    save: function() {
        localStorage.setItem('library', JSON.stringify(this.novels));
    },

    render: function() {
        const list = document.getElementById('novelList');
        list.innerHTML = '';

        this.novels.forEach(novel => {
            const item = document.createElement('div');
            item.className = 'novel-item';
            item.innerHTML = `
                <h3>${novel.title}</h3>
                <p>${novel.author}</p>
            `;
            item.addEventListener('click', () => {
                Reader.loadNovel(novel.id, novel.chapters);
                document.getElementById('novelTitle').textContent = novel.title;
            });
            list.appendChild(item);
        });
    }
};

window.addEventListener('DOMContentLoaded', () => {
    Library.init();
});
