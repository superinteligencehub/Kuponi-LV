// Domino's Pizza Latvija: страница меню содержит JSON (window.app_props) с ценами:
// у акционных товаров есть old_price; слайды акций могут содержать coupon_code.
import { fetchText } from '../lib/http.js';
import { offerFromText, ogMeta } from '../lib/promo.js';

const PAGE = 'https://dominospizza.lv/lv/riga/';

export function parseProps(html) {
  const m = html.match(/window\.app_props = JSON\.parse\('(.*?)'\);/s);
  if (!m) throw new Error('Domino\'s: не найден JSON меню (изменилась разметка)');
  return JSON.parse(m[1].replace(/\\u([0-9a-fA-F]{4})/g, (_, x) => String.fromCharCode(parseInt(x, 16))));
}

const walk = (o, f) => {
  if (Array.isArray(o)) o.forEach((x) => walk(x, f));
  else if (o && typeof o === 'object') {
    f(o);
    Object.values(o).forEach((x) => walk(x, f));
  }
};

export function parseDeals(props) {
  const out = [];
  walk(props, (o) => {
    if (!o.name || !o.link || !o.sizes) return;
    let best = null;
    let bestSize = '';
    for (const s of o.sizes) {
      walk(s, (x) => {
        const p = x.product;
        if (p?.old_price > p?.price && (!best || p.old_price - p.price > best.old_price - best.price)) {
          best = p;
          bestSize = s.name;
        }
      });
    }
    if (!best) return;
    out.push({
      variant: o.link,
      title: o.name,
      priceNew: best.price,
      priceOld: best.old_price,
      conditions: [o.description_toppings, bestSize && bestSize !== 'Combo' ? `Izmērs: ${bestSize}` : '', 'Cena Rīgā, pasūtot dominospizza.lv'].filter(Boolean),
      url: o.link,
      image: o.image?.['480'] ?? o.image?.full,
    });
  });
  return [...new Map(out.map((x) => [x.variant, x])).values()];
}

export async function scrape({ log, today }) {
  const html = await fetchText(PAGE);
  const props = parseProps(html);
  const items = parseDeals(props);
  for (const s of props.data?.slides ?? []) {
    if (!s.link) continue;
    let title = s.text_1 || s.name;
    let text = s.text_2 || '';
    try {
      const news = await fetchText(s.link, { retries: 0 });
      title = ogMeta(news, 'og:title') || title;
      text = ogMeta(news, 'og:description') || text;
    } catch {
      /* без подробностей */
    }
    const o = offerFromText({ title, text: `${text}${s.coupon_code ? ` Promokods: ${s.coupon_code}` : ''}`, url: s.link, image: s.image, today });
    if (o) {
      if (s.coupon_code) Object.assign(o, { kind: 'coupon', conditions: [...o.conditions, `Promokods: ${s.coupon_code}`] });
      items.push(o);
    }
  }
  log(`dominos: ${items.length} предложений`);
  return items;
}
