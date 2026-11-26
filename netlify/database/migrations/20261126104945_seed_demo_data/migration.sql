-- Demo data so the POS is usable right after the first deploy.
-- Change the demo account passwords from the Users page before real use.

INSERT INTO "users" ("name", "email", "password_hash", "role", "phone") VALUES
  ('Store Owner', 'admin@supermarket.com', '$2b$10$blsWv7WtvyB4YJHFUAvjkOdUyJ06I7pM23mswezCtaA0eURrIShSK', 'admin', '0700000001'),
  ('Jane Cashier', 'cashier@supermarket.com', '$2b$10$R.1AILpMyirtdorW.k92fOL9LIPFUIAiqXVQJYF3enPpML7qaqz4y', 'cashier', '0700000002'),
  ('Peter Stock', 'stock@supermarket.com', '$2b$10$2XUr80TCZzPeRS/1P1pVfe/rjOEW/dI6BCohtHZwCnXgBo/ZJubGu', 'stock_manager', '0700000003')
ON CONFLICT ("email") DO NOTHING;
--> statement-breakpoint
INSERT INTO "categories" ("name", "description") VALUES
  ('Beverages', 'Drinks and juices'),
  ('Food', 'Packaged and dry foods'),
  ('Electronics', 'Small electronics'),
  ('Cosmetics', 'Personal care'),
  ('Household items', 'Cleaning and home'),
  ('Fruits and vegetables', 'Fresh produce')
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("name", "sku", "barcode", "category_id", "purchase_price", "selling_price", "quantity")
SELECT p.name, p.sku, p.barcode, c.id, p.purchase_price, p.selling_price, p.quantity
FROM (VALUES
  ('Coca-Cola 500ml', 'DRK001', '123456789', 'Beverages', 50, 70, 100),
  ('Bread', 'FD001', '111111111', 'Food', 50, 70, 40),
  ('Milk 500ml', 'FD002', '222222222', 'Food', 50, 65, 35),
  ('Sugar 2kg', 'FD003', '333333333', 'Food', 140, 180, 50),
  ('Cooking Oil 1L', 'FD004', '444444444', 'Food', 220, 280, 8),
  ('Maize Flour 2kg', 'FD005', '555555555', 'Food', 150, 190, 60),
  ('Bottled Water 1L', 'DRK002', '666666666', 'Beverages', 30, 50, 80),
  ('Bar Soap', 'HH001', '777777777', 'Household items', 40, 60, 25),
  ('Toothpaste', 'COS001', '888888888', 'Cosmetics', 90, 130, 18),
  ('Bananas (bunch)', 'FR001', '999999999', 'Fruits and vegetables', 80, 120, 12),
  ('USB Flash Drive 32GB', 'EL001', '101010101', 'Electronics', 450, 650, 6),
  ('Rice 5kg', 'FD006', '121212121', 'Food', 650, 780, 0)
) AS p(name, sku, barcode, category, purchase_price, selling_price, quantity)
JOIN "categories" c ON c.name = p.category
ON CONFLICT ("sku") DO NOTHING;
--> statement-breakpoint
INSERT INTO "customers" ("name", "phone", "email", "address") VALUES
  ('Walk-in Regular', '0711111111', 'regular@example.com', ''),
  ('Mary Wanjiku', '0722222222', '', 'Nairobi')
ON CONFLICT ("phone") DO NOTHING;
--> statement-breakpoint
INSERT INTO "settings" ("id", "store_name", "address", "phone", "currency", "tax_rate", "receipt_footer", "low_stock_threshold")
VALUES (1, 'FreshMart Supermarket', 'Moi Avenue, Nairobi', '020 123 4567', 'KSh', 0, 'Goods once sold are not returnable. Karibu tena!', 10)
ON CONFLICT ("id") DO NOTHING;
