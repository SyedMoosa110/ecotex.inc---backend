import dns from 'dns';
import pg from 'pg';

// Set public reliable DNS servers to prevent local ISP resolution failure
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  console.warn('Could not set custom DNS servers:', e);
}

const connectionString = 'postgresql://neondb_owner:npg_W3FynXtmqlc5@ep-sparkling-band-b4621xgb-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

const { Pool } = pg;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('Testing connection to Neon PostgreSQL with 8.8.8.8 DNS...');
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as current_time, version()');
    console.log('Connection SUCCESSFUL!');
    console.log('Current time:', res.rows[0].current_time);
    console.log('PostgreSQL version:', res.rows[0].version);
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Connection FAILED:', err);
    process.exit(1);
  }
}

testConnection();
