/**
 * EPUB Builder - Creates EPUB structure from chapters
 */
const EPUBBuilder = {
  buildEPUB(series, chapters) {
    return {
      mimeType: 'application/epub+zip',
      files: {
        'META-INF/container.xml': this.generateContainerXml(),
        'OEBPS/content.opf': this.generateContentOPF(series, chapters),
        'OEBPS/toc.ncx': this.generateTocNCX(series, chapters),
        ...this.generateChaptersXHTML(chapters)
      },
      metadata: {
        title: series.title,
        author: series.author || 'Unknown',
        date: new Date().toISOString()
      }
    };
  },

  generateContainerXml() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  },

  generateContentOPF(series, chapters) {
    const uuid = this.generateUUID();
    const timestamp = new Date().toISOString();
    let manifest = '';
    let spine = '';
    chapters.forEach((ch, idx) => {
      const id = `chapter${idx + 1}`;
      manifest += `    <item id="${id}" href="chapter${idx + 1}.xhtml" media-type="application/xhtml+xml"/>\n`;
      spine += `    <itemref idref="${id}"/>\n`;
    });
    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uuid_id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uuid_id">urn:uuid:${uuid}</dc:identifier>
    <dc:title>${this.escapeXml(series.title)}</dc:title>
    <dc:creator>${this.escapeXml(series.author || 'Unknown')}</dc:creator>
    <dc:date>${timestamp}</dc:date>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
${manifest}  </manifest>
  <spine toc="ncx">
${spine}  </spine>
</package>`;
  },

  generateTocNCX(series, chapters) {
    const uuid = this.generateUUID();
    let navPoints = '';
    chapters.forEach((ch, idx) => {
      const id = `chapter${idx + 1}`;
      navPoints += `    <navPoint id="${id}" playOrder="${idx + 1}"><navLabel><text>${this.escapeXml(ch.title)}</text></navLabel><content src="chapter${idx + 1}.xhtml"/></navPoint>\n`;
    });
    return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="urn:uuid:${uuid}"/></head><docTitle><text>${this.escapeXml(series.title)}</text></docTitle><navMap>${navPoints}</navMap></ncx>`;
  },

  generateChaptersXHTML(chapters) {
    const files = {};
    chapters.forEach((ch, idx) => {
      files[`OEBPS/chapter${idx + 1}.xhtml`] = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${this.escapeXml(ch.title)}</title></head><body><h1>${this.escapeXml(ch.title)}</h1><div>${this.sanitizeHTML(ch.html || ch.content)}</div></body></html>`;
    });
    return files;
  },

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  },

  escapeXml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  },

  sanitizeHTML(html) {
    if (!html) return '<p>No content</p>';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    temp.querySelectorAll('script, style, iframe, object, embed').forEach(el => el.remove());
    return temp.innerHTML;
  }
};
