import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: "number" });

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable("users", {
  id: serial().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text().notNull().default("cashier"),
  phone: text().notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const categories = pgTable(
  "categories",
  {
    id: serial().primaryKey(),
    name: text().notNull(),
    description: text().notNull().default(""),
    ...timestamps,
  },
  (t) => [uniqueIndex("categories_name_lower_idx").on(sql`lower(${t.name})`)]
);

export const products = pgTable(
  "products",
  {
    id: serial().primaryKey(),
    name: text().notNull(),
    sku: text().notNull().unique(),
    barcode: text().notNull().default(""),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    purchasePrice: money("purchase_price").notNull(),
    sellingPrice: money("selling_price").notNull(),
    quantity: integer().notNull().default(0),
    unit: text().notNull().default("pcs"),
    image: text().notNull().default(""),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("products_barcode_idx").on(t.barcode), index("products_category_idx").on(t.categoryId)]
);

export const customers = pgTable("customers", {
  id: serial().primaryKey(),
  name: text().notNull(),
  phone: text().notNull().unique(),
  email: text().notNull().default(""),
  address: text().notNull().default(""),
  notes: text().notNull().default(""),
  ...timestamps,
});

export type SaleItem = {
  product: number | null;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export const sales = pgTable(
  "sales",
  {
    id: serial().primaryKey(),
    receiptNumber: text("receipt_number").notNull().unique(),
    cashierId: integer("cashier_id").references(() => users.id, { onDelete: "set null" }),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    items: jsonb().$type<SaleItem[]>().notNull(),
    subtotal: money("subtotal").notNull(),
    discount: money("discount").notNull().default(0),
    taxRate: money("tax_rate").notNull().default(0),
    tax: money("tax").notNull().default(0),
    total: money("total").notNull(),
    paymentMethod: text("payment_method").notNull(),
    mpesaReference: text("mpesa_reference").notNull().default(""),
    amountPaid: money("amount_paid").notNull(),
    change: money("change").notNull().default(0),
    status: text().notNull().default("completed"),
    notes: text().notNull().default(""),
    ...timestamps,
  },
  (t) => [
    index("sales_created_at_idx").on(t.createdAt),
    index("sales_cashier_created_idx").on(t.cashierId, t.createdAt),
  ]
);

export const inventoryLogs = pgTable(
  "inventory_logs",
  {
    id: serial().primaryKey(),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    type: text().notNull(),
    quantityChange: integer("quantity_change").notNull(),
    previousQuantity: integer("previous_quantity").notNull(),
    newQuantity: integer("new_quantity").notNull(),
    reason: text().notNull().default(""),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    saleId: integer("sale_id").references(() => sales.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("inventory_logs_created_at_idx").on(t.createdAt),
    index("inventory_logs_product_created_idx").on(t.productId, t.createdAt),
  ]
);

export const settings = pgTable("settings", {
  id: integer().primaryKey().default(1),
  storeName: text("store_name").notNull().default("SuperMarket POS"),
  logo: text().notNull().default(""),
  address: text().notNull().default(""),
  phone: text().notNull().default(""),
  currency: text().notNull().default("KSh"),
  taxRate: money("tax_rate").notNull().default(0),
  receiptFooter: text("receipt_footer").notNull().default("Thank you for shopping with us!"),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
  ...timestamps,
});

// Server-generated secrets (e.g. the JWT signing key when JWT_SECRET isn't set).
export const appSecrets = pgTable("app_secrets", {
  key: text().primaryKey(),
  value: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
