const url =
  'https://champagne-season.com/recommendations/products?section_id=template--16439547134194__product-recommendations&product_id=10681515049293&limit=4';
const html = await (
  await fetch(url, {
    headers: { 'Accept-Language': 'da', 'User-Agent': 'Mozilla/5.0' },
  })
).text();
const headings = [...html.matchAll(/<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) =>
  m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
);
console.log('headings:', headings);
const titleMatch = html.match(/class="[^"]*product-recommendations__heading[^"]*"[^>]*>([\s\S]*?)<\//i);
console.log('heading class:', titleMatch?.[1]?.replace(/<[^>]*>/g, '').trim());
console.log('snippet:', html.replace(/\s+/g, ' ').slice(0, 500));
