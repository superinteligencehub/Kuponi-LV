// Распознавание текста на баннерах акций (АЗС часто публикуют условия только картинкой).
// Картинка готовится в Chromium (выделяем красный/тёмный/светлый текст → ч/б), затем
// Tesseract (lav+eng). Результат кэшируется по URL картинки в data/ocr-cache.json,
// поэтому каждый баннер распознаётся один раз. Без tesseract.js/Playwright — возвращает ''.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fetchBuffer } from './http.js';

const CACHE = fileURLToPath(new URL('../../data/ocr-cache.json', import.meta.url));
let cache;
let worker;

async function loadCache() {
  if (!cache) {
    try {
      cache = JSON.parse(await readFile(CACHE, 'utf8'));
    } catch {
      cache = {};
    }
  }
  return cache;
}

async function variants(buffer, type) {
  const { createRequire } = await import('node:module');
  const { chromium } = createRequire(import.meta.url)('playwright');
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const p = await b.newPage();
    const src = `data:${type};base64,${buffer.toString('base64')}`;
    const urls = await p.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const out = [];
      for (const mode of ['red', 'dark', 'light']) {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const x = c.getContext('2d');
        x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height);
        const a = d.data;
        for (let i = 0; i < a.length; i += 4) {
          const [r, g, bb] = [a[i], a[i + 1], a[i + 2]];
          const ink = mode === 'red' ? r > 140 && g < 110 && bb < 120 : mode === 'dark' ? r + g + bb < 200 : r > 200 && g > 200 && bb > 200;
          a[i] = a[i + 1] = a[i + 2] = ink ? 0 : 255;
          a[i + 3] = 255;
        }
        x.putImageData(d, 0, 0);
        out.push(c.toDataURL('image/png'));
      }
      return out;
    }, src);
    return urls.map((u) => Buffer.from(u.split(',')[1], 'base64'));
  } finally {
    await b.close();
  }
}

export async function ocrImage(url) {
  const c = await loadCache();
  if (c[url] != null) return c[url];
  let text = '';
  try {
    const { default: Tesseract } = await import('tesseract.js');
    const { buffer, type } = await fetchBuffer(url);
    // языковые данные кэшируем в node_modules/.cache, а не в корне репозитория
    worker ??= await Tesseract.createWorker('lav+eng', 1, { cachePath: fileURLToPath(new URL('../../node_modules/.cache/tesseract', import.meta.url)) });
    await worker.setParameters({ tessedit_pageseg_mode: '11' });
    const parts = [];
    for (const img of [buffer, ...(await variants(buffer, type))]) {
      const { data } = await worker.recognize(img);
      parts.push(data.text.replace(/\s+/g, ' ').trim());
    }
    text = parts.join(' | ');
    c[url] = text;
    await writeFile(CACHE, `${JSON.stringify(c, null, 1)}\n`);
  } catch (err) {
    console.warn(`  OCR недоступен для ${url}: ${err.message}`);
  }
  return text;
}

export async function closeOcr() {
  if (worker) await worker.terminate().catch(() => {});
  worker = null;
}
