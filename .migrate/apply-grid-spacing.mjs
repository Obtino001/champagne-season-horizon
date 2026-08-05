import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

// Live store: spacing_grid_horizontal = 4, spacing_grid_vertical = 8 (Dawn default).
const HORIZONTAL = 4;
const VERTICAL = 8;

const HEADER_RE = /^\/\*[\s\S]*?\*\//;

const gridSections = new Set(['main-collection', 'search-results']);
const listSections = new Set(['product-list', 'main-collection-list', 'product-recommendations']);

const touched = [];

for (const dir of ['templates', 'sections']) {
  for (const file of fs.readdirSync(path.join(ROOT, dir))) {
    if (!file.endsWith('.json')) continue;

    const full = path.join(ROOT, dir, file);
    const raw = fs.readFileSync(full, 'utf8');
    const header = raw.match(HEADER_RE)?.[0] ?? '';
    const data = JSON.parse(raw.slice(header.length));

    let changed = false;

    for (const section of Object.values(data.sections ?? {})) {
      const settings = section.settings;
      if (!settings) continue;

      if (gridSections.has(section.type)) {
        settings['columns_gap_horizontal'] = HORIZONTAL;
        settings['columns_gap_vertical'] = VERTICAL;
        changed = true;
      }

      if (listSections.has(section.type)) {
        if ('columns_gap' in settings) settings['columns_gap'] = HORIZONTAL;
        if ('rows_gap' in settings) settings['rows_gap'] = VERTICAL;
        changed = true;
      }
    }

    if (!changed) continue;
    fs.writeFileSync(full, header + JSON.stringify(data, null, 2) + '\n', 'utf8');
    touched.push(`${dir}/${file}`);
  }
}

console.log(`Applied grid spacing (${HORIZONTAL}px / ${VERTICAL}px) to ${touched.length} files.`);
