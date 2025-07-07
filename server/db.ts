import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isPostgres = process.env.DATABASE_URL.startsWith('postgres');
const isSQLite = process.env.DATABASE_URL.startsWith('file:');

let db: any;
let pool: any = null;

if (isPostgres) {
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
} else if (isSQLite) {
  const dbPath = process.env.DATABASE_URL.replace('file:', '');
  const sqlite = new Database(dbPath);
  db = drizzleSQLite(sqlite, { schema });
  pool = null; // SQLite doesn't use a connection pool
} else {
  throw new Error("DATABASE_URL must start with 'postgres' or 'file:'");
}

export { db, pool };