import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL ?? process.env.NEON_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  return url;
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const queryClient = postgres(getDatabaseUrl(), { prepare: false });

export const db = drizzle(queryClient, { schema });
