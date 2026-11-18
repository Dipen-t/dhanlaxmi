ALTER TABLE "order_raw_materials" ADD COLUMN IF NOT EXISTS "timing" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "material_order" integer[];--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
