import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DAWN = 'C:/Users/Yasir/Pictures/champagne-season-live';

const horizonFile = path.join(ROOT, 'config/settings_data.json');
const horizon = JSON.parse(fs.readFileSync(horizonFile, 'utf8'));
const dawn = JSON.parse(fs.readFileSync(path.join(DAWN, 'config/settings_data.json'), 'utf8'));

/**
 * Dawn renders headings with 1rem == 10px, so its .h1-.h6 scale lands well below
 * Horizon's editorial defaults. These are the nearest values Horizon offers.
 */
Object.assign(horizon.current, {
  page_width: 'narrow',

  favicon: dawn.current.favicon,

  type_body_font: 'assistant_n4',
  type_subheading_font: 'assistant_n4',
  type_heading_font: 'assistant_n4',
  type_accent_font: 'assistant_n4',
  type_size_paragraph: '16',
  type_size_h1: '32',
  type_size_h2: '24',
  type_size_h3: '20',
  type_size_h4: '18',
  type_size_h5: '16',
  type_size_h6: '14',
  type_letter_spacing_h1: 'heading-normal',
  type_letter_spacing_h2: 'heading-normal',
  type_letter_spacing_h3: 'heading-normal',

  badge_position: 'bottom-left',

  button_border_radius_primary: 0,
  button_border_radius_secondary: 0,
  inputs_border_radius: 0,

  card_corner_radius: 0,
  product_corner_radius: 0,

  show_cart_note: true,

  color_palette: {
    background: '#ffffff',
    foreground: '#121212',
    color1: '#333333',
    color2: '#DFDFDF',
  },
});

// App embed blocks are theme-agnostic; carrying them over keeps Klaviyo, product
// labels, product options, age verification and fraud filtering live.
horizon.current.blocks = dawn.current.blocks;

fs.writeFileSync(horizonFile, JSON.stringify(horizon), 'utf8');

const embeds = Object.values(dawn.current.blocks ?? {});
console.log(`Carried over ${embeds.length} app embed blocks:`);
for (const block of embeds) {
  const handle = block.type.split('/blocks/')[0].replace('shopify://apps/', '');
  console.log(`  ${handle}${block.disabled ? ' (disabled)' : ''}`);
}
