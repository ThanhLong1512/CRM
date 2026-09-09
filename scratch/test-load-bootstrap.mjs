import { loadRemixBootstrap } from '../src/lib/remix/load-bootstrap.ts';

console.log('Testing loadRemixBootstrap performance and connection stability...');

const startTime = Date.now();
try {
  const result = await loadRemixBootstrap();
  const duration = Date.now() - startTime;
  console.log(`[PASS] loadRemixBootstrap completed successfully in ${duration}ms!`);
  console.log(`- Products: ${result.products.length}`);
  console.log(`- Customers: ${result.customers.length}`);
  console.log(`- Orders: ${result.orders.length}`);
  console.log(`- Vehicles: ${result.vehicles.length}`);
  console.log(`- Drum Txns: ${result.drumTransactions.length}`);
  console.log(`- Staff: ${result.staffUsers.length}`);
  console.log(`- Dashboard KPIs revenueMtd: ${result.dashboard.kpis.revenueMtd.toLocaleString('vi-VN')} đ`);
  console.log(`- Drum Stats totalOutstanding: ${result.drumStats.totalOutstanding} drums`);
  console.log(`- RFM Customers scored: ${result.rfm.customers.length}`);

  console.log('\nTesting 3 concurrent calls to verify connection pool limit safety...');
  const t0 = Date.now();
  await Promise.all([
    loadRemixBootstrap(),
    loadRemixBootstrap(),
    loadRemixBootstrap(),
  ]);
  console.log(`[PASS] 3 concurrent bootstrap calls finished in ${Date.now() - t0}ms with ZERO pool timeouts!`);
} catch (err) {
  console.error('[FAIL]', err);
  process.exit(1);
}
