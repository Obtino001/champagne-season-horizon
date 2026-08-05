import fs from 'node:fs';

const raw = fs.readFileSync(process.argv[2], 'utf8');
const lines = raw
  .split(/\r?\n/)
  .map((l) => l.replace(/\u001b\[[0-9;]*m/g, '').replace(/^[╭╰│─\s]+|[│─╮╯\s]+$/g, ''));

const ERROR_CHECKS = /(MissingTemplate|UniqueStaticBlockId|CaptureOnContentForBlock|LiquidHTMLSyntaxError|ImgWidthAndHeight)/;

let file = '';
const rows = [];

for (let i = 0; i < lines.length; i += 1) {
  const trimmed = lines[i].trim();
  if (/^[\w\-./]+\.(liquid|json)$/.test(trimmed)) {
    file = trimmed;
    continue;
  }
  const match = trimmed.match(/^\[error\]:\s*(\w+)/);
  if (!match || !ERROR_CHECKS.test(match[1])) continue;

  const detail = lines
    .slice(i + 1, i + 3)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  rows.push(`${file}\n    ${match[1]}: ${detail ?? ''}`);
}

console.log([...new Set(rows)].join('\n'));
console.log(`\n${rows.length} error rows`);
