import fs from 'node:fs';
const j = JSON.parse(fs.readFileSync('templates/index.json', 'utf8').replace(/^\/\*[\s\S]*?\*\//, ''));
const walk = (blocks, path) => {
  for (const [k, b] of Object.entries(blocks || {})) {
    if (b.type === 'button' || b.type === 'buttons') {
      console.log(`${b.disabled ? 'OFF' : 'ON '}  ${path}/${k}  label=${JSON.stringify(b.settings?.label)} link=${JSON.stringify(b.settings?.link)}`);
    }
    walk(b.blocks, `${path}/${k}`);
  }
};
for (const key of j.order) walk(j.sections[key].blocks, key);
