// Recovers the Danish theme-content translations from the rendered live storefront
// and writes them into the Horizon templates.
//
// Why this exists: Shopify keeps per-section translated setting values in a
// translation layer bound to a theme id, not in the theme's JSON files. Copying
// theme files therefore only carries the base (English) values, which is why the
// migrated homepage rendered in English. Scraping the live Danish page is the only
// way to recover that copy without Admin API access.
//
// Usage:  node .migrate/da-content.mjs [--write]
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const html = fs.readFileSync('.migrate/live-home.html', 'utf8');

const entities = (s) =>
  s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const plain = (s) => entities(s.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();

/** All matches of `re` (group 1) in document order, entity-decoded. */
const all = (re, transform = plain) => {
  const out = [];
  const global = re.global ? re : new RegExp(re.source, re.flags + 'g');
  for (const m of html.matchAll(global)) {
    const v = transform(m[1]);
    if (v) out.push(v);
  }
  return out;
};

const one = (re, transform = plain) => {
  const [v] = all(re, transform);
  if (!v) throw new Error(`no match for ${re}`);
  return v;
};

// --- scrape ------------------------------------------------------------------

const announcement = one(/announcement-bar__message[^>]*>([\s\S]*?)<\/(?:p|div|span|h2)>/i);
const bannerText = one(/banner__text[^>]*>([\s\S]*?)<\/div>/i);

// Featured-collection headings render as <h2 class="title ...">.
const collectionTitles = all(/<h2[^>]*class="title[^"]*"[^>]*>([\s\S]*?)<\/h2>/gi);

const iwtHeadings = all(/image-with-text__heading[^"]*"[^>]*>([\s\S]*?)<\/h2>/gi);

// Inner HTML is kept for rich body copy so links and paragraphs survive.
const innerHtml = (s) =>
  entities(s)
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/(<(?:p|h[1-6])>)\s+/g, '$1')
    .replace(/\s+(<\/(?:p|h[1-6])>)/g, '$1')
    .trim();
const iwtTexts = [
  ...new Set(all(/<div class="image-with-text__text rte[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, innerHtml)),
];

const collageTitle = one(/collage-wrapper-title[^>]*>([\s\S]*?)<\/h2>/i);

const multicolumnTitle = one(/multicolumn-card__info[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/i);
const multicolumnText = one(
  /multicolumn-card__info[\s\S]*?<div class="rte[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  innerHtml
);

const richText = one(/<div class="rich-text__text rte"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i, innerHtml);

const footerHeadings = all(/footer-block__heading[^>]*>([\s\S]*?)<\/h2>/gi);

// --- map onto Horizon blocks -------------------------------------------------

const wrap = (tag, s) => `<${tag}>${s}</${tag}>`;

const indexEdits = [
  ['image_banner.text', `<p>${bannerText}</p>`],
  ['recommended_champagne.title', wrap('h2', collectionTitles[0])],
  ['exclusive_selection_text.heading', wrap('h2', iwtHeadings[0])],
  ['exclusive_selection_text.text', iwtTexts[0]],
  ['our_exclusive_champagnes.title', wrap('h2', collectionTitles[1])],
  ['perfect_moment_text.heading', wrap('h2', iwtHeadings[1])],
  ['perfect_moment_text.text', iwtTexts[1]],
  ['time_to_pop_collage.heading', wrap('h2', collageTitle)],
  ['learn_more_about_champagne.title', wrap('h2', collectionTitles[2])],
  ['perfect_match_multicolumn.heading', wrap('h3', multicolumnTitle)],
  ['perfect_match_multicolumn.text', multicolumnText],
  ['all_vintage_accessories.title', wrap('h2', collectionTitles[3])],
  ['champagne_blogs_text.heading', wrap('h2', iwtHeadings[2])],
  ['champagne_blogs_text.text', iwtTexts[2]],
];

if (!WRITE) {
  console.log('=== scraped Danish content ===');
  console.log('announcement :', announcement);
  for (const [target, value] of indexEdits) {
    console.log(`\n${target}\n  ${value.slice(0, 220)}${value.length > 220 ? ' …' : ''}`);
  }
  console.log('\nfooter headings :', footerHeadings.join(' | '));
  console.log(`\nrich text       : ${richText.length} chars, ${(richText.match(/<h2>/g) || []).length} headings`);
  process.exit(0);
}

// --- apply -------------------------------------------------------------------

const loadJson = (p) => {
  const raw = fs.readFileSync(p, 'utf8');
  const m = raw.match(/^\/\*[\s\S]*?\*\/\s*/);
  return { header: m ? m[0] : '', data: JSON.parse(m ? raw.slice(m[0].length) : raw) };
};
const saveJson = (p, header, data) =>
  fs.writeFileSync(p, header + JSON.stringify(data, null, 2) + '\n', 'utf8');

/** Depth-first search for a block by id anywhere under a section. */
const findBlock = (blocks, id) => {
  for (const [k, b] of Object.entries(blocks || {})) {
    if (k === id) return b;
    const hit = findBlock(b.blocks, id);
    if (hit) return hit;
  }
  return null;
};

const index = loadJson('templates/index.json');
let changed = 0;

for (const [target, value] of indexEdits) {
  const [sectionId, blockId] = target.split('.');
  const section = index.data.sections[sectionId];
  if (!section) throw new Error(`missing section ${sectionId}`);
  const block = findBlock(section.blocks, blockId);
  if (!block) throw new Error(`missing block ${target}`);
  if (block.settings.text !== value) {
    block.settings.text = value;
    changed++;
  }
}

// Dawn's rich-text section held its copy only in the Danish translation, so it was
// dropped as empty during the first pass. Recreate it as a native Horizon section.
const SEO_ID = 'seo_text';
if (!index.data.sections[SEO_ID]) {
  index.data.sections[SEO_ID] = {
    type: 'section',
    blocks: {
      text: {
        type: 'text',
        name: 't:names.text',
        settings: {
          text: richText,
          width: '100%',
          max_width: 'normal',
          alignment: 'center',
          type_preset: 'rte',
          font: 'var(--font-body--family)',
          font_size: '1rem',
          line_height: 'normal',
          letter_spacing: 'normal',
          case: 'none',
          wrap: 'pretty',
          text_color: '',
          background: false,
          background_color: '#00000026',
          corner_radius: 0,
          'padding-block-start': 0,
          'padding-block-end': 0,
          'padding-inline-start': 0,
          'padding-inline-end': 0,
        },
        blocks: {},
      },
    },
    block_order: ['text'],
    name: 't:names.section',
    settings: {
      content_direction: 'column',
      vertical_on_mobile: true,
      horizontal_alignment: 'center',
      vertical_alignment: 'center',
      align_baseline: false,
      horizontal_alignment_flex_direction_column: 'center',
      vertical_alignment_flex_direction_column: 'center',
      gap: 16,
      section_width: 'page-width',
      section_height: '',
      section_height_custom: 50,
      background_media: 'none',
      background_color: '{{ settings.color_palette.background }}',
      video_position: 'cover',
      background_image_position: 'cover',
      toggle_overlay: false,
      overlay_color: '#00000026',
      overlay_style: 'solid',
      gradient_direction: 'to top',
      border: 'none',
      border_width: 1,
      border_opacity: 100,
      border_color: '',
      border_radius: 0,
      // Dawn: padding_top 40 / padding_bottom 52 on desktop.
      'padding-block-start': 40,
      'padding-block-end': 52,
    },
  };
  const at = index.data.order.indexOf('champagne_blogs_text');
  index.data.order.splice(at + 1, 0, SEO_ID);
  changed++;
}

saveJson('templates/index.json', index.header, index.data);
console.log(`index.json: ${changed} change(s)`);

// Announcement bar copy also moved on since the theme file was last saved.
const header = loadJson('sections/header-group.json');
const findByType = (blocks, type) => {
  for (const b of Object.values(blocks || {})) {
    if (b.type === type) return b;
    const hit = findByType(b.blocks, type);
    if (hit) return hit;
  }
  return null;
};
let ann = null;
for (const s of Object.values(header.data.sections)) {
  ann = ann || findByType(s.blocks, '_announcement');
}
if (!ann) throw new Error('announcement block not found');
if (ann.settings.text !== announcement) {
  ann.settings.text = announcement;
  saveJson('sections/header-group.json', header.header, header.data);
  console.log(`header-group.json: announcement -> ${announcement}`);
}

// Footer column headings.
const footer = loadJson('sections/footer-group.json');
const footerMap = new Map([
  ['Quick links', footerHeadings[0]],
  ['Contact', footerHeadings[1]],
  ['Our mission', footerHeadings[2]],
  ['Subscribe to our newsletter', footerHeadings[3]],
]);
let footerChanged = 0;
const translateFooter = (blocks) => {
  for (const b of Object.values(blocks || {})) {
    const t = b.settings?.text;
    // Match only a heading that is the block's entire content, so substrings such as
    // "Contact" inside a mailto: address are never rewritten.
    const heading = typeof t === 'string' ? t.match(/^<(h[1-6])>([^<]*)<\/\1>$/) : null;
    if (heading) {
      const da = footerMap.get(heading[2].trim());
      if (da) {
        b.settings.text = `<${heading[1]}>${da}</${heading[1]}>`;
        footerChanged++;
      }
    }
    if (typeof b.settings?.heading === 'string') {
      const da = footerMap.get(b.settings.heading);
      if (da) {
        b.settings.heading = da;
        footerChanged++;
      }
    }
    translateFooter(b.blocks);
  }
};
for (const s of Object.values(footer.data.sections)) translateFooter(s.blocks);
if (footerChanged) {
  saveJson('sections/footer-group.json', footer.header, footer.data);
  console.log(`footer-group.json: ${footerChanged} heading(s) translated`);
}
