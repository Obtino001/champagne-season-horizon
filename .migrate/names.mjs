import fs from 'node:fs';

const raw = fs
  .readFileSync('./locales/en.default.schema.json', 'utf8')
  .replace(/^\uFEFF/, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const schema = JSON.parse(raw);
const filter = process.argv[2] ?? '.';
const re = new RegExp(filter, 'i');

for (const [key, value] of Object.entries(schema.names)) {
  if (re.test(key) || re.test(String(value))) console.log(`${key} = ${value}`);
}
