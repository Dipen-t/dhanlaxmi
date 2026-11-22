import postgres from '../node_modules/postgres/src/index.js';

const sql = postgres('postgresql://neondb_owner:npg_Q4gM7oZspzei@ep-lingering-star-aomx3ak9-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require', { ssl: 'require' });

try {
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer2_name text`;
  console.log('Added customer2_name');
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer2_phone text`;
  console.log('Added customer2_phone');
  console.log('Migration complete!');
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
} finally {
  await sql.end();
}
