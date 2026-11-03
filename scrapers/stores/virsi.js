// Virši: топливные акции, «месячные» предложения еды/напитков (цена по карте и стандартная),
// предложения партнёров и цены на топливо — всё на публичных страницах сайта.
import * as cheerio from 'cheerio';
import { fetchText } from '../lib/http.js';
import { fuelKind, parseFuelPromo } from '../lib/fuel.js';
import { cleanText, parsePrice, parseLvRange } from '../lib/util.js';

const BASE = 'https://www.virsi.lv/lv/privatpersonam';
const P = {
  fuelPromo: `${BASE}/degvielas-akcijas-privatpersonam`,
  food: `${BASE}/edieni-dzerieni-pakalpojumi`,
  partners: `${BASE}/sadarbibas-partneru-piedavajumi`,
  prices: `${BASE}/degviela/degvielas-un-elektrouzlades-cenas`,
};

/** Текстовые блоки страницы: заголовок (h2/h3) + следующий текст. */
function blocks(html) {
  const $ = cheerio.load(html);
  const main = $('main').length ? $('main') : $('body');
  const out = [];
  main.find('h2, h3').each((_, h) => {
    const title = cleanText($(h).text());
    const parts = [];
    let el = $(h).next();
    let guard = 0;
    while (el.length && !el.is('h2, h3') && guard++ < 25) {
      parts.push(cleanText(el.text()));
      el = el.next();
    }
    // текст часто лежит в соседних колонках — берём родителя, если рядом пусто
    const text = parts.join(' ').trim() || cleanText($(h).parent().text()).replace(title, '').trim();
    const img = $(h).closest('section, article, div').find('img[src]').first().attr('src');
    if (title) out.push({ title, text, image: img && !img.startsWith('data:') ? new URL(img, 'https://www.virsi.lv').href : undefined });
  });
  return out;
}

export function parseFood(html, today) {
  return blocks(html)
    .map((b) => {
      const card = b.text.match(/(?:Cena ar Viršu karti vai lietotni|Akcijas cena ar Virši karti\/? ?mob\.app\.?|Cena)[^0-9]{0,20}(\d+[.,]\d{2})/i);
      const std = b.text.match(/Standarta cena[^0-9]{0,10}(\d+[.,]\d{2})/i);
      const period = b.text.match(/Akcijas periods:?\s*([0-9.\s-]+\d)/i);
      if (!card) return null;
      const range = period ? parseLvRange(period[1], today) : { from: null, to: null };
      return {
        variant: b.title,
        title: b.title,
        priceNew: parsePrice(card[1]),
        priceOld: std ? parsePrice(std[1]) : null,
        validFrom: range.from,
        validTo: range.to,
        conditions: [/karti|lietotn/i.test(card[0]) ? 'Cena ar Viršu klienta karti vai lietotni' : '', b.text.slice(0, 300)].filter(Boolean),
        requires: /karti|lietotn/i.test(card[0]) ? ['app:virsi'] : [],
        url: P.food,
        image: b.image,
      };
    })
    .filter(Boolean);
}

export function parseFuelPromos(html) {
  return blocks(html)
    .map((b) => {
      const pr = parseFuelPromo(`${b.title} ${b.text}`);
      if (!pr.cents) return null;
      return {
        variant: `fuelpromo-${b.title}`,
        kind: 'offer',
        title: `Degviela -${pr.cents} c/l${pr.days.length ? ` (${pr.days.join(', ')})` : ''}`,
        badge: `−${pr.cents} c/л`,
        conditions: [b.text.slice(0, 300)],
        requires: ['app:virsi'],
        url: P.fuelPromo,
      };
    })
    .filter(Boolean);
}

export function parsePartners(html) {
  return blocks(html)
    .filter((b) => /atlaid|kod|piedāvāj|punkt|cent/i.test(b.text) && b.text.length > 40)
    .map((b) => {
      const pr = parseFuelPromo(b.text);
      return {
        variant: `partner-${b.title}`,
        kind: /kod/i.test(b.text) ? 'coupon' : 'offer',
        title: b.title,
        ...(pr.cents ? { badge: `−${pr.cents} c/л` } : {}),
        conditions: [b.text.slice(0, 400)],
        url: P.partners,
      };
    });
}

export function parsePrices(html, today) {
  const $ = cheerio.load(html);
  const text = cleanText($('main').text() || $('body').text());
  const seg = text.split(/Elektrouzlādes cenas\s+CCS/i)[0];
  const out = [];
  for (const m of seg.matchAll(/\b(DD|D|AD|95E|98E|CBG|LPG|AdBLUE)\s+(\d\.\d{3})\s+(.+?(?:LV-\d{4}|tīklā))/gi)) {
    // «AD» на сайте Virši не расшифровано — не смешиваем его с обычным дизелем при сравнении
    const kind = m[1].toUpperCase() === 'AD' ? { key: 'ad', title: 'Dīzeļdegviela AD' } : fuelKind(m[1]);
    if (!kind) continue;
    out.push({
      variant: `fuel-${m[1]}`,
      kind: 'price',
      fuel: kind.key,
      title: kind.title,
      priceNew: Number(m[2]),
      unitPrice: { value: Number(m[2]), unit: 'l' },
      validFrom: today,
      validTo: today,
      conditions: [`Cena: ${cleanText(m[3])}`],
      url: P.prices,
    });
  }
  return out;
}

export async function scrape({ log, today }) {
  const items = [];
  const errors = [];
  const run = async (url, fn) => {
    try {
      items.push(...fn(await fetchText(url)));
    } catch (err) {
      errors.push(err.message);
    }
  };
  await run(P.fuelPromo, (h) => parseFuelPromos(h));
  await run(P.food, (h) => parseFood(h, today));
  await run(P.partners, (h) => parsePartners(h));
  await run(P.prices, (h) => parsePrices(h, today));
  if (!items.length && errors.length) throw new Error(errors.join('; '));
  log(`virsi: ${items.length} (акции, еда, партнёры, цены)`);
  return items;
}
