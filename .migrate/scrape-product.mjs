import fs from 'node:fs';

const res = await fetch('https://champagne-season.com/products/special-club-book', {
  headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'da' },
});
console.log('status', res.status);
const html = await res.text();
fs.writeFileSync('.migrate/live-product.html', html, 'utf8');

const picks = [
  'related',
  'also like',
  'Du vil',
  'Lignende',
  'product-recommendations',
  'Anbefalet',
  'Måske',
  'andre produkter',
];
for (const p of picks) {
  const i = html.toLowerCase().indexOf(p.toLowerCase());
  if (i >= 0) console.log(p + ':', JSON.stringify(html.slice(Math.max(0, i - 40), i + 100).replace(/\s+/g, ' ')));
}

const h = html.match(/product-recommendations[\s\S]{0,1200}/i);
if (h) {
  const titles = [...h[0].matchAll(/<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) =>
    m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  );
  console.log('rec headings:', titles);
}
