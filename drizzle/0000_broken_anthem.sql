CREATE TYPE "public"."delivery_location" AS ENUM('venue', 'godown');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner');--> statement-breakpoint
CREATE TABLE "dish_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"selection_rule" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "dish_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "dishes" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kitchen_menu_dishes" (
	"kitchen_menu_id" integer NOT NULL,
	"dish_id" integer NOT NULL,
	CONSTRAINT "kitchen_menu_dishes_kitchen_menu_id_dish_id_pk" PRIMARY KEY("kitchen_menu_id","dish_id")
);
--> statement-breakpoint
CREATE TABLE "kitchen_menus" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_categories" (
	"menu_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "menu_categories_menu_id_category_id_pk" PRIMARY KEY("menu_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_raw_materials" (
	"order_id" integer NOT NULL,
	"raw_material_id" integer NOT NULL,
	"vendor_id" integer,
	"unit_qty" text NOT NULL,
	"unit_name" text NOT NULL,
	CONSTRAINT "order_raw_materials_order_id_raw_material_id_pk" PRIMARY KEY("order_id","raw_material_id")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"venue" text NOT NULL,
	"number_of_persons" integer NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "raw_material_vendors" (
	"raw_material_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	CONSTRAINT "raw_material_vendors_raw_material_id_vendor_id_pk" PRIMARY KEY("raw_material_id","vendor_id")
);
--> statement-breakpoint
CREATE TABLE "raw_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "raw_materials_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"delivery_location" "delivery_location" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_category_id_dish_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."dish_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_menu_dishes" ADD CONSTRAINT "kitchen_menu_dishes_kitchen_menu_id_kitchen_menus_id_fk" FOREIGN KEY ("kitchen_menu_id") REFERENCES "public"."kitchen_menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_menu_dishes" ADD CONSTRAINT "kitchen_menu_dishes_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_category_id_dish_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."dish_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_raw_materials" ADD CONSTRAINT "order_raw_materials_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_raw_materials" ADD CONSTRAINT "order_raw_materials_raw_material_id_raw_materials_id_fk" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_raw_materials" ADD CONSTRAINT "order_raw_materials_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_material_vendors" ADD CONSTRAINT "raw_material_vendors_raw_material_id_raw_materials_id_fk" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_material_vendors" ADD CONSTRAINT "raw_material_vendors_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;