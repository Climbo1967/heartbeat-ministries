const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

module.exports = function(eleventyConfig) {
  // Pass through all existing site files unchanged
  eleventyConfig.addPassthroughCopy("og-image.jpg");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("games.html");
  eleventyConfig.addPassthroughCopy("give.html");
  eleventyConfig.addPassthroughCopy("prayer.html");
  eleventyConfig.addPassthroughCopy("blog.html");
  eleventyConfig.addPassthroughCopy("index.html");
  eleventyConfig.addPassthroughCopy("readme.md");
  eleventyConfig.addPassthroughCopy("manifest.webmanifest");
  eleventyConfig.addPassthroughCopy("sw.js");

  // Generate cms-data.json after build
  eleventyConfig.on('eleventy.after', () => {
    const contentDir = path.resolve(__dirname, 'content');
    const outputDir = path.resolve(__dirname, '_site');

    // Parse YAML frontmatter including arrays (  - item)
    function parseFrontmatter(raw) {
      const lines = raw.split('\n');
      const fm = {};
      let currentKey = null;
      let currentArray = null;

      for (const line of lines) {
        // YAML list item:  - "value" or   - value
        if (/^\s+-\s+/.test(line) && currentKey) {
          let val = line.replace(/^\s+-\s+/, '').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!currentArray) currentArray = [];
          currentArray.push(val);
          fm[currentKey] = currentArray;
          continue;
        }

        // Flush any previous array
        currentArray = null;

        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          let val = line.slice(colonIdx + 1).trim();

          // Empty value after colon means upcoming array
          if (val === '' || val === '[]') {
            currentKey = key;
            fm[key] = [];
            currentArray = fm[key];
            continue;
          }

          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (!isNaN(val) && val !== '') val = Number(val);

          fm[key] = val;
          currentKey = key;
        }
      }
      return fm;
    }

    function readMdFiles(dir) {
      const fullDir = path.join(contentDir, dir);
      if (!fs.existsSync(fullDir)) return [];
      return fs.readdirSync(fullDir)
        .filter(f => f.endsWith('.md'))
        .map(f => {
          const raw = fs.readFileSync(path.join(fullDir, f), 'utf8');
          const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
          if (!match) return null;
          const frontMatter = parseFrontmatter(match[1]);
          return { ...frontMatter, _body: match[2].trim(), _slug: f.replace('.md', '') };
        })
        .filter(Boolean);
    }

    function readJsonFile(filePath) {
      try {
        return JSON.parse(fs.readFileSync(path.join(contentDir, filePath), 'utf8'));
      } catch(e) { return {}; }
    }

    const scriptures = readMdFiles('scripture')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(s => ({
        ref: s.reference || '',
        text: s.text || '',
        translation: s.translation || 'NIV',
        thought: s.devotional || '',
        prayer: s.prayer || '',
        date: s.date || ''
      }));

    const inspirations = readMdFiles('inspiration')
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(s => ({
        title: s.title || '',
        text: s._body || s.body || '',
        tag: s.tag || '',
        order: s.order || 0,
        _slug: s._slug || ''
      }));

    const posts = readMdFiles('blog')
      .filter(p => !p.draft)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(p => ({
        slug: p._slug || '',
        title: p.title || '',
        excerpt: p.excerpt || '',
        category: p.category || '',
        icon: p.icon || '',
        date: p.date || '',
        readTime: p.readTime || '5 min read',
        thumbnail: p.thumbnail || '',
        body: p._body || '',
        bodyHtml: p._body ? marked(p._body) : ''
      }));

    const trivia = readMdFiles('trivia')
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(t => ({
        q: t.q || '',
        opts: Array.isArray(t.opts) ? t.opts : [],
        ans: typeof t.ans === 'number' ? t.ans : 0,
        ref: t.ref || '',
        explain: t.explain || '',
        order: t.order || 0,
        _slug: t._slug || ''
      }));

    const memoryVerses = readMdFiles('memory-verse')
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(v => ({
        ref: v.ref || '',
        text: v.text || '',
        difficulty: v.difficulty || 'easy',
        order: v.order || 0,
        _slug: v._slug || ''
      }));

    const hero = readJsonFile('settings/hero.json');
    const about = readJsonFile('settings/about.json');
    const games = readJsonFile('settings/games.json');

    const cmsData = { scriptures, inspirations, posts, hero, about, games, trivia, memoryVerses };

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'cms-data.json'), JSON.stringify(cmsData, null, 2));
    console.log('[CMS] Generated cms-data.json with',
      scriptures.length, 'scriptures,',
      inspirations.length, 'inspirations,',
      posts.length, 'posts,',
      trivia.length, 'trivia,',
      memoryVerses.length, 'memoryVerses'
    );
  });

  return {
    dir: {
      input: ".",
      output: "_site"
    },
    templateFormats: ["njk"],
    passthroughFileCopy: true
  };
};
