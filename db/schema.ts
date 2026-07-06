import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const deliveryLocationEnum = pgEnum("delivery_location", [
  "venue",
  "godown",
]);

export const mealTypeEnum = pgEnum("meal_type", [
  "breakfast",
  "lunch",
  "dinner",
]);

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  deliveryLocation: deliveryLocationEnum("delivery_location").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rawMaterials = pgTable("raw_materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  vendorId: integer("vendor_id").references(() => vendors.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  date: timestamp("date", { mode: "date" }).notNull(),
  venue: text("venue").notNull(),
  numberOfPersons: integer("number_of_persons").notNull(),
  mealType: mealTypeEnum("meal_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dishCategories = pgTable("dish_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  selectionRule: text("selection_rule").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const dishes = pgTable("dishes", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => dishCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const menus = pgTable("menus", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const menuCategories = pgTable(
  "menu_categories",
  {
    menuId: integer("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => dishCategories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.menuId, table.categoryId] })],
);

export const dishCategoriesRelations = relations(dishCategories, ({ many }) => ({
  dishes: many(dishes),
  menuCategories: many(menuCategories),
}));

export const dishesRelations = relations(dishes, ({ one }) => ({
  category: one(dishCategories, {
    fields: [dishes.categoryId],
    references: [dishCategories.id],
  }),
}));

export const menusRelations = relations(menus, ({ many }) => ({
  menuCategories: many(menuCategories),
}));

export const menuCategoriesRelations = relations(menuCategories, ({ one }) => ({
  menu: one(menus, {
    fields: [menuCategories.menuId],
    references: [menus.id],
  }),
  category: one(dishCategories, {
    fields: [menuCategories.categoryId],
    references: [dishCategories.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  rawMaterials: many(rawMaterials),
}));

export const rawMaterialsRelations = relations(rawMaterials, ({ one }) => ({
  vendor: one(vendors, {
    fields: [rawMaterials.vendorId],
    references: [vendors.id],
  }),
}));
