import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initNeonSchema, saveAllCollectionsToNeon, loadAllCollectionsFromNeon } from './src/database/neon.js';
import config from './src/config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('====================================================');
  console.log(' STARTING MIGRATION TO NEON POSTGRESQL');
  console.log('====================================================');

  try {
    // 1. Initialize schema
    console.log('1. Initializing Neon PostgreSQL tables & schemas...');
    await initNeonSchema();
    console.log('   ✓ Neon tables created/verified successfully.');

    // 2. Read local db.json
    console.log('2. Reading local db.json data...');
    const dbPath = path.join(__dirname, 'db.json');
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const dbData = JSON.parse(raw);

    console.log(`   Found collections in db.json:`);
    for (const key of Object.keys(dbData)) {
      const count = Array.isArray(dbData[key]) ? dbData[key].length : 'object';
      console.log(`   - ${key}: ${count}`);
    }

    // 3. Migrate into Neon
    console.log('3. Uploading all collections to Neon PostgreSQL...');
    await saveAllCollectionsToNeon(dbData);
    console.log('   ✓ All collections uploaded successfully to Neon!');

    // 4. Verify by loading back from Neon
    console.log('4. Verifying migrated data from Neon PostgreSQL...');
    const loaded = await loadAllCollectionsFromNeon();
    if (!loaded) {
      throw new Error('Verification failed: Could not load data back from Neon');
    }

    console.log('   Verification Results from Neon:');
    for (const key of Object.keys(loaded)) {
      const count = Array.isArray(loaded[key]) ? loaded[key].length : 'object';
      console.log(`   - ${key}: ${count}`);
    }

    console.log('====================================================');
    console.log(' MIGRATION COMPLETED SUCCESSFULLY! ');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed with error:', err);
    process.exit(1);
  }
}

runMigration();
