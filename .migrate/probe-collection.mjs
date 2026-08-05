import fs from 'node:fs';
const html = fs.readFileSync(process.argv[2], 'utf8');

const plain = (s) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

console.log('--- shopify sections in order ---');
for (const m of html.matchAll(/id="shopify-section-([^"]+)"/g)) console.log('  ' + m[1]);

console.log('\n--- rich-text headings/texts ---');
for (const m of html.matchAll(/rich-text__(heading|text)[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|div|p)>/gi)) {
  console.log(`  [${m[1]}] ${plain(m[2]).slice(0, 90)}`);
}

console.log('\n--- video section markup ---');
for (const m of html.matchAll(/class="([^"]*video[^"]*)"/gi)) console.log('  ' + m[1].slice(0, 70));

console.log('\n--- h2/h3 with class, in order ---');
for (const m of html.matchAll(/<(h[1-4])[^>]*class="([^"]*)"[^>]*>([\s\S]{0,200}?)<\/\1>/gi)) {
  const t = plain(m[3]);
  if (t) console.log(`  ${m[1]} [${m[2].slice(0, 40)}] ${t.slice(0, 70)}`);
}
