import fs from 'node:fs';

const url =
  'https://champagne-season.com/products/special-club-book?sections=product-recommendations';
const res = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'da', Accept: 'application/json' },
});
console.log('status', res.status);
const text = await res.text();
fs.writeFileSync('.migrate/live-recs.json', text, 'utf8');
try {
  const j = JSON.parse(text);
  for (const [k, html] of Object.entries(j)) {
    console.log('key', k, 'len', html.length);
    const headings = [...html.matchAll(/<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) =>
      m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    );
    console.log('headings', headings);
  }
} catch (e) {
  console.log('not json', text.slice(0, 200));
}
