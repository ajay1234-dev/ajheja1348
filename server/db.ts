import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

// PostgreSQL database is no longer used - application now uses Firebase Firestore
// This file is kept for backwards compatibility but will not be initialized
export const db = process.env.DATABASE_URL 
  ? drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema })
  : null as any;

export type Database = typeof db;
