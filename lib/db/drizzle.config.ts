import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  // Do not crash during local development when DATABASE_URL is not present.
  // Migration commands should still set DATABASE_URL when needed.
  // eslint-disable-next-line no-console
  console.warn("DATABASE_URL is not set; drizzle config will be incomplete.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
