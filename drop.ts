import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_Q4gM7oZspzei@ep-lingering-star-aomx3ak9-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
sql`DROP TABLE IF EXISTS pdf_templates;`.then(() => console.log('Dropped'));
