import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const stripComments = (raw) =>
  raw
    .replace(/^\uFEFF/, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const readJson = (file) => JSON.parse(stripComments(fs.readFileSync(file, 'utf8')));

const schemaOf = (file) => {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
};

const collect = (dir) => {
  const map = new Map();
  if (!fs.existsSync(path.join(ROOT, dir))) return map;
  for (const file of fs.readdirSync(path.join(ROOT, dir))) {
    if (!file.endsWith('.liquid')) continue;
    map.set(file.replace(/\.liquid$/, ''), schemaOf(path.join(ROOT, dir, file)));
  }
  return map;
};

const sections = collect('sections');
const blocks = collect('blocks');

const locale = readJson(path.join(ROOT, 'locales/en.default.schema.json'));

const localeHas = (key) =>
  key
    .split('.')
    .reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), locale) !==
  undefined;

/** Every setting id declared by a schema, including ids nested in presets/blocks. */
const settingIds = (schema) => {
  const ids = new Set(['custom_css']);
  for (const setting of schema?.settings ?? []) if (setting.id) ids.add(setting.id);
  return ids;
};

const errors = [];
const warnings = [];

const checkSettings = (label, schema, settings) => {
  if (!schema) return;
  const known = settingIds(schema);
  for (const id of Object.keys(settings ?? {})) {
    if (!known.has(id)) warnings.push(`${label}: unknown setting "${id}"`);
  }
};

const acceptedBlockTypes = (schema) => {
  const list = schema?.blocks;
  if (!Array.isArray(list)) return null;
  const types = new Set();
  let acceptsAny = false;
  for (const entry of list) {
    if (entry.type === '@theme') acceptsAny = true;
    else if (entry.type === '@app') types.add('@app');
    else if (entry.type) types.add(entry.type);
  }
  return { types, acceptsAny };
};

const walkBlocks = (label, parentSchema, blockMap) => {
  const accepted = acceptedBlockTypes(parentSchema);
  for (const [key, block] of Object.entries(blockMap ?? {})) {
    const here = `${label} > ${key}`;
    const schema = blocks.get(block.type);
    if (!blocks.has(block.type)) {
      errors.push(`${here}: block type "${block.type}" does not exist in blocks/`);
      continue;
    }
    if (accepted && !accepted.acceptsAny && !accepted.types.has(block.type)) {
      // Private blocks (_prefixed) are always rendered explicitly by their parent.
      if (!block.type.startsWith('_')) {
        warnings.push(`${here}: block type "${block.type}" not in parent's accepted blocks`);
      }
    }
    if (block.name && block.name.startsWith('t:') && !localeHas(block.name.slice(2))) {
      errors.push(`${here}: missing locale key ${block.name}`);
    }
    checkSettings(here, schema, block.settings);
    walkBlocks(here, schema, block.blocks);
  }
};

const templates = [
  ...fs.readdirSync(path.join(ROOT, 'templates')).filter((f) => f.endsWith('.json')).map((f) => `templates/${f}`),
  ...fs
    .readdirSync(path.join(ROOT, 'sections'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => `sections/${f}`),
];

for (const relative of templates) {
  const file = path.join(ROOT, relative);
  let data;
  try {
    data = readJson(file);
  } catch (error) {
    errors.push(`${relative}: invalid JSON - ${error.message}`);
    continue;
  }

  for (const [key, section] of Object.entries(data.sections ?? {})) {
    const label = `${relative} > ${key}`;
    const schema = sections.get(section.type);
    if (!sections.has(section.type)) {
      errors.push(`${label}: section type "${section.type}" does not exist in sections/`);
      continue;
    }
    if (section.name && section.name.startsWith('t:') && !localeHas(section.name.slice(2))) {
      errors.push(`${label}: missing locale key ${section.name}`);
    }
    checkSettings(label, schema, section.settings);
    walkBlocks(label, schema, section.blocks);

    for (const id of section.block_order ?? []) {
      if (!section.blocks?.[id]) errors.push(`${label}: block_order references missing block "${id}"`);
    }
  }

  for (const id of data.order ?? []) {
    if (!data.sections?.[id]) errors.push(`${relative}: order references missing section "${id}"`);
  }
}

const show = process.argv.includes('--warnings');
console.log(`Checked ${templates.length} JSON files.`);
console.log(`Errors: ${errors.length}  Warnings: ${warnings.length}`);
if (errors.length) console.log('\nERRORS\n' + errors.join('\n'));
if (show && warnings.length) console.log('\nWARNINGS\n' + warnings.join('\n'));
process.exitCode = errors.length ? 1 : 0;
