import http from 'http';
import { app } from './src/app.js';
import { initDb } from './src/database/db.js';

process.env.NODE_ENV = 'test';

let server;
const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}/api`;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${path}`);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    let data = null;
    if (body) {
      data = typeof body === 'string' ? body : JSON.stringify(body);
      reqHeaders['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(resBody);
          } catch {
            parsed = resBody;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n==================================================');
  console.log(' RUNNING ECOTEX BACKEND INTEGRATION TEST SUITE');
  console.log('==================================================\n');

  await initDb();
  server = app.listen(PORT);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  let authToken = null;
  let testProductId = null;
  let testOrderId = null;
  let testQuoteId = null;

  try {
    // 1. Health Check
    await test('GET /api/health returns healthy status and system metrics', async () => {
      const res = await request('GET', '/health');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.body.status !== 'healthy') throw new Error(`Expected healthy, got ${res.body.status}`);
      if (!res.body.system || !res.body.database) throw new Error('Missing telemetry data');
    });

    // 2. Auth Login
    await test('POST /api/auth/login authenticates admin & returns JWT', async () => {
      const res = await request('POST', '/auth/login', {
        username: 'admin@ecotexinc.com',
        password: 'admin',
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      if (!res.body.token) throw new Error('Missing token in response');
      authToken = res.body.token;
    });

    // 3. Auth Profile
    await test('GET /api/auth/me verifies Bearer token', async () => {
      const res = await request('GET', '/auth/me', null, {
        Authorization: `Bearer ${authToken}`,
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!res.body.user) throw new Error('Missing user payload');
    });

    // 4. Stats
    await test('GET /api/stats returns executive dashboard metrics', async () => {
      const res = await request('GET', '/stats');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (typeof res.body.totalProducts !== 'number') throw new Error('Invalid stats format');
    });

    // 5. Products List
    await test('GET /api/products returns product catalog', async () => {
      const res = await request('GET', '/products');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body)) throw new Error('Expected array of products');
    });

    // 6. Products Create
    await test('POST /api/products creates a new packaging model', async () => {
      const res = await request('POST', '/products', {
        name: 'Automated Test Non-Woven Tote',
        category: 'non-woven',
        categoryLabel: 'Non-Woven Totes',
        pricePerUnit: 0.35,
        moq: 1000,
        gsm: 90,
      });
      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
      if (!res.body.id) throw new Error('Product created without id');
      testProductId = res.body.id;
    });

    // 7. Products Toggle Stock
    await test('PATCH /api/products/:id/toggle-stock toggles availability', async () => {
      const res = await request('PATCH', `/products/${testProductId}/toggle-stock`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    // 8. Products Delete
    await test('DELETE /api/products/:id deletes created test product', async () => {
      const res = await request('DELETE', `/products/${testProductId}`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    // 9. Categories
    await test('GET /api/categories returns packaging categories', async () => {
      const res = await request('GET', '/categories');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body)) throw new Error('Expected categories array');
    });

    // 10. Orders Creation
    await test('POST /api/orders creates a commercial purchase order', async () => {
      const res = await request('POST', '/orders', {
        buyerName: 'Enterprise Test Buyer',
        companyName: 'Apex Global Retail',
        subtotal: 500,
        shipping: 50,
        total: 550,
        items: [{ productName: 'Eco Loop Bag', quantity: 2000, unitPrice: 0.25, totalPrice: 500 }],
      });
      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      testOrderId = res.body.id;
    });

    // 11. Order Status Update
    await test('PATCH /api/orders/:id/status updates order status', async () => {
      const res = await request('PATCH', `/orders/${testOrderId}/status`, {
        status: 'In Production',
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.body.status !== 'In Production') throw new Error('Status not updated');
    });

    // 12. Quotes Creation
    await test('POST /api/quotes submits custom volume RFQ', async () => {
      const res = await request('POST', '/quotes', {
        name: 'Procurement Director',
        company: 'California Marts',
        email: 'buyer@calmart.com',
        volume: '25,000 units',
        printing: '2-Color Flexo',
      });
      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      testQuoteId = res.body.id;
    });

    // 13. Settings Read & Update
    await test('GET & PUT /api/settings manages site configuration', async () => {
      const getRes = await request('GET', '/settings');
      if (getRes.status !== 200) throw new Error(`Expected 200, got ${getRes.status}`);

      const putRes = await request('PUT', '/settings', {
        tagline: 'Certified Sustainable Wholesale Packaging Direct From Manufacturer',
      });
      if (putRes.status !== 200) throw new Error(`Expected 200, got ${putRes.status}`);
    });

    // 14. Image Upload (Base64)
    await test('POST /api/upload accepts and stores base64 image data', async () => {
      // 1x1 transparent PNG pixel base64
      const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const res = await request('POST', '/upload', {
        data: sampleBase64,
        filename: 'test-pixel.png',
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!res.body.url || !res.body.url.startsWith('/uploads/')) {
        throw new Error(`Unexpected upload response URL: ${res.body.url}`);
      }
    });

  } finally {
    server.close();
  }

  console.log('\n==================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
