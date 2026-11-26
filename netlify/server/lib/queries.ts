import { and, eq, gt, lte, type SQL } from "drizzle-orm";
import { db, products, categories, sales, users, customers } from "../../../db/index.js";
import { productOut, saleOut } from "./serialize.js";

export const isLowStock = () => lte(products.quantity, products.lowStockThreshold);
export const isLowButInStock = () => and(isLowStock(), gt(products.quantity, 0));
export const isOutOfStock = () => eq(products.quantity, 0);

/** Products joined with their category name, shaped like the original populated documents. */
export const selectProducts = () =>
  db
    .select({ product: products, category: { id: categories.id, name: categories.name } })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .$dynamic();

export const productRows = (rows: { product: Record<string, any>; category: Record<string, any> | null }[]) =>
  rows.map((r) => productOut(r.product, r.category));

export const findProduct = async (id: number) => {
  const [row] = await selectProducts().where(eq(products.id, id));
  return row ? productOut(row.product, row.category) : null;
};

/** Sales joined with cashier and customer, shaped like populated documents. */
export const selectSales = () =>
  db
    .select({
      sale: sales,
      cashier: { id: users.id, name: users.name, email: users.email, role: users.role },
      customer: { id: customers.id, name: customers.name, phone: customers.phone, email: customers.email },
    })
    .from(sales)
    .leftJoin(users, eq(sales.cashierId, users.id))
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .$dynamic();

export const saleRows = (rows: { sale: Record<string, any>; cashier: any; customer: any }[]) =>
  rows.map((r) => saleOut(r.sale, r.cashier, r.customer));

export const findSale = async (id: number) => {
  const [row] = await selectSales().where(eq(sales.id, id));
  return row ? saleOut(row.sale, row.cashier, row.customer) : null;
};

export const where = (conditions: (SQL | undefined)[]) => {
  const list = conditions.filter(Boolean) as SQL[];
  return list.length ? and(...list) : undefined;
};
