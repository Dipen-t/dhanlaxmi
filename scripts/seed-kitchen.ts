import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { seedKitchenDishes } from "@/db/seed-kitchen-dishes";

async function main() {
  await seedKitchenDishes();
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
