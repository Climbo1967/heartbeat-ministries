const fs = require('fs');
const path = require('path');

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

  // Generate cms-data.json after build
  eleventyConfig.on('eleventy.after', () => {
    const contentDir = path.resolve(__dirname, 'content');
    const outputDir = path.resolve(__dirname, '_site');

    function readMdFiles(dir) {
      const fullDir = path.join(contentDir, dir);
      if (!fs.existsSync(fullDir)) return [];
      return fs.readdirSync(fullDir)
        .filter(f => f.endsWith('.md'))
        .map(f => {
          const raw = fs.readFileSync(path.join(fullDir, f), 'utf8');
          const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
          if (!match) return null;
          const frontMatter = {};
          match[1].split('\n').forEach(line => {
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0) {
              const key = line.slice(0, colonIdx).trim();
              let val = line.slice(colonIdx + 1).trim();
              if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
              }
              if (val === 'true') val = true;
              else if (val === 'false') val = false;
              else if (!isNaN(val) && val !== '') val = Number(val);
              frontMatter[key] = val;
            }
          });
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
        text: s.body || '',
        tag: s.tag || ''
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
        body: p._body || ''
      }));

    const hero = readJsonFile('settings/hero.json');
    const about = readJsonFile('settings/about.json');
    const games = readJsonFile('settings/games.json');

    const cmsData = { scriptures, inspirations, posts, hero, about, games };

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'cms-data.json'), JSON.stringify(cmsData, null, 2));
    console.log('[CMS] Generated cms-data.json with', scriptures.length, 'scriptures,', inspirations.length, 'inspirations,', posts.length, 'posts');
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
