ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "per_plate_amount" integer;
--> statement-breakpoint
ALTER TABLE "kitchen_menu_dishes" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
