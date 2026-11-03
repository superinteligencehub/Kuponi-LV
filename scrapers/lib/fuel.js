// Виды топлива: единые названия для сравнения цен между сетями АЗС и разбор топливных акций.

/** «95miles», «95E», «petrol_95ecto», «DD», «Dmiles+», «LPG» → { key, title } */
export function fuelKind(raw) {
  const s = String(raw ?? '').toLowerCase().replace(/[_-]/g, ' ');
  if (/ad ?blue/.test(s)) return { key: 'adblue', title: 'AdBlue' };
  if (/lpg|auto ?g[aā]z|\bgas\b|propan/.test(s)) return { key: 'lpg', title: 'Autogāze (LPG)' };
  if (/cbg|cng|biometān|biometan/.test(s)) return { key: 'cbg', title: 'Biometāns (CBG)' };
  if (/98/.test(s)) return { key: '98', title: 'Benzīns 98' };
  if (/95/.test(s)) {
    const plus = /plus|\+|premium|ecto ?plus|miles ?\+/.test(s);
    return plus ? { key: '95p', title: 'Benzīns 95 (premium)' } : { key: '95', title: 'Benzīns 95' };
  }
  if (/(^|\s)(d|dd|dīz|diz|diesel|dmiles)/.test(s) || /\bd\b/.test(s)) {
    const plus = /plus|\+|premium|pro|ecto ?plus|miles ?\+|arktisk|arctic|ziemas/.test(s);
    return plus ? { key: 'dp', title: 'Dīzeļdegviela (premium)' } : { key: 'd', title: 'Dīzeļdegviela' };
  }
  return null;
}

const DAYS = [
  [/pirmdien/i, 'pirmdienās'], [/otrdien/i, 'otrdienās'], [/trešdien|tresdien/i, 'trešdienās'], [/ceturtdien/i, 'ceturtdienās'],
  [/piektdien/i, 'piektdienās'], [/sestdien/i, 'sestdienās'], [/svētdien|svetdien/i, 'svētdienās'],
];

/** «-10 centi litrā … piektdienās, sestdienās, svētdienās» → { cents: 10, days: [...] } */
export function parseFuelPromo(text) {
  const t = String(text ?? '').replace(/\s+/g, ' ');
  const m = t.match(/[-–]?\s?(\d{1,2}(?:[.,]\d)?)\s?(?:c|centi|centu|centus|ct)\s?(?:\/\s?l|litrā|uz litru|par litru|katram (?:degvielas )?litram)/i)
    ?? t.match(/[-–]\s?(\d{1,2})\b[^0-9]{0,40}centi[^0-9]{0,10}litr/i)
    ?? t.match(/(\d{1,2})\s?centi\/l/i)
    // OCR баннеров переставляет блоки: «centi litrā Sveiki! -10»
    ?? t.match(/centi\s*litr\w*[^0-9]{0,40}[-–]\s?(\d{1,2})\b/i);
  const days = DAYS.filter(([re]) => re.test(t)).map(([, d]) => d);
  if (/nedēļas nogal|brīvdien/i.test(t) && !days.length) days.push('piektdienās', 'sestdienās', 'svētdienās');
  return { cents: m ? Number(String(m[1]).replace(',', '.')) : null, days };
}
