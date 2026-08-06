import fs from 'node:fs';

const handles = {
  'bottle-cover': 'flaske-skjulere',
  lassalle: 'j-lassalle',
  'sabrage-card': 'sciaboliamo-sabrage-card',
  'h-goutorbe-2': 'h-goutorbe',
  'fresnet-juillet': 'fresnet-juillet',
};

const CACHE = '.migrate/cache';
fs.mkdirSync(CACHE, { recursive: true });

for (const [tmpl, handle] of Object.entries(handles)) {
  const file = `${CACHE}/collection-${handle}.html`;
  let html;
  if (fs.existsSync(file) && tmpl !== 'fresnet-juillet') {
    html = fs.readFileSync(file, 'utf8');
  } else {
    const res = await fetch(`https://champagne-season.com/collections/${handle}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'da' },
    });
    console.log(`${tmpl} -> ${handle}: HTTP ${res.status}`);
    if (!res.ok) continue;
    html = await res.text();
    fs.writeFileSync(file, html, 'utf8');
    await new Promise((r) => setTimeout(r, 300));
  }
  const title = (html.match(/<title>([^<]+)/) || [])[1] || '?';
  const headings = [...html.matchAll(/<(h[12])[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((m) => m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim())
    .filter((t) => t && !/Filter|Sorter|produkter|Hurtige|Kontakt|mission|Abonner/i.test(t))
    .slice(0, 6);
  console.log(`  title: ${title}`);
  console.log(`  headings: ${headings.join(' | ')}`);
  console.log(`  rich-text count: ${(html.match(/class="rich-text /g) || []).length}`);
}

// search collections page for Champagniør / champagne ears
const res = await fetch('https://champagne-season.com/search?q=Champagni%C3%B8r&type=article,page,product,collection', {
  headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'da' },
});
const html = await res.text();
const hits = [...html.matchAll(/\/collections\/([a-z0-9-]+)/g)].map((m) => m[1]);
console.log('\nsearch Champagniør collection hits:', [...new Set(hits)].slice(0, 20).join(', '));
