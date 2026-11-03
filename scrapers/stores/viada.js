// Viada: «самые низкие цены на топливо» по сети (таблица на сайте) + скидка с Lidl Plus /
// приложением Viada, опубликованная баннером на странице «LIDL PLUS lietotne» (читаем OCR).
import * as cheerio from 'cheerio';
import { fetchText } from '../lib/http.js';
import { fuelKind, parseFuelPromo } from '../lib/fuel.js';
import { ocrImage } from '../lib/ocr.js';
import { cleanText, parsePrice } from '../lib/util.js';

const BASE = 'https://www.viada.lv';
const PRICES = `${BASE}/zemakas-degvielas-cenas/`;
const LIDL = `${BASE}/lidl-plus-lietotne/`;

export function parsePrices(html, today) {
  const $ = cheerio.load(html);
  const best = new Map();
  $('table tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 3) return;
    const icon = $(tds[0]).find('img').attr('src') ?? $(tds[0]).text();
    const kind = fuelKind(icon.split('/').pop().replace(/_new\.\w+$/, '').replace(/^petrol_/, ''));
    const price = parsePrice($(tds[1]).text());
    if (!kind || !price) return;
    const stations = $(tds[2]).find('.dus-name').map((__, s) => cleanText($(s).text())).get();
    if (!best.has(kind.key) || price < best.get(kind.key).price) best.set(kind.key, { kind, price, stations });
  });
  return [...best.values()].map(({ kind, price, stations }) => ({
    variant: `fuel-${kind.key}`,
    kind: 'price',
    fuel: kind.key,
    title: `${kind.title} — zemākā cena`,
    priceNew: price,
    unitPrice: { value: price, unit: 'l' },
    validFrom: today,
    validTo: today,
    conditions: [`Zemākā cena Viada tīklā: ${stations.slice(0, 4).join(', ')}${stations.length > 4 ? '…' : ''}`, 'Cenām ir informatīvs raksturs'],
    url: PRICES,
  }));
}

export async function lidlPlusOffer(html) {
  const $ = cheerio.load(html);
  const banners = $('.the_content_wrapper img[src]').map((_, i) => $(i).attr('src')).get().filter((s) => !/ld\d|instruk/i.test(s));
  if (!banners.length) return null;
  const banner = banners[0];
  const ocr = await ocrImage(banner);
  const promo = parseFuelPromo(ocr);
  const conditions = [
    promo.cents ? `Atlaide degvielai -${promo.cents} centi/l${promo.days.length ? ` (${promo.days.join(', ')})` : ''}` : 'Aktuālā atlaide — skatīt attēlā (baneris)',
    'Lidl Plus lietotnē: Partneru piedāvājumi → Viada → «Izmantot piedāvājumu» → QR kods pie kases',
    'Atlaide arī ar Viada lietotni vai Viada Plus karti',
  ];
  return {
    variant: `lidlplus-${banner}`,
    kind: 'coupon',
    title: promo.cents ? `Degviela -${promo.cents} centi/l ar Lidl Plus vai Viada lietotni` : 'Viada atlaide ar Lidl Plus lietotni',
    badge: promo.cents ? `−${promo.cents} c/л` : 'Lidl Plus',
    conditions,
    requires: ['app:lidlplus', 'app:viada'],
    url: LIDL,
    image: banner,
  };
}

export async function scrape({ log, today }) {
  // Viada ограничивает частые запросы (HTTP 503) — каждая часть собирается независимо.
  const items = [];
  const errors = [];
  try {
    const o = await lidlPlusOffer(await fetchText(LIDL, { retries: 3 }));
    if (o) items.push(o);
  } catch (err) {
    errors.push(`Lidl Plus: ${err.message}`);
  }
  try {
    items.push(...parsePrices(await fetchText(PRICES, { retries: 3 }), today));
  } catch (err) {
    errors.push(`цены: ${err.message}`);
  }
  if (!items.length) throw new Error(errors.join('; '));
  if (errors.length) log(`viada: частично (${errors.join('; ')})`);
  log(`viada: ${items.length} (цены + акции)`);
  return items;
}
