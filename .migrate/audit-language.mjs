// Lists merchant-authored copy still sitting in the templates, flagging text that
// looks English so the remaining theme-content translations can be spotted.
import fs from 'node:fs';
import path from 'node:path';

const DA_HINTS = /[æøå]|\b(og|til|med|vores|dine|din|her|kan|som|for|de|det|er)\b/i;
const EN_HINTS = /\b(the|your|our|and|with|for|all|shop|view|here|more|about|you|this|are)\b/i;

const files = [
  ...fs.readdirSync('templates').map((f) => path.join('templates', f)),
  ...fs.readdirSync('sections').map((f) => path.join('sections', f)),
].filter((f) => f.endsWith('.json'));

const rows = [];

const walk = (blocks, file, sectionId, disabled) => {
  for (const b of Object.values(blocks || {})) {
    const off = disabled || b.disabled;
    for (const key of ['text', 'label', 'heading', 'title']) {
      const v = b.settings?.[key];
      if (typeof v !== 'string') continue;
      const plain = v.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (plain.length < 4) continue;
      if (/^\{\{/.test(plain) || /^(shopify|https?):/.test(plain)) continue;
      const da = DA_HINTS.test(plain);
      const en = EN_HINTS.test(plain);
      if (en && !da) rows.push({ file, sectionId, key, off, plain });
    }
    walk(b.blocks, file, sectionId, off);
  }
};

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\/\*[\s\S]*?\*\//, '');
  let j;
  try {
    j = JSON.parse(raw);
  } catch {
    continue;
  }
  for (const [id, s] of Object.entries(j.sections || {})) walk(s.blocks, file, id, s.disabled);
}

const visible = rows.filter((r) => !r.off);
const hidden = rows.filter((r) => r.off);

const print = (label, list) => {
  console.log(`\n=== ${label} (${list.length}) ===`);
  const byFile = new Map();
  for (const r of list) {
    if (!byFile.has(r.file)) byFile.set(r.file, []);
    byFile.get(r.file).push(r);
  }
  for (const [file, list2] of byFile) {
    console.log(`\n${file}`);
    for (const r of list2) console.log(`  ${r.sectionId}.${r.key}: ${r.plain.slice(0, 100)}`);
  }
};

print('LIKELY ENGLISH — visible', visible);
print('LIKELY ENGLISH — disabled sections', hidden);
