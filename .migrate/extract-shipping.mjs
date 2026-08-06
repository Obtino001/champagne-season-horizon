import fs from 'node:fs';

const html = fs.readFileSync('.migrate/live-product.html', 'utf8');
const m = html.match(/Forsendelse[\s\S]{0,300}?<tc>([\s\S]*?)<\/tc>/i) ||
  html.match(/accordion__content[\s\S]*?(<p><strong>Vi har 2[\s\S]*?<\/p>)/i);

if (!m) {
  // broader search
  const i = html.indexOf('Vi har 2 måder');
  console.log('index', i);
  console.log(html.slice(i - 50, i + 1800));
  process.exit(0);
}

const inner = m[1]
  .replace(/<\/?tc>/gi, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/>\s+</g, '><')
  .trim();
console.log(inner);
fs.writeFileSync('.migrate/shipping-da.html', inner, 'utf8');
