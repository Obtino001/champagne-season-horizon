import fs from 'node:fs';
const html = fs.readFileSync('.migrate/live-product.html', 'utf8');
const i = html.indexOf('Vi har 2 måder');
const chunk = html.slice(i - 80, i + 2200);
fs.writeFileSync('.migrate/shipping-chunk.html', chunk, 'utf8');
console.log(chunk);
