import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.NODE_ENV === 'test' 
  ? process.env.TEST_DATABASE_URL 
  : process.env.DATABASE_URL;

const isProduction = process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString,
  ...(isProduction && { ssl: { rejectUnauthorized: false } }),
});

pool.on('error', (err: Error) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
  // Remove process.exit(1) to avoid crashing the whole server on intermittent DB errors
});
