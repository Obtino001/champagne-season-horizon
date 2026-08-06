import fs from 'node:fs';
const html = fs.readFileSync('.migrate/live-product.html', 'utf8');

// Section rendering embeds JSON; look for recommendations heading there.
const m = html.match(/product-recommendations[\s\S]{0,4000}/i);
if (m) {
  const chunk = m[0];
  const heading = chunk.match(/"heading"\s*:\s*"([^"]+)"/);
  console.log('json heading:', heading?.[1]);
  const h2 = [...chunk.matchAll(/<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi)].map((x) =>
    x[2].replace(/<[^>]*>/g, '').trim()
  );
  console.log('html headings in chunk:', h2);
}

// Also search Shopify section rendering payloads.
for (const m of html.matchAll(/SectionRendering[\s\S]{0,200}|"heading":"([^"]{3,80})"/g)) {
  if (m[1] && /like|lign|anbef|også|ogs/i.test(m[1])) console.log('heading hit:', m[1]);
}

const allH2 = [...html.matchAll(/<(h[1-3])[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/\1>/gi)]
  .map((m) => ({ tag: m[1], cls: m[2].slice(0, 40), text: m[3].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() }))
  .filter((x) => x.text && !/Hurtige|Kontakt|mission|Abonner|Filter|Sorter/i.test(x.text));
console.log('\nall headings:');
for (const h of allH2) console.log(`  ${h.tag} [${h.cls}] ${h.text}`);
