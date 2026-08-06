import fs from 'node:fs';
const html = fs.readFileSync('.migrate/live-home.html', 'utf8');
const m = [...html.matchAll(/href="(\/products\/[^"]+)"/g)].map((x) => x[1]);
console.log([...new Set(m)].slice(0, 8).join('\n'));
