const PUSH_URL = 'https://keine.appify.kz/api/rates_receive.php';
const PUSH_KEY = process.env.PUSH_KEY;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const SLUGS = [
  'cash-rub-to-bitcoin-msk',
  'cash-rub-to-ethereum',
  'cash-rub-to-ltc',
  'cash-rub-to-doge',
  'cash-rub-to-xmr',
  'cash-rub-to-trx',
  'cash-rub-to-not',
  'cash-rub-to-op',
  'cash-rub-to-bnb',
  'cash-rub-to-etc',
  'cash-rub-to-usdt-kazani-tatarstan',
  'cash-rub-crypto-bep-ekb',
  'cash-rub-to-erc20-usdc',
  'cash-rub-to-bep20-usdc',
  'cash-usd-to-btc',
  'cash-usd-to-eth',
  'cash-usd-to-ltc',
  'cash-usd-to-doge',
  'cash-usd-to-xmr',
  'cash-usd-to-trx',
  'cash-usd-to-etc',
  'cash-usd-to-not',
  'cash-usd-to-op',
  'cash-usd-to-usdt',
  'cash-usd-to-erc20-usdt',
  'cash-usd-to-erc20-usdc',
  'cash-usd-to-bep20-usdc',
  'cash-usd-to-erc20-dai',
  'cash-usd-to-bep20-dai',
  'cash-eur-to-doge',
  'cash-eur-to-ltc',
  'cash-eur-to-xmr',
  'cash-eur-to-trx6',
  'cash-eur-to-not',
  'cash-eur-to-op',
  'cash-eur-to-etc',
  'cash-eur-to-erc20-dai3',
  'cash-eur-to-bep20-dai',
  'cash-eur-to-erc20-usdt',
  'cash-eur-to-trc20-usdt',
  'cashaed-to-usdttrc20',
  'usdt-to-cash-rub-msk',
  'usdttrc20-to-cashaed',
  'usdttrc20-to-sberrub',
  'usdttrc20-to-sbprub',
  'usdttrc20-to-tcsbrub',
  'usdterc20-to-cashrub',
  'bep20-usdc-to-cash-rub',
  'erc20-usdc-to-cash-rub',
  'bitcoin-to-cash-usd',
  'xmr-to-cash-usd',
  'ltc-to-cash-rub',
  'bnb-to-cash-rub',
];

function extractVal(html, className) {
  const re1 = new RegExp(`class="${className}"[^>]*value="([^"]*)"`, 'i');
  const re2 = new RegExp(`value="([^"]*)"[^>]*class="${className}"`, 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? m[1].trim() : null;
}

function extractCourse(html) {
  const m = html.match(/class="js_course_html"[^>]*>([^<]+)<\/span>/i)
           || html.match(/<span[^>]*js_course_html[^>]*>([^<]+)<\/span>/i);
  return m ? m[1].trim() : null;
}

async function fetchSlug(slug) {
  const url = `https://keine-exchange.com/exchange-${slug}/`;
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'ru-RU,ru;q=0.9' },
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) return { url, give: null, get: null, course_text: null, min: null, error: `HTTP ${resp.status}` };
    const html = await resp.text();
    return {
      url,
      course_text: extractCourse(html),
      give: extractVal(html, 'js_curs_give_html'),
      get:  extractVal(html, 'js_curs_get_html'),
      min:  extractVal(html, 'js_amount_min'),
    };
  } catch (e) {
    return { url, give: null, get: null, course_text: null, min: null, error: e.message };
  }
}

async function main() {
  if (!PUSH_KEY) { console.error('PUSH_KEY not set'); process.exit(1); }
  console.log(`Fetching ${SLUGS.length} slugs...`);
  const rows = await Promise.all(SLUGS.map(fetchSlug));
  const ok  = rows.filter(r => !r.error).length;
  const bad = rows.filter(r => r.error);
  console.log(`OK: ${ok}/${rows.length}`);
  if (bad.length) bad.forEach(r => console.log(`  FAIL: ${r.url} — ${r.error}`));
  const payload = JSON.stringify({ rows, generated: new Date().toISOString(), cached: false });
  const resp = await fetch(PUSH_URL, {
    method: 'POST',
    body: payload,
    headers: { 'Content-Type': 'application/json', 'X-Push-Key': PUSH_KEY },
    signal: AbortSignal.timeout(15000),
  });
  console.log(`Push: ${resp.status}`);
  if (!resp.ok) { console.error(await resp.text()); process.exit(1); }
}

main().catch(e => { console.error(e); process.exit(1); });
