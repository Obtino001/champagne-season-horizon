const url =
  'https://champagne-season.com/products/special-club-book?section_id=template--16439547134194__product-recommendations';
const html = await (
  await fetch(url, {
    headers: { 'Accept-Language': 'da', 'User-Agent': 'Mozilla/5.0' },
  })
).text();
console.log(html);
