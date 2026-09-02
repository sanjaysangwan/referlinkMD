import { ensureDatabase } from "../src/lib/database";

async function main() {
  await ensureDatabase();
  console.log("Database ready at data/referlinkmd.db");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
