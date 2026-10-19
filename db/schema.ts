import { relations } from "drizzle-orm";
import { boolean } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  date: timestamp("date", { mode: "date" }).notNull(),
  venue: text("venue").notNull(),
  numberOfPersons: integer("number_of_persons").notNull(),
  extraPlates: integer("extra_plates").notNull().default(0),
  perPlateAmount: integer("per_plate_amount"),
  mealType: mealTypeEnum("meal_type").notNull(),
  totalAmount: integer("total_amount"),
  isPaymentAmount: boolean("is_payment_amount").notNull().default(false),
  discount: text("discount"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderPayments = pgTable("order_payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  date: timestamp("date", { mode: "date" }).notNull(),
  isWaived: boolean("is_waived").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vendorPayments = pgTable("vendor_payments", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),
  orderId: integer("order_id")
    .references(() => orders.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  date: timestamp("date", { mode: "date" }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderPaymentExpenses = pgTable("order_payment_expenses", {
  id: serial("id").primaryKey(),
  orderPaymentId: integer("order_payment_id")
    .notNull()
    .references(() => orderPayments.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  date: timestamp("date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rawMaterialVendors = pgTable(
  "raw_material_vendors",
  {
    rawMaterialId: integer("raw_material_id")
      .notNull()
      .references(() => rawMaterials.id, { onDelete: "cascade" }),
    vendorId: integer("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.rawMaterialId, table.vendorId] })]
);

export const orderRawMaterials = pgTable(
  "order_raw_materials",
  {
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    rawMaterialId: integer("raw_material_id")
      .notNull()
      .references(() => rawMaterials.id, { onDelete: "cascade" }),
    vendorId: integer("vendor_id").references(() => vendors.id, {
      onDelete: "set null",
    }),
    unitQty: text("unit_qty").notNull(),
    unitName: text("unit_name").notNull(),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.orderId, table.rawMaterialId] })]
);

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

export const kitchenDishCategories = pgTable("kitchen_dish_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  selectionRule: text("selection_rule").notNull(),
  isQtyField: boolean("is_qty_field").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const kitchenDishes = pgTable("kitchen_dishes", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => kitchenDishCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const kitchenMenus = pgTable("kitchen_menus", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  venue: text("venue"),
  date: timestamp("date"),
  deliveryTime: text("delivery_time"),
  numberOfPersons: integer("number_of_persons"),
  mealType: text("meal_type", { enum: ["Lunch", "Dinner"] }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kitchenMenuDishes = pgTable(
  "kitchen_menu_dishes",
  {
    kitchenMenuId: integer("kitchen_menu_id")
      .notNull()
      .references(() => kitchenMenus.id, { onDelete: "cascade" }),
    kitchenDishId: integer("kitchen_dish_id")
      .notNull()
      .references(() => kitchenDishes.id, { onDelete: "cascade" }),
    quantity: text("quantity"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.kitchenMenuId, table.kitchenDishId] })]
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
  rawMaterialVendors: many(rawMaterialVendors),
  vendorPayments: many(vendorPayments),
}));

export const rawMaterialsRelations = relations(rawMaterials, ({ many }) => ({
  rawMaterialVendors: many(rawMaterialVendors),
  orderRawMaterials: many(orderRawMaterials),
}));

export const rawMaterialVendorsRelations = relations(rawMaterialVendors, ({ one }) => ({
  rawMaterial: one(rawMaterials, {
    fields: [rawMaterialVendors.rawMaterialId],
    references: [rawMaterials.id],
  }),
  vendor: one(vendors, {
    fields: [rawMaterialVendors.vendorId],
    references: [vendors.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  orderRawMaterials: many(orderRawMaterials),
  orderPayments: many(orderPayments),
  vendorPayments: many(vendorPayments),
}));

export const orderPaymentsRelations = relations(orderPayments, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderPayments.orderId],
    references: [orders.id],
  }),
  expenses: many(orderPaymentExpenses),
}));

export const orderPaymentExpensesRelations = relations(orderPaymentExpenses, ({ one }) => ({
  orderPayment: one(orderPayments, {
    fields: [orderPaymentExpenses.orderPaymentId],
    references: [orderPayments.id],
  }),
}));

export const vendorPaymentsRelations = relations(vendorPayments, ({ one }) => ({
  order: one(orders, {
    fields: [vendorPayments.orderId],
    references: [orders.id],
  }),
  vendor: one(vendors, {
    fields: [vendorPayments.vendorId],
    references: [vendors.id],
  }),
}));

export const orderRawMaterialsRelations = relations(orderRawMaterials, ({ one }) => ({
  order: one(orders, {
    fields: [orderRawMaterials.orderId],
    references: [orders.id],
  }),
  rawMaterial: one(rawMaterials, {
    fields: [orderRawMaterials.rawMaterialId],
    references: [rawMaterials.id],
  }),
  vendor: one(vendors, {
    fields: [orderRawMaterials.vendorId],
    references: [vendors.id],
  }),
}));

export const kitchenDishCategoriesRelations = relations(kitchenDishCategories, ({ many }) => ({
  kitchenDishes: many(kitchenDishes),
}));

export const kitchenDishesRelations = relations(kitchenDishes, ({ one, many }) => ({
  category: one(kitchenDishCategories, {
    fields: [kitchenDishes.categoryId],
    references: [kitchenDishCategories.id],
  }),
  kitchenMenuDishes: many(kitchenMenuDishes),
}));

export const kitchenMenusRelations = relations(kitchenMenus, ({ many }) => ({
  kitchenMenuDishes: many(kitchenMenuDishes),
}));

export const kitchenMenuDishesRelations = relations(kitchenMenuDishes, ({ one }) => ({
  kitchenMenu: one(kitchenMenus, {
    fields: [kitchenMenuDishes.kitchenMenuId],
    references: [kitchenMenus.id],
  }),
  kitchenDish: one(kitchenDishes, {
    fields: [kitchenMenuDishes.kitchenDishId],
    references: [kitchenDishes.id],
  }),
}));

export const pdfTemplates = pgTable("pdf_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  themeType: text("theme_type").notNull().default("standard"),
  fontFamily: text("font_family").notNull().default("SourceSans"),
  fontSize: text("font_size").notNull().default("10pt"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
