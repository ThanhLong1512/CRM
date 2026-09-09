const pages = [
  'http://localhost:3020/dashboard',
  'http://localhost:3020/san-pham',
  'http://localhost:3020/don-hang',
  'http://localhost:3020/khach-hang',
  'http://localhost:3020/vo-phuy',
  'http://localhost:3020/fleet',
  'http://localhost:3020/sales',
];

for (const url of pages) {
  try {
    const res = await fetch(url);
    console.log(`[HTTP ${res.status}] ${url}`);
  } catch (err) {
    console.error(`[ERROR] ${url}:`, err.message);
  }
}
