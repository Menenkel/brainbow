import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Check if using SQLite or PostgreSQL
const isPostgres = process.env.DATABASE_URL.startsWith('postgres');
const isSQLite = process.env.DATABASE_URL.startsWith('file:');

if (!isPostgres && !isSQLite) {
  throw new Error("DATABASE_URL must start with 'postgres' or 'file:'");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: isPostgres ? "postgresql" : "sqlite",
  dbCredentials: isPostgres ? {
    url: process.env.DATABASE_URL,
  } : {
    url: process.env.DATABASE_URL.replace('file:', ''),
  },
});
