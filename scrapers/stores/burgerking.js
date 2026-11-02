// Burger King Latvija: публичная страница «Piedāvājumi».
import * as cheerio from 'cheerio';
import { fetchText } from '../lib/http.js';
import { offerFromText } from '../lib/promo.js';

const BASE = 'https://burgerking.lv';
const PAGE = `${BASE}/piedavajumi/`;

export function parse(html, today) {
  const $ = cheerio.load(html);
  const out = [];
  $('section[class*="campaigns-module--campaigns"]').each((_, el) => {
    const $s = $(el);
    const $img = $s.next('section[class*="image-section"]').find('img[src]:not([src^="data:"])').first();
    const desc = $s.find('p').map((__, p) => $(p).html().replace(/<br\s*\/?>/gi, '. ')).get().join(' ');
    const o = offerFromText({
      title: $s.find('h2').first().text(),
      text: cheerio.load(`<p>${desc}</p>`)('p').text().replace(/(\.\s*){2,}/g, '. '),
      url: PAGE,
      image: $img.attr('src') ? new URL($img.attr('src'), BASE).href : undefined,
      today,
    });
    if (o) out.push(o);
  });
  return out;
}

export async function scrape({ log, today }) {
  const items = parse(await fetchText(PAGE), today);
  log(`burgerking: ${items.length} акций`);
  return items;
}
