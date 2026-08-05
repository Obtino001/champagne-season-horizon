import fs from 'node:fs';
const html = fs.readFileSync('.migrate/live-home.html', 'utf8');
const want = [
  'image-with-text__heading',
  'image-with-text__text',
  'collection__title',
  'title-wrapper',
  'multicolumn-card__info',
  'collage',
  'announcement-bar__message',
  'banner__text',
];
for (const cls of want) {
  const n = (html.match(new RegExp(cls, 'g')) || []).length;
  console.log(`${String(n).padStart(3)}  ${cls}`);
}
console.log('\n--- headings in document order ---');
for (const m of html.matchAll(/<(h[1-3])[^>]*class="([^"]*)"[^>]*>([\s\S]{0,120}?)<\/\1>/gi)) {
  const text = m[3].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (text) console.log(`${m[1]} [${m[2].slice(0, 45)}] ${text.slice(0, 70)}`);
}
