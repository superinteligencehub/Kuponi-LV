// Caffeine: постоянные и ежемесячные предложения (страницы Elementor: заголовок h2 + текст).
import * as cheerio from 'cheerio';
import { fetchText } from '../lib/http.js';
import { offerFromText, ogMeta } from '../lib/promo.js';

const BASE = 'https://caffeine.lv/';

export function parsePage(html, url, today) {
  const $ = cheerio.load(html);
  const out = [];
  $('h2.elementor-heading-title').each((_, h) => {
    const title = $(h).text();
    const $w = $(h).closest('.elementor-element');
    const text = $w.nextAll('.elementor-widget-text-editor').first().text();
    if (!text || /piedāvājumi$/i.test(title.trim())) return;
    const o = offerFromText({ title, text, url, image: ogMeta(html, 'og:image') || undefined, today });
    if (o) out.push(o);
  });
  return out;
}

export async function scrape({ log, today }) {
  const home = await fetchText(BASE);
  const links = new Set([`${BASE}pastavigie-piedavajumi/`]);
  for (const m of home.matchAll(/href="(https:\/\/caffeine\.lv\/[a-z0-9-]*ipasais-piedavajums[a-z0-9-]*\/)"/g)) links.add(m[1]);
  const items = [];
  for (const url of links) {
    try {
      items.push(...parsePage(await fetchText(url, { retries: 0 }), url, today));
    } catch {
      /* пропускаем */
    }
  }
  log(`caffeine: ${items.length} предложений`);
  return items;
}
