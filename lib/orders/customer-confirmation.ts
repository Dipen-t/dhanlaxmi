import { normalizeWhatsAppHubPhone, type sendBookingConfirmation } from "@/lib/whatsapp";

type CustomerOrder = {
  customerPhone: string | null;
  customerName: string | null;
  date: string;
  venue: string;
  mealType: string;
};
type Result = Awaited<ReturnType<typeof sendBookingConfirmation>>;

export async function sendOrderCustomerConfirmation(
  orderId: number,
  loadOrder: (id: string) => Promise<CustomerOrder | null>,
  send: typeof sendBookingConfirmation,
): Promise<Result> {
  if (!Number.isSafeInteger(orderId) || orderId <= 0) return { error: "Invalid order." };
  const order = await loadOrder(String(orderId));
  if (!order) return { error: "Order not found." };
  const phone = normalizeWhatsAppHubPhone(order.customerPhone ?? "");
  if (!phone) return { error: "Add a valid customer phone number by editing this order first." };
  return send({
    phone,
    customerName: order.customerName || "Customer",
    eventDate: order.date.split("-").reverse().join("/"),
    eventVenue: order.venue,
    meal: order.mealType,
    menuDishes: "",
    fallbackMessage: "",
  });
}
