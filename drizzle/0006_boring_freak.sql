ALTER TABLE "order_menu_dishes" DROP CONSTRAINT "order_menu_dishes_order_id_order_menu_selections_order_id_fk";
--> statement-breakpoint
DROP TABLE "order_menu_selections";--> statement-breakpoint
ALTER TABLE "order_menu_dishes" ADD CONSTRAINT "order_menu_dishes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
