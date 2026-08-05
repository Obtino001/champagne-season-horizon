import fs from 'node:fs';
import path from 'node:path';

const DAWN = 'C:/Users/Yasir/Pictures/champagne-season-live/templates';
const HORIZON = 'C:/Users/Yasir/Pictures/world-of-comfort/champagne-season-horizon/templates';

const HEADER = `/*
 * ------------------------------------------------------------
 * IMPORTANT: The contents of this file are auto-generated.
 *
 * This file may be updated by the Shopify admin theme editor
 * or related systems. Please exercise caution as any changes
 * made to this file may be overwritten.
 * ------------------------------------------------------------
 */`;

const textBlock = (name, text, preset, opts = {}) => ({
  type: 'text',
  name,
  settings: {
    text,
    width: opts.width ?? '100%',
    max_width: opts.max_width ?? 'none',
    alignment: opts.alignment ?? 'left',
    type_preset: preset,
    font: 'var(--font-body--family)',
    font_size: '1rem',
    line_height: 'normal',
    letter_spacing: 'normal',
    case: 'none',
    wrap: 'pretty',
    background: false,
    background_color: '#00000026',
    corner_radius: 0,
    'padding-block-start': opts.top ?? 0,
    'padding-block-end': opts.bottom ?? 0,
    'padding-inline-start': 0,
    'padding-inline-end': 0,
  },
  blocks: {},
});

const sectionSettings = (over = {}) => ({
  content_direction: 'column',
  vertical_on_mobile: true,
  horizontal_alignment: 'flex-start',
  vertical_alignment: 'center',
  align_baseline: false,
  horizontal_alignment_flex_direction_column: 'flex-start',
  vertical_alignment_flex_direction_column: 'center',
  gap: 12,
  section_width: 'page-width',
  section_height: '',
  section_height_custom: 50,
  background_media: 'none',
  background_color: '{{ settings.color_palette.background }}',
  video_position: 'cover',
  background_image_position: 'cover',
  border: 'none',
  border_width: 1,
  border_opacity: 100,
  border_radius: 0,
  toggle_overlay: false,
  overlay_color: '#00000026',
  overlay_style: 'solid',
  gradient_direction: 'to top',
  'padding-block-start': 48,
  'padding-block-end': 48,
  ...over,
});

const productCardBlock = (imageRatio) => ({
  type: '_product-card',
  name: 't:names.product_card',
  static: true,
  settings: {
    product_card_gap: 4,
    border: 'none',
    border_width: 1,
    border_opacity: 100,
    border_radius: 0,
    'padding-block-start': 0,
    'padding-block-end': 0,
    'padding-inline-start': 0,
    'padding-inline-end': 0,
  },
  blocks: {
    'card-gallery': {
      type: '_product-card-gallery',
      name: 't:names.product_card_media',
      settings: {
        image_ratio: imageRatio,
        border: 'none',
        border_width: 1,
        border_opacity: 100,
        border_radius: 0,
        'padding-block-start': 0,
        'padding-block-end': 0,
        'padding-inline-start': 0,
        'padding-inline-end': 0,
      },
      blocks: {},
    },
    'card-title': {
      type: 'product-title',
      name: 't:names.product_title',
      settings: {
        width: '100%',
        max_width: 'normal',
        alignment: 'left',
        type_preset: 'rte',
        font: 'var(--font-body--family)',
        font_size: '1rem',
        line_height: 'normal',
        letter_spacing: 'normal',
        case: 'none',
        wrap: 'pretty',
        background: false,
        background_color: '#00000026',
        corner_radius: 0,
        'padding-block-start': 4,
        'padding-block-end': 0,
        'padding-inline-start': 0,
        'padding-inline-end': 0,
      },
      blocks: {},
    },
    'card-price': {
      type: 'price',
      name: 't:names.product_price',
      settings: {
        show_sale_price_first: true,
        show_installments: false,
        show_tax_info: false,
        type_preset: 'h6',
        width: '100%',
        alignment: 'left',
        font: 'var(--font-body--family)',
        font_size: '1rem',
        line_height: 'normal',
        letter_spacing: 'normal',
        case: 'none',
        'padding-block-start': 0,
        'padding-block-end': 0,
        'padding-inline-start': 0,
        'padding-inline-end': 0,
      },
      blocks: {},
    },
  },
  block_order: ['card-gallery', 'card-title', 'card-price'],
});

const filtersBlock = (filtering, sorting) => ({
  type: 'filters',
  name: 't:names.filters',
  static: true,
  settings: {
    enable_filtering: !!filtering,
    filter_style: 'horizontal',
    filter_width: 'centered',
    text_label_case: 'default',
    show_swatch_label: false,
    show_filter_label: false,
    enable_sorting: !!sorting,
    enable_grid_density: true,
    'padding-block-start': 8,
    'padding-block-end': 8,
    'padding-inline-start': 0,
    'padding-inline-end': 0,
    facets_margin_bottom: 8,
    facets_margin_right: 20,
  },
  blocks: {},
});

const isBlank = (v) => {
  if (v == null) return true;
  const stripped = String(v).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return stripped.length === 0;
};

const files = fs
  .readdirSync(DAWN)
  .filter((f) => /^collection(\..+)?\.json$/.test(f))
  .sort();

const report = [];

for (const file of files) {
  const dawn = JSON.parse(fs.readFileSync(path.join(DAWN, file), 'utf8'));
  const out = { sections: {}, order: [] };

  const banner = Object.values(dawn.sections).find((s) => s.type === 'main-collection-banner');
  const grid = Object.values(dawn.sections).find((s) => s.type === 'main-collection-product-grid');

  // 1) main-collection-banner -> Horizon "section" with bound collection title (+ description)
  const bannerBlocks = {
    collection_title: textBlock('t:names.title', '<h1>{{ closest.collection.title }}</h1>', 'h2', {
      width: 'fit-content',
      max_width: 'normal',
    }),
  };
  const bannerOrder = ['collection_title'];
  if (!banner || banner.settings?.show_collection_description !== false) {
    bannerBlocks.collection_description = textBlock(
      't:names.description',
      '{{ closest.collection.description }}',
      'rte',
      { width: 'fit-content', max_width: 'normal' }
    );
    bannerOrder.push('collection_description');
  }
  if (banner?.settings?.show_collection_image) {
    bannerBlocks.collection_image = {
      type: '_collection-image',
      name: 't:names.collection_image',
      settings: {
        collection: '{{ closest.collection }}',
        image_ratio: 'custom',
        collection_image_width: 100,
        collection_image_height: 40,
        'padding-block-start': 0,
        'padding-block-end': 16,
        'padding-inline-start': 0,
        'padding-inline-end': 0,
      },
      blocks: {},
    };
    bannerOrder.unshift('collection_image');
  }

  out.sections.banner = {
    type: 'section',
    blocks: bannerBlocks,
    block_order: bannerOrder,
    name: 't:names.heading',
    settings: sectionSettings({ gap: 12 }),
  };
  out.order.push('banner');

  // 2) main-collection-product-grid -> main-collection
  const imageRatio = grid?.settings?.image_ratio === 'square' ? 'square'
    : grid?.settings?.image_ratio === 'portrait' ? 'portrait'
    : 'adapt';

  out.sections.main = {
    type: 'main-collection',
    blocks: {
      filters: filtersBlock(grid?.settings?.enable_filtering, grid?.settings?.enable_sorting),
      'product-card': productCardBlock(imageRatio),
    },
    settings: {
      layout_type: 'grid',
      product_card_size: 'medium',
      mobile_product_card_size: 'small',
      enable_infinite_scroll: true,
      products_per_page: grid?.settings?.products_per_page ?? 16,
      product_grid_width: 'centered',
      full_width_on_mobile: true,
      columns_gap_horizontal: 16,
      columns_gap_vertical: 24,
      'padding-inline-start': 0,
      'padding-inline-end': 0,
      background_color: '{{ settings.color_palette.background }}',
      'padding-block-start': grid?.settings?.padding_top ?? 36,
      'padding-block-end': grid?.settings?.padding_bottom ?? 36,
    },
  };
  out.order.push('main');

  // 3) rich-text and video sections, in Dawn's original order
  let richIndex = 0;
  let videoIndex = 0;

  for (const key of dawn.order) {
    const s = dawn.sections[key];
    if (!s) continue;

    if (s.type === 'rich-text') {
      const blocks = {};
      const order = [];
      for (const bKey of s.block_order ?? []) {
        const b = s.blocks?.[bKey];
        if (!b || b.disabled) continue;
        if (b.type === 'heading' && !isBlank(b.settings?.heading)) {
          blocks.heading = textBlock('t:names.heading', `<h2>${b.settings.heading}</h2>`, 'h2');
          order.push('heading');
        } else if (b.type === 'text' && !isBlank(b.settings?.text)) {
          blocks.body = textBlock('t:names.text', b.settings.text, 'rte');
          order.push('body');
        } else if (b.type === 'button' && !isBlank(b.settings?.button_label)) {
          blocks.button = {
            type: 'button',
            name: 't:names.button',
            settings: {
              label: b.settings.button_label,
              link: b.settings.button_link ?? '',
              open_in_new_tab: false,
              style_class: b.settings.button_style_secondary ? 'button-secondary' : 'button',
              width: 'fit-content',
              custom_width: 100,
              width_mobile: 'fit-content',
              custom_width_mobile: 100,
            },
            blocks: {},
          };
          order.push('button');
        }
      }
      if (order.length === 0) continue; // entire Dawn rich-text was empty/disabled

      richIndex += 1;
      const id = richIndex === 1 ? 'collection_text' : `collection_text_${richIndex}`;
      out.sections[id] = {
        type: 'section',
        blocks,
        block_order: order,
        name: 't:names.rich_text_section',
        settings: sectionSettings({
          gap: 16,
          'padding-block-start': s.settings?.padding_top ?? 40,
          'padding-block-end': s.settings?.padding_bottom ?? 52,
        }),
      };
      if (s.disabled) out.sections[id].disabled = true;
      out.order.push(id);
    }

    if (s.type === 'video') {
      videoIndex += 1;
      const id = videoIndex === 1 ? 'video_section' : `video_section_${videoIndex}`;
      const blocks = {};
      const order = [];
      if (!isBlank(s.settings?.heading)) {
        blocks.heading = textBlock('t:names.heading', `<h2>${s.settings.heading}</h2>`, 'h3', {
          alignment: 'center',
        });
        order.push('heading');
      }
      blocks.video = {
        type: 'video',
        name: 't:names.video',
        settings: {
          source: 'url',
          video_url: s.settings?.video_url ?? '',
          video_autoplay: false,
          video_loop: true,
          cover_image: s.settings?.cover_image ?? '',
          alt: s.settings?.description || s.settings?.heading || '',
          custom_width: 100,
          custom_width_mobile: 100,
          aspect_ratio: '16/9',
          border: 'none',
          border_width: 1,
          border_opacity: 100,
          border_radius: 0,
          'padding-block-start': 0,
          'padding-block-end': 0,
          'padding-inline-start': 0,
          'padding-inline-end': 0,
        },
        blocks: {},
      };
      order.push('video');
      if (!isBlank(s.settings?.description)) {
        blocks.description = textBlock('t:names.description', `<p>${s.settings.description}</p>`, 'rte', {
          alignment: 'center',
        });
        order.push('description');
      }

      out.sections[id] = {
        type: 'section',
        blocks,
        block_order: order,
        name: 't:names.video_section',
        settings: sectionSettings({
          gap: 16,
          horizontal_alignment_flex_direction_column: 'center',
          section_width: s.settings?.full_width ? 'full-width' : 'page-width',
          'padding-block-start': s.settings?.padding_top ?? 32,
          'padding-block-end': s.settings?.padding_bottom ?? 36,
        }),
      };
      if (s.disabled) out.sections[id].disabled = true;
      out.order.push(id);
    }
  }

  fs.writeFileSync(
    path.join(HORIZON, file),
    HEADER + JSON.stringify(out, null, 2) + '\n',
    'utf8'
  );
  report.push(`${file}: ${out.order.join(', ')}`);
}

console.log(report.join('\n'));
console.log(`\nWrote ${files.length} collection templates.`);
