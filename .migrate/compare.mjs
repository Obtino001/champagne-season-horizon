import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DAWN = 'C:/Users/Yasir/Pictures/champagne-season-live/templates';

const file = process.argv[2] ?? 'index.json';

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\/\*[\s\S]*?\*\//, ''));

const flag = (section) => (section.disabled ? '[OFF] ' : '      ');

const dawn = readJson(path.join(DAWN, file));
console.log(`===== DAWN ${file} =====`);
for (const key of dawn.order ?? Object.keys(dawn.sections)) {
  const section = dawn.sections[key];
  const s = section.settings ?? {};
  const label = [s.title, s.heading].filter(Boolean).join(' / ');
  console.log(
    flag(section) +
      section.type.padEnd(32) +
      (label ? ` "${label}"` : '') +
      (s.collection ? `  collection=${s.collection}` : '')
  );
}

const firstText = (blocks) => {
  for (const block of Object.values(blocks ?? {})) {
    const text = block.settings?.text;
    if (typeof text === 'string' && text.trim()) {
      return text.replace(/<[^>]*>/g, '').trim().slice(0, 46);
    }
    const nested = firstText(block.blocks);
    if (nested) return nested;
  }
  return '';
};

const horizon = readJson(path.join(ROOT, 'templates', file));
console.log(`\n===== HORIZON ${file} =====`);
for (const key of horizon.order ?? Object.keys(horizon.sections)) {
  const section = horizon.sections[key];
  const s = section.settings ?? {};
  console.log(
    flag(section) +
      section.type.padEnd(28) +
      ` "${firstText(section.blocks)}"` +
      (s.collection ? `  collection=${s.collection}` : '')
  );
}
