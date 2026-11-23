ALTER TABLE "order_payment_expenses" ADD COLUMN IF NOT EXISTS "order_id" integer;--> statement-breakpoint
UPDATE "order_payment_expenses" AS ope
SET "order_id" = op."order_id"
FROM "order_payments" AS op
WHERE ope."order_payment_id" = op."id" AND ope."order_id" IS NULL;--> statement-breakpoint
DELETE FROM "order_payment_expenses" WHERE "order_id" IS NULL;--> statement-breakpoint
ALTER TABLE "order_payment_expenses" ALTER COLUMN "order_id" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "order_payment_expenses"
    ADD CONSTRAINT "order_payment_expenses_order_id_orders_id_fk"
    FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "order_payment_expenses" ALTER COLUMN "order_payment_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_payment_expenses" DROP CONSTRAINT IF EXISTS "order_payment_expenses_order_payment_id_order_payments_id_fk";--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "order_payment_expenses"
    ADD CONSTRAINT "order_payment_expenses_order_payment_id_order_payments_id_fk"
    FOREIGN KEY ("order_payment_id") REFERENCES "public"."order_payments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
