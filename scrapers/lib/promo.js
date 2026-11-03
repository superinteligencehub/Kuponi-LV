// Акции-«баннеры» кафе и фастфуда: заголовок + текст условий (часто без старой цены).
// Из текста достаём цену («tikai par 2,95 €»), процент («20% atlaidi», «-50%»),
// срок («līdz 30.11.»), промокод и признаки «2 по цене 1».

import { cleanText, parsePrice, parseLvRange, rigaDate } from './util.js';

const PRICE = /(\d{1,3}(?:[.,]\d{2}))\s*€|€\s*(\d{1,3}[.,]\d{2})|(\d{1,3})\s*€/g;

export function offerFromText({ title, text = '', url, image, today = rigaDate(), extra = {} }) {
  const t = cleanText(title).replace(/\s*[-–|]\s*(KFC|Burger King®?|Domino'?s.*)$/i, '');
  const body = cleanText(text);
  if (!t) return null;
  const all = `${t} ${body}`;
  const prices = [...all.matchAll(PRICE)].map((m) => parsePrice(m[1] ?? m[2] ?? m[3])).filter((n) => n > 0 && n < 200);
  const pct = all.match(/(\d{1,2})\s?%\s*(atlaid|lētāk|izdevīg)/i) ?? all.match(/-\s?(\d{1,2})\s?%/) ?? all.match(/(\d{1,2})\s?%/);
  const until = all.match(/līdz\s+(\d{1,2}\.\d{1,2}\.(?:\d{4}\.?)?)/i);
  const code = all.match(/(?:kod[su]|promo ?kod[su]|kupon[su]?)\s*[:\-–]?\s*[«"„]?([A-Z0-9]{4,16})\b/);
  // Только реальные акции: цена, скидка, «2 по цене 1», подарок, промокод или явное «akcija/piedāvājums».
  // Чисто рекламные слайды («Roku darbs») и текст на литовском (общий сайт KFC) отбрасываем.
  if (/[ąęėįų]/i.test(all)) return null;
  const promoWord = /akcij|atlaid|piedāvāj|dāvan|bezmaksas|par brīvu|tāpat|izdevīg|ietaup|tikai par|lojalit|kupon|promokod|uzkrāj|bonus|punkt|centi|2 par 1|1\s?\+\s?1|lētāk|cena/i.test(all);
  if (!prices.length && !pct && !promoWord) return null;
  const conditions = [];
  if (body) conditions.push(body.length > 400 ? `${body.slice(0, 397)}…` : body);
  if (/pērc\s+(vienu|1)\b.*(otr|2\.)|otru saņem|2\s?(par|по)\s?1|1\s?\+\s?1/i.test(all)) conditions.push('2 par 1 / otrā prece dāvanā');
  if (code) conditions.push(`Promokods: ${code[1]}`);
  return {
    kind: code ? 'coupon' : 'offer',
    variant: url ? `${url}#${t}` : t,
    title: t,
    priceNew: prices.length ? Math.min(...prices) : null,
    ...(pct ? { savingPct: Number(pct[1]) } : {}),
    ...(until ? { validTo: parseLvRange(until[1], today).to } : {}),
    conditions,
    url,
    image,
    ...extra,
  };
}

export const ogMeta = (html, prop) => html.match(new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]*)"`, 'i'))?.[1] ?? html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="${prop}"`, 'i'))?.[1] ?? '';
