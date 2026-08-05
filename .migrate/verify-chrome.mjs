import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DAWN = 'C:/Users/Yasir/Pictures/champagne-season-live';

const normalize = (value) =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/["\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const dawn = JSON.parse(fs.readFileSync(path.join(DAWN, 'config/settings_data.json'), 'utf8'));

const haystack = normalize(
  ['sections/header-group.json', 'sections/footer-group.json', 'config/settings_data.json']
    .map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8'))
    .join('\n')
);

const CONTENT_KEYS = new Set([
  'text',
  'subtext',
  'heading',
  'menu',
  'link',
  'newsletter_heading',
  'favicon',
  'social_facebook_link',
  'social_instagram_link',
  'social_tiktok_link',
  'social_youtube_link',
]);

const items = [];

for (const [key, value] of Object.entries(dawn.current)) {
  if (CONTENT_KEYS.has(key) && typeof value === 'string') items.push({ where: 'theme', key, value });
}

for (const [sectionKey, section] of Object.entries(dawn.current.sections ?? {})) {
  for (const [key, value] of Object.entries(section.settings ?? {})) {
    if (CONTENT_KEYS.has(key) && typeof value === 'string') {
      items.push({ where: sectionKey, key, value });
    }
  }
  for (const [blockKey, block] of Object.entries(section.blocks ?? {})) {
    for (const [key, value] of Object.entries(block.settings ?? {})) {
      if (CONTENT_KEYS.has(key) && typeof value === 'string') {
        items.push({ where: `${sectionKey} > ${blockKey}`, key, value, disabled: block.disabled });
      }
    }
  }
}

let missing = 0;

for (const item of items) {
  const needle = normalize(item.value);
  if (needle.length === 0) continue;

  const exact = /^(shopify:\/\/|https?:\/\/|\/)/.test(item.value.trim());
  const found = exact
    ? haystack.includes(needle)
    : needle
        .split(' ')
        .filter((word) => word.length > 3)
        .every((word) => haystack.includes(word));

  const status = found ? 'ok     ' : 'MISSING';
  if (!found) missing += 1;
  const preview = item.value.length > 70 ? `${item.value.slice(0, 70)}...` : item.value;
  console.log(`${status} ${item.where} > ${item.key}: ${preview}`);
}

console.log(`\n${items.length} chrome content values checked, ${missing} missing.`);
