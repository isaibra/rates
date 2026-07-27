// GitHub Actions вызывает Beget (Россия), Beget скрапит keine-exchange.com
// Beget не блокируется keine-exchange.com, GitHub Actions не блокируется Beget

const BEGET_URL = 'http://a70030k8.beget.tech/keine/fetch_rates.php';
const KEY = process.env.PUSH_KEY;

async function main() {
  if (!KEY) { console.error('PUSH_KEY not set'); process.exit(1); }

  const url = `${BEGET_URL}?key=${encodeURIComponent(KEY)}`;
  console.log('Triggering Beget fetch_rates.php...');

  const resp = await fetch(url, {
    signal: AbortSignal.timeout(90000),
  });
  const text = await resp.text();
  console.log(`HTTP: ${resp.status}`);
  console.log(text);

  let data;
  try { data = JSON.parse(text); } catch(e) { console.error('Bad JSON'); process.exit(1); }
  if (!data.ok) { process.exit(1); }
  console.log(`Done: ${data.rows} pairs, push_status=${data.push_status}`);
}

main().catch(e => { console.error(e); process.exit(1); });
