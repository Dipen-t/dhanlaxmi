CREATE TABLE "app_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"expires_on" date,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
