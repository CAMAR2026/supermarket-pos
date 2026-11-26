CREATE TABLE "categories" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"phone" text NOT NULL UNIQUE,
	"email" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_logs" (
	"id" serial PRIMARY KEY,
	"product_id" integer,
	"type" text NOT NULL,
	"quantity_change" integer NOT NULL,
	"previous_quantity" integer NOT NULL,
	"new_quantity" integer NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"user_id" integer,
	"sale_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"sku" text NOT NULL UNIQUE,
	"barcode" text DEFAULT '' NOT NULL,
	"category_id" integer NOT NULL,
	"purchase_price" numeric(12,2) NOT NULL,
	"selling_price" numeric(12,2) NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"low_stock_threshold" integer DEFAULT 10 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY,
	"receipt_number" text NOT NULL UNIQUE,
	"cashier_id" integer,
	"customer_id" integer,
	"items" jsonb NOT NULL,
	"subtotal" numeric(12,2) NOT NULL,
	"discount" numeric(12,2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(12,2) DEFAULT '0' NOT NULL,
	"tax" numeric(12,2) DEFAULT '0' NOT NULL,
	"total" numeric(12,2) NOT NULL,
	"payment_method" text NOT NULL,
	"mpesa_reference" text DEFAULT '' NOT NULL,
	"amount_paid" numeric(12,2) NOT NULL,
	"change" numeric(12,2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"store_name" text DEFAULT 'SuperMarket POS' NOT NULL,
	"logo" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"currency" text DEFAULT 'KSh' NOT NULL,
	"tax_rate" numeric(12,2) DEFAULT '0' NOT NULL,
	"receipt_footer" text DEFAULT 'Thank you for shopping with us!' NOT NULL,
	"low_stock_threshold" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'cashier' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_lower_idx" ON "categories" (lower("name"));--> statement-breakpoint
CREATE INDEX "inventory_logs_created_at_idx" ON "inventory_logs" ("created_at");--> statement-breakpoint
CREATE INDEX "inventory_logs_product_created_idx" ON "inventory_logs" ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "products_barcode_idx" ON "products" ("barcode");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" ("category_id");--> statement-breakpoint
CREATE INDEX "sales_created_at_idx" ON "sales" ("created_at");--> statement-breakpoint
CREATE INDEX "sales_cashier_created_idx" ON "sales" ("cashier_id","created_at");--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_sale_id_sales_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_cashier_id_users_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL;