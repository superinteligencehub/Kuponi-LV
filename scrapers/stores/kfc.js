// KFC Latvija: акции публикуются как новости (/jaunumi/…) и страницы «Akcijas piedāvājumi».
import * as cheerio from 'cheerio';
import { fetchText } from '../lib/http.js';
import { offerFromText, ogMeta } from '../lib/promo.js';

const BASE = 'https://kfc.lv';

export function parsePost(html, url, today) {
  const $ = cheerio.load(html);
  const body = $('h1').first().parent().text() || $('main').text();
  return offerFromText({
    title: ogMeta(html, 'og:title') || $('h1').first().text(),
    text: ogMeta(html, 'og:description') || body,
    url,
    image: ogMeta(html, 'og:image') || undefined,
    today,
    extra: { fullText: body },
  });
}

export async function scrape({ log, today }) {
  const home = await fetchText(`${BASE}/`);
  const links = [...new Set([...home.matchAll(/href="(https:\/\/kfc\.lv\/(?:jaunumi|akcijas-piedavjumi)\/[^"#?]+\/)"/g)].map((m) => m[1]))];
  if (!links.includes(`${BASE}/akcijas-piedavjumi/trakas-otrdienas/`)) links.push(`${BASE}/akcijas-piedavjumi/trakas-otrdienas/`);
  const items = [];
  for (const url of links.slice(0, 25)) {
    try {
      const o = parsePost(await fetchText(url, { retries: 0 }), url, today);
      if (o) {
        // для «trakās otrdienas» процент берём из полного текста («Ietaupi 50%»)
        if (!o.savingPct) {
          const m = String(o.fullText).match(/(\d{1,2})\s?%/);
          if (m) o.savingPct = Number(m[1]);
        }
        delete o.fullText;
        items.push(o);
      }
    } catch {
      /* одна страница не критична */
    }
  }
  log(`kfc: ${items.length} акций/новинок`);
  return items;
}
