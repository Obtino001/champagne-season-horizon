import fs from 'node:fs';
const html = fs.readFileSync('.migrate/live-home.html', 'utf8');

const wrap = html.match(/<div class="rich-text__wrapper[^"]*"/);
console.log('WRAPPER:', wrap ? wrap[0] : '(none)');

const m = html.match(/<div class="rich-text__text rte"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
if (!m) throw new Error('rich-text block not found');
const inner = m[1].trim();
fs.writeFileSync('.migrate/richtext-da.html', inner, 'utf8');
console.log('\nLENGTH:', inner.length);
console.log('\nTAGS:', (inner.match(/<\/?[a-z0-9]+/gi) || []).join(' '));
