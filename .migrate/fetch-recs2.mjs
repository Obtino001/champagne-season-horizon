import fs from 'node:fs';

// Dawn loads recommendations via /products/HANDLE?section_id=...
const html = fs.readFileSync('.migrate/live-product.html', 'utf8');
const sectionId = html.match(/shopify-section-([^"]*product-recommendations[^"]*)/);
console.log('section id:', sectionId?.[1]);

const ids = [...html.matchAll(/id="shopify-section-([^"]+)"/g)].map((m) => m[1]);
console.log('all sections:', ids);

const recUrl = sectionId
  ? `https://champagne-season.com/products/special-club-book?section_id=${sectionId[1]}`
  : null;
if (!recUrl) {
  // try common pattern
  const alt = ids.find((id) => /recommend/i.test(id));
  console.log('alt', alt);
}
if (recUrl) {
  const res = await fetch(recUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'da' },
  });
  const body = await res.text();
  console.log('status', res.status, 'len', body.length);
  const headings = [...body.matchAll(/<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) =>
    m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  );
  console.log('headings', headings);
}
