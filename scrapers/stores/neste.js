// Neste: предложения партнёров для клиентов Neste (Hesburger, Narvesen, Rimi) — публичные страницы.
import * as cheerio from 'cheerio';
import { fetchText } from '../lib/http.js';
import { parseFuelPromo } from '../lib/fuel.js';
import { offerFromText, ogMeta } from '../lib/promo.js';
import { cleanText } from '../lib/util.js';

const BASE = 'https://www.neste.lv/privatpersonam/klientu-ieguvumi/partneru-piedavajumi/';
const PARTNERS = ['hesburger', 'narvesen', 'rimi'];

export function parsePartner(html, url, today) {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  const main = cleanText($('main').text() || $('body').text());
  const slug = url.split('/').pop();
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);
  // первое содержательное предложение после заголовка
  const lead = main.replace(/^.*?Partneru piedāvājumi\s*/, '').replace(new RegExp(`^${name}\\s*${name}\\s*`, 'i'), '');
  const pr = parseFuelPromo(lead);
  const o = offerFromText({ title: `Neste + ${name}`, text: lead.slice(0, 450), url, image: ogMeta(html, 'og:image') || undefined, today });
  if (!o) return null;
  if (pr.cents) o.badge = `−${pr.cents} c/л`;
  o.requires = /Neste karti|Privātkart|lietotn/i.test(lead) ? ['card:neste'] : [];
  return o;
}

export async function scrape({ log, today }) {
  const items = [];
  for (const p of PARTNERS) {
    try {
      const o = parsePartner(await fetchText(BASE + p), BASE + p, today);
      if (o) items.push(o);
    } catch {
      /* одна страница не критична */
    }
  }
  if (!items.length) throw new Error('Neste: не найдено ни одного предложения партнёров');
  log(`neste: ${items.length} партнёрских предложений`);
  return items;
}
