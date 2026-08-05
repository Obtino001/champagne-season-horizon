// Extracts rendered Danish text from a saved live-storefront HTML page so the
// theme-content translations (which never live in theme files) can be re-entered
// into the Horizon templates.
import fs from 'node:fs';

const file = process.argv[2];
const html = fs.readFileSync(file, 'utf8');

const decode = (s) =>
  s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .trim();

const show = (label, re) => {
  const out = new Set();
  for (const m of html.matchAll(re)) {
    const t = decode(m[1]);
    if (t) out.add(t);
  }
  if (out.size) {
    console.log(`\n=== ${label} ===`);
    for (const t of out) console.log('- ' + t);
  }
};

show('ANNOUNCEMENT', /announcement-bar__message[^>]*>([\s\S]*?)<\/(?:p|div|span|h2)>/gi);
show('BANNER HEADING', /banner__heading[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|div)>/gi);
show('BANNER TEXT', /banner__text[^>]*>([\s\S]*?)<\/(?:div|p)>/gi);
show('BANNER BUTTON', /button[^>]*>([^<]{2,60})<\/a>/gi);
show('RICH TEXT', /rich-text__(?:heading|text)[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|div|p)>/gi);
