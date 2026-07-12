import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let poolInstance: pg.Pool | undefined;
let dbInstance: unknown;

if (process.env.DATABASE_URL) {
  poolInstance = new Pool({ connectionString: process.env.DATABASE_URL });
  dbInstance = drizzle(poolInstance, { schema });
} else {
  // In development we allow running the server without a database configured.
  // Export a placeholder that surfaces a clear error if used.
  // This keeps the API process up while preventing accidental DB calls.
  // Production/migration workflows should still set DATABASE_URL.
  // eslint-disable-next-line no-console
  console.warn(
    "DATABASE_URL is not set; database functionality is disabled for local development.",
  );

  dbInstance = new Proxy(
    {},
    {
      get(_target, prop) {
        throw new Error(
          `Database not configured (DATABASE_URL missing). Tried to access \"${String(
            prop,
          )}\". Set DATABASE_URL to enable DB operations.`,
        );
      },
    },
  );
}

export const pool = poolInstance;
export const db = dbInstance as any;

export * from "./schema";
