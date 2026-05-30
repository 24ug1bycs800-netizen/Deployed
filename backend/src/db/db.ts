import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { FallbackDatabase } from './fallbackDb';
import * as schema from './schema';

dotenv.config();

const { Pool } = pg;

export let db: any = null;
export let isFallback = true;
export let fallbackDb = new FallbackDatabase();

if (process.env.DATABASE_URL) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Neon compatibility
    });
    db = drizzle(pool, { schema });
    isFallback = false;
    console.log("Connected successfully to Neon PostgreSQL via Drizzle ORM.");
  } catch (err) {
    console.warn("Failed to connect to Neon PostgreSQL, falling back to local database...", err);
    isFallback = true;
    db = null;
  }
} else {
  console.log("No DATABASE_URL environment variable found. Seamlessly running in local Fallback Database Mode.");
  isFallback = true;
}
