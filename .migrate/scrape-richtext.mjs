// Dumps each rendered rich-text section from a saved live page, alongside the
// matching section ids in Dawn's template, so translated copy can be paired up
// with the section it belongs to.
import fs from 'node:fs';

const html = fs.readFileSync('.migrate/live-home.html', 'utf8');

const decode = (s) =>
  s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

// Each theme section renders inside <div id="shopify-section-<id>">.
const re = /<(?:div|section)[^>]*id="shopify-section-([^"]+)"([\s\S]*?)(?=<(?:div|section)[^>]*id="shopify-section-|<\/body)/gi;

for (const m of html.matchAll(re)) {
  const [, id, body] = m;
  if (!/rich-text|rich_text/i.test(id) && !/rich-text/i.test(body.slice(0, 400))) continue;
  const lines = decode(body);
  if (!lines.length) continue;
  console.log(`\n=== section ${id} ===`);
  for (const l of lines) console.log(l);
}

const dawn = JSON.parse(
  fs.readFileSync('C:/Users/Yasir/Pictures/champagne-season-live/templates/index.json', 'utf8')
);
console.log('\n=== Dawn section order ===');
for (const key of dawn.order) {
  const s = dawn.sections[key];
  console.log(`${s.disabled ? '[OFF] ' : '      '}${key}  (${s.type})`);
}
