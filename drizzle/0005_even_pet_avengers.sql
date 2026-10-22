CREATE TABLE "order_menu_dishes" (
	"order_id" integer NOT NULL,
	"dish_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "order_menu_dishes_order_id_dish_id_pk" PRIMARY KEY("order_id","dish_id")
);
--> statement-breakpoint
CREATE TABLE "order_menu_selections" (
	"order_id" integer PRIMARY KEY NOT NULL,
	"menu_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_menu_dishes" ADD CONSTRAINT "order_menu_dishes_order_id_order_menu_selections_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order_menu_selections"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_menu_dishes" ADD CONSTRAINT "order_menu_dishes_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_menu_selections" ADD CONSTRAINT "order_menu_selections_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_menu_selections" ADD CONSTRAINT "order_menu_selections_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;