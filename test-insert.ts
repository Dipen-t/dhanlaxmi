import { config } from "dotenv";
config({ path: ".env" });
import { db } from "./db";
import { orders } from "./db/schema";

async function test() {
  try {
    console.log("Attempting insert...");
    const [newOrder] = await db.insert(orders).values({
      orderId: "ORD-TEST",
      date: new Date(),
      venue: "test",
      numberOfPersons: 100,
      mealType: "dinner",
    }).returning({ id: orders.id });
    console.log("Inserted:", newOrder);
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = err as any;
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
    console.log("Error code:", e?.code);
    console.log("Full error:", e);
  }
}

test().catch(console.error);
