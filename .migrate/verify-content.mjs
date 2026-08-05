import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DAWN = 'C:/Users/Yasir/Pictures/champagne-season-live/templates';

/** Settings that carry merchant content rather than styling. */
const CONTENT_KEYS = new Set([
  'heading',
  'subheading',
  'text',
  'subtext',
  'caption',
  'title',
  'description',
  'button_label',
  'button_label_1',
  'button_label_2',
  'link_label',
  'button_link',
  'button_link_1',
  'button_link_2',
  'link',
  'video_url',
  'image',
  'image_1',
  'image_2',
  'cover_image',
  'collection',
  'product',
  'menu',
  'page',
]);

const normalize = (value) =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    // Quotes and backslashes are escaped inside the raw JSON we compare against.
    .replace(/["\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/** Collect [key, value, wasDisabled] for every content-bearing setting. */
const harvest = (node, disabled, out) => {
  if (!node || typeof node !== 'object') return;

  const isDisabled = disabled || node.disabled === true;

  for (const [key, value] of Object.entries(node.settings ?? {})) {
    if (!CONTENT_KEYS.has(key)) continue;
    if (typeof value !== 'string' || normalize(value).length === 0) continue;
    out.push({ key, value, disabled: isDisabled });
  }

  for (const child of Object.values(node.blocks ?? {})) harvest(child, isDisabled, out);
};

const stripHeader = (raw) => raw.replace(/^\/\*[\s\S]*?\*\//, '');

const files = fs
  .readdirSync(DAWN)
  .filter((f) => f.endsWith('.json'))
  .sort();

let missingCount = 0;
let checkedCount = 0;
const lines = [];

for (const file of files) {
  const dawn = JSON.parse(fs.readFileSync(path.join(DAWN, file), 'utf8'));

  const horizonPath = path.join(ROOT, 'templates', file);
  if (!fs.existsSync(horizonPath)) {
    lines.push(`${file}: NO HORIZON TEMPLATE`);
    continue;
  }
  const horizonRaw = normalize(stripHeader(fs.readFileSync(horizonPath, 'utf8')));

  const items = [];
  for (const section of Object.values(dawn.sections ?? {})) {
    harvest(section, section.disabled === true, items);
  }

  const missing = [];
  for (const item of items) {
    checkedCount += 1;

    // Handles and paths must match verbatim; prose only needs its words to survive.
    const needle = normalize(item.value);
    const found = /^(shopify:\/\/|https?:\/\/|\/)/.test(item.value.trim())
      ? horizonRaw.includes(needle)
      : needle
          .split(' ')
          .filter((word) => word.length > 3)
          .every((word) => horizonRaw.includes(word));

    if (!found) {
      missing.push(item);
      missingCount += 1;
    }
  }

  if (missing.length) {
    lines.push(`\n${file}`);
    for (const item of missing) {
      const preview = item.value.length > 110 ? `${item.value.slice(0, 110)}...` : item.value;
      lines.push(`  ${item.disabled ? '[dawn-disabled] ' : ''}${item.key}: ${preview}`);
    }
  }
}

console.log(`Compared ${checkedCount} content values across ${files.length} Dawn templates.`);
console.log(`Not found in Horizon: ${missingCount}`);
if (lines.length) console.log(lines.join('\n'));
