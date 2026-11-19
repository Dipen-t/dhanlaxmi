CREATE TABLE IF NOT EXISTS "order_whatsapp_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE cascade,
	"recipient_kind" text NOT NULL,
	"vendor_id" integer REFERENCES "vendors"("id") ON DELETE set null,
	"recipient_name" text NOT NULL,
	"phone" text NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"last_error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"attempt_token" text,
	"dedupe_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_whatsapp_messages_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
