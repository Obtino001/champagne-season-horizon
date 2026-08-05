import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const schemaOf = (file) => {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  return match ? JSON.parse(match[1]) : null;
};

for (const target of process.argv.slice(2)) {
  const [dir, name] = target.split('/');
  const schema = schemaOf(path.join(ROOT, dir, `${name}.liquid`));
  const ids = (schema.settings ?? []).filter((s) => s.id).map((s) => s.id);
  console.log(`\n== ${target} ==`);
  console.log(`accepted blocks: ${JSON.stringify(schema.blocks?.map((b) => b.type) ?? null)}`);
  console.log(`settings (${ids.length}): ${ids.join(', ')}`);
}
