// Čili Pizza: акции в слайдере на главной (#akcijas): заголовок, текст, ссылка на подробности.
import * as cheerio from 'cheerio';
import { fetchText } from '../lib/http.js';
import { offerFromText } from '../lib/promo.js';

const BASE = 'https://cilipizza.lv/';

export function parse(html, today) {
  const $ = cheerio.load(html);
  const out = [];
  $('#akcijas .swiper-slide').each((_, el) => {
    const $s = $(el);
    const img = ($s.attr('style') ?? '').match(/url\((?:&quot;|["'])?([^"')&]+)/)?.[1];
    const link = $s.find('a[href]').first().attr('href');
    const o = offerFromText({
      title: $s.find('h2').first().text(),
      text: $s.find('.desc').clone().find('a.ffwd').remove().end().text(),
      url: link ? new URL(link, BASE).href : BASE,
      image: img ? new URL(img, BASE).href : undefined,
      today,
    });
    if (o) out.push(o);
  });
  return [...new Map(out.map((x) => [x.title, x])).values()];
}

export async function scrape({ log, today }) {
  const items = parse(await fetchText(BASE), today);
  log(`cilipizza: ${items.length} акций`);
  return items;
}
