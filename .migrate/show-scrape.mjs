import fs from 'node:fs';
import path from 'node:path';

const CACHE = '.migrate/cache';
const entities = (s) =>
  s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const plain = (s) => entities(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

for (const f of fs.readdirSync(CACHE)) {
  const html = fs.readFileSync(path.join(CACHE, f), 'utf8');
  console.log(`\n=== ${f} ===`);
  const marks = [...html.matchAll(/id="shopify-section-([^"]+)"/g)].map((m) => ({ id: m[1], at: m.index }));
  for (let i = 0; i < marks.length; i++) {
    const id = marks[i].id;
    if (/^(announcement-bar|header|footer)$/.test(id) || /banner|product-grid/.test(id)) continue;
    const body = html.slice(marks[i].at, marks[i + 1]?.at ?? html.length);
    const kind = /class="video-section/.test(body) ? 'VIDEO' : /class="rich-text/.test(body) ? 'RICH' : '?';
    if (kind === '?') continue;
    const h = body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const b = body.match(/class="rich-text__text rte"[^>]*>([\s\S]*?)<\/div>/i);
    console.log(`  ${kind} heading: ${h ? plain(h[1]) : '(none)'}`);
    if (b) console.log(`       body: ${plain(b[1]).slice(0, 130)}…`);
  }
}
