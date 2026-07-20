import { db } from "../db";
import { orderPayments, vendorPayments, orders } from "../db/schema";

async function run() {
  const allOrders = await db.query.orders.findMany({
    with: {
      orderPayments: true,
      vendorPayments: true,
    }
  });
  console.log(JSON.stringify(allOrders, null, 2));
}
run();
