import fs from 'node:fs';
import path from 'node:path';

const DAWN = 'C:/Users/Yasir/Pictures/champagne-season-live';

const schemaOf = (file) => {
  const raw = fs.readFileSync(path.join(DAWN, file), 'utf8');
  const match = raw.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  return match ? JSON.parse(match[1]) : null;
};

const data = JSON.parse(fs.readFileSync(path.join(DAWN, 'config/settings_data.json'), 'utf8'));

const targets = [
  ['announcement-bar', 'sections/announcement-bar.liquid'],
  ['header', 'sections/header.liquid'],
  ['footer', 'sections/footer.liquid'],
  ['main-password-header', 'sections/main-password-header.liquid'],
  ['main-password-footer', 'sections/main-password-footer.liquid'],
];

const describe = (setting, value, isSaved) => {
  const shown = JSON.stringify(value);
  const options = setting.options?.map((o) => o.value).join('|');
  return (
    `  ${isSaved ? '*' : ' '} ${setting.id.padEnd(30)} = ${String(shown).padEnd(28)}` +
    `${isSaved ? '(SAVED)' : '(default)'}` +
    (options ? `  [${options}]` : '')
  );
};

for (const [key, file] of targets) {
  const schema = schemaOf(file);
  const saved = data.current.sections?.[key];
  console.log(`\n===== ${key} =====`);

  for (const setting of schema.settings ?? []) {
    if (!setting.id) continue;
    const isSaved = saved?.settings && setting.id in saved.settings;
    const value = isSaved ? saved.settings[setting.id] : setting.default;
    if (value === undefined) continue;
    console.log(describe(setting, value, isSaved));
  }

  for (const [blockKey, block] of Object.entries(saved?.blocks ?? {})) {
    const blockSchema = schema.blocks?.find((b) => b.type === block.type);
    console.log(`  -- block ${blockKey} (${block.type})${block.disabled ? ' [DISABLED]' : ''}`);
    for (const setting of blockSchema?.settings ?? []) {
      if (!setting.id) continue;
      const isSaved = block.settings && setting.id in block.settings;
      const value = isSaved ? block.settings[setting.id] : setting.default;
      if (value === undefined) continue;
      const shown = JSON.stringify(value);
      console.log(
        `     ${isSaved ? '*' : ' '} ${setting.id.padEnd(24)} = ` +
          `${String(shown).slice(0, 120).padEnd(40)}${isSaved ? '(SAVED)' : '(default)'}`
      );
    }
  }
}

// Contact + page templates come from template JSON rather than settings_data.
for (const [file, sectionFile] of [
  ['templates/page.json', 'sections/main-page.liquid'],
  ['templates/page.contact.json', 'sections/contact-form.liquid'],
]) {
  const template = JSON.parse(fs.readFileSync(path.join(DAWN, file), 'utf8'));
  console.log(`\n===== ${file} =====`);
  for (const [key, section] of Object.entries(template.sections)) {
    const schema = schemaOf(section.type === 'main-page' ? 'sections/main-page.liquid' : sectionFile);
    console.log(`  section ${key} (${section.type})`);
    for (const setting of schema.settings ?? []) {
      if (!setting.id) continue;
      const isSaved = setting.id in (section.settings ?? {});
      const value = isSaved ? section.settings[setting.id] : setting.default;
      if (value === undefined) continue;
      console.log(describe(setting, value, isSaved));
    }
  }
}
