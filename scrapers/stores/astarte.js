// Astarte Nafta: страница «Akcijas» (заголовок, дата публикации, картинка, текст).
import * as cheerio from 'cheerio';
import { fetchText } from '../lib/http.js';
import { parseFuelPromo } from '../lib/fuel.js';
import { offerFromText } from '../lib/promo.js';
import { cleanText, addDays } from '../lib/util.js';

const PAGE = 'https://astarte.lv/akcijas/';

export function parse(html, today) {
  const $ = cheerio.load(html);
  const out = [];
  $('article.border-box__sales').each((_, a) => {
    const $a = $(a);
    const date = cleanText($a.find('.news-date').text()).match(/(\d{2})\/(\d{2})\/(\d{4})/);
    const published = date ? `${date[3]}-${date[2]}-${date[1]}` : null;
    if (published && published < addDays(today, -400)) return; // очень старые публикации пропускаем
    const text = cleanText($a.find('.border-box__context').first().text()).replace(/Lasīt vairāk/g, '').trim();
    const o = offerFromText({
      title: $a.find('h2').first().text(),
      text,
      url: $a.find('a[href]').first().attr('href') ?? PAGE,
      image: $a.find('img[src]').first().attr('src'),
      today,
    });
    if (!o) return;
    const pr = parseFuelPromo(`${o.title} ${text}`);
    if (pr.cents) o.badge = `−${pr.cents} c/л`;
    if (/klienta kart/i.test(text)) o.requires = ['card:astarte'];
    out.push(o);
  });
  return out;
}

export async function scrape({ log, today }) {
  const items = parse(await fetchText(PAGE), today);
  log(`astarte: ${items.length} акций`);
  return items;
}
