// Recovers Danish theme-content translations for the collection templates by
// reading the rendered live storefront, and drops the video "description" blocks
// that Dawn only ever used as alt/iframe-title text.
//
// Usage:  node .migrate/da-collections.mjs [--write] [--limit N]
import fs from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const CACHE = '.migrate/cache';
fs.mkdirSync(CACHE, { recursive: true });

const entities = (s) =>
  s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** Strip Shopify Translate & Adapt <tc> wrappers that sometimes leak into HTML. */
const stripTc = (s) => s.replace(/<\/?tc>/gi, '');

const inner = (s) =>
  stripTc(entities(s))
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/(<(?:p|h[1-6])>)\s+/g, '$1')
    .replace(/\s+(<\/(?:p|h[1-6])>)/g, '$1')
    .trim();

const plain = (s) =>
  stripTc(entities(s.replace(/<[^>]*>/g, ' '))).replace(/\s+/g, ' ').trim();

/** Template filename → live collection handle when they differ. */
const HANDLE_MAP = {
  'bottle-cover': 'flaske-skjulere',
  lassalle: 'j-lassalle',
  'sabrage-card': 'sciaboliamo-sabrage-card',
  'h-goutorbe-2': 'h-goutorbe',
};

const loadJson = (p) => {
  const raw = fs.readFileSync(p, 'utf8');
  const m = raw.match(/^\/\*[\s\S]*?\*\/\s*/);
  return { header: m ? m[0] : '', data: JSON.parse(m ? raw.slice(m[0].length) : raw) };
};
const saveJson = (p, header, data) =>
  fs.writeFileSync(p, header + JSON.stringify(data, null, 2) + '\n', 'utf8');

const fetchPage = async (handle) => {
  const file = path.join(CACHE, `collection-${handle}.html`);
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const res = await fetch(`https://champagne-season.com/collections/${handle}`, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'da' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  fs.writeFileSync(file, html, 'utf8');
  await new Promise((r) => setTimeout(r, 400));
  return html;
};

/** Split a page into its theme sections, in document order. */
const splitSections = (html) => {
  const out = [];
  const re = /id="shopify-section-([^"]+)"/g;
  const marks = [...html.matchAll(re)].map((m) => ({ id: m[1], at: m.index }));
  for (let i = 0; i < marks.length; i++) {
    out.push({
      id: marks[i].id,
      html: html.slice(marks[i].at, i + 1 < marks.length ? marks[i + 1].at : html.length),
    });
  }
  return out;
};

const scrape = (html) => {
  const rich = [];
  const video = [];
  for (const s of splitSections(html)) {
    if (/^(announcement-bar|header|footer)$/.test(s.id)) continue;
    if (/banner|product-grid/.test(s.id)) continue;
    const isVideo = /class="video-section/.test(s.html);
    const isRich = /class="rich-text/.test(s.html);
    if (!isVideo && !isRich) continue;

    const h = s.html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const heading = h ? plain(h[1]) : '';

    if (isVideo) {
      video.push({ heading });
    } else {
      const b = s.html.match(/class="rich-text__text rte"[^>]*>([\s\S]*?)<\/div>/i);
      rich.push({ heading, body: b ? inner(b[1]) : '' });
    }
  }
  return { rich, video };
};

const files = fs
  .readdirSync('templates')
  .filter((f) => /^collection\..+\.json$/.test(f))
  .slice(0, LIMIT);

let edits = 0;
let videoDescRemoved = 0;
const problems = [];

for (const file of files) {
  const handle = HANDLE_MAP[file.replace(/^collection\./, '').replace(/\.json$/, '')] ||
    file.replace(/^collection\./, '').replace(/\.json$/, '');
  const p = path.join('templates', file);
  const { header, data } = loadJson(p);

  // Horizon targets, in template order.
  const richTargets = [];
  const videoTargets = [];
  for (const id of data.order) {
    const s = data.sections[id];
    if (!s || s.disabled) continue;
    const blocks = s.blocks || {};
    if (/^collection_text/.test(id)) richTargets.push({ id, blocks });
    else if (/^video_section/.test(id)) videoTargets.push({ id, blocks });
  }
  if (!richTargets.length && !videoTargets.length) continue;

  let html;
  try {
    html = await fetchPage(handle);
  } catch (e) {
    problems.push(`${file}: fetch failed (${e.message})`);
    continue;
  }
  const live = scrape(html);

  if (live.rich.length !== richTargets.length) {
    problems.push(
      `${file}: ${richTargets.length} rich-text section(s) in theme vs ${live.rich.length} live`
    );
  }

  let changed = 0;

  richTargets.forEach((t, i) => {
    const src = live.rich[i];
    if (!src) return;
    const setBlock = (name, value) => {
      const b = t.blocks[name];
      if (!b || !value) return;
      if (b.settings.text !== value) {
        b.settings.text = value;
        changed++;
      }
    };
    if (src.heading) {
      const tag = (t.blocks.heading?.settings?.text || '').match(/^<(h[1-6])>/)?.[1] || 'h2';
      setBlock('heading', `<${tag}>${src.heading}</${tag}>`);
    }
    setBlock('body', src.body);
  });

  videoTargets.forEach((t, i) => {
    const src = live.video[i];
    if (src?.heading && t.blocks.heading) {
      const tag = (t.blocks.heading.settings.text || '').match(/^<(h[1-6])>/)?.[1] || 'h2';
      const value = `<${tag}>${src.heading}</${tag}>`;
      if (t.blocks.heading.settings.text !== value) {
        t.blocks.heading.settings.text = value;
        changed++;
      }
    }
    // Dawn renders `description` only as alt / iframe title, never as page copy.
    const section = data.sections[t.id];
    if (t.blocks.description) {
      delete t.blocks.description;
      if (Array.isArray(section.block_order)) {
        section.block_order = section.block_order.filter((b) => b !== 'description');
      }
      videoDescRemoved++;
      changed++;
    }
  });

  if (changed) {
    edits += changed;
    if (WRITE) saveJson(p, header, data);
    console.log(`${WRITE ? 'updated' : 'would update'} ${file}: ${changed} change(s)`);
  }
}

console.log(`\n${WRITE ? 'Applied' : 'Planned'} ${edits} change(s) across collection templates.`);
console.log(`Video description blocks removed: ${videoDescRemoved}`);
if (problems.length) {
  console.log('\n--- needs a look ---');
  for (const p of problems) console.log('  ' + p);
}
