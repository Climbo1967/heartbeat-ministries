// Content serializers — produce frontmatter YAML matching .eleventy.js parser

function wrapYaml(pairs, body) {
  let yaml = '---\n';
  for (const [key, val] of pairs) {
    if (Array.isArray(val)) {
      yaml += key + ':\n';
      for (const item of val) {
        yaml += '  - "' + String(item).replace(/"/g, '\\"') + '"\n';
      }
    } else if (val === true || val === false) {
      yaml += key + ': ' + val + '\n';
    } else if (typeof val === 'number') {
      yaml += key + ': ' + val + '\n';
    } else {
      // Replace newlines with spaces — the .eleventy.js parser is line-based
      // and would truncate multiline values to the first line
      const safe = String(val).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
      yaml += key + ': ' + safe + '\n';
    }
  }
  yaml += '---\n';
  if (body) yaml += body + '\n';
  return yaml;
}

// Scripture: content/scripture/{date}.md
export function buildScriptureMd(data) {
  return wrapYaml([
    ['date', data.date],
    ['text', data.text],
    ['reference', data.reference],
    ['translation', data.translation || 'NIV'],
    ['devotional', data.devotional || ''],
    ['prayer', data.prayer || '']
  ]);
}

// Inspiration: content/inspiration/{slug}.md
export function buildInspirationMd(data) {
  return wrapYaml([
    ['title', data.title],
    ['tag', data.tag || ''],
    ['order', data.order || 0]
  ], data.body || '');
}

// Blog: content/blog/{slug}.md
export function buildBlogMd(data) {
  return wrapYaml([
    ['title', data.title],
    ['date', data.date],
    ['category', data.category || 'Faith'],
    ['excerpt', data.excerpt || ''],
    ['icon', data.icon || '✝️'],
    ['readTime', data.readTime || '5 min read'],
    ['thumbnail', data.thumbnail || ''],
    ['draft', data.draft || false],
    ['seo_description', data.seo_description || '']
  ], data.body || '');
}

// Trivia: content/trivia/{slug}.md
export function buildTriviaMd(data) {
  return wrapYaml([
    ['q', data.q],
    ['opts', data.opts || []],
    ['ans', typeof data.ans === 'number' ? data.ans : 0],
    ['ref', data.ref || ''],
    ['explain', data.explain || ''],
    ['order', data.order || 0]
  ]);
}

// Memory Verse: content/memory-verse/{slug}.md
export function buildMemoryVerseMd(data) {
  return wrapYaml([
    ['ref', data.ref],
    ['text', data.text],
    ['difficulty', data.difficulty || 'easy'],
    ['order', data.order || 0]
  ]);
}

// Settings JSON: content/settings/{name}.json
export function buildSettingsJson(data) {
  return JSON.stringify(data, null, 2) + '\n';
}

// Generate a slug from text
export function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
