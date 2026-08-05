import fs from 'node:fs';

const file = process.argv[2];
const pattern = new RegExp(process.argv[3] ?? '.', 'i');
const schema = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));

for (const group of schema) {
  for (const setting of group.settings ?? []) {
    if (!setting.id || !pattern.test(setting.id)) continue;
    const options = setting.options?.map((o) => o.value).join('|');
    console.log(
      `${group.name ?? ''} :: ${setting.id} = ${JSON.stringify(setting.default)}` +
        (options ? `  [${options}]` : '') +
        (setting.min !== undefined ? `  (${setting.min}-${setting.max})` : '')
    );
  }
}
