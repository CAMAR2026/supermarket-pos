import { Router } from "express";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db, products, inventoryLogs, users, sales, settings } from "../../../db/index.js";
import { authorize, protect } from "../lib/auth.js";
import { badRequest, idParam, notFound, optionalId, queryStr, str, toNumber } from "../lib/http.js";
import { findProduct, isLowButInStock, isOutOfStock, productRows, selectProducts } from "../lib/queries.js";
import { inventoryOut } from "../lib/serialize.js";

const router = Router();
router.use(protect, authorize("admin", "stock_manager"));

router.get("/", async (req, res) => {
  const stock = queryStr(req, "stock");
  const filter = stock === "out" ? isOutOfStock() : stock === "low" ? isLowButInStock() : undefined;

  const [all, lowStock, outOfStock, [store]] = await Promise.all([
    selectProducts().where(filter).orderBy(asc(products.name)),
    selectProducts().where(isLowButInStock()).orderBy(asc(products.quantity)),
    selectProducts().where(isOutOfStock()).orderBy(asc(products.name)),
    db.select({ lowStockThreshold: settings.lowStockThreshold }).from(settings).where(eq(settings.id, 1)),
  ]);

  res.json({
    threshold: store?.lowStockThreshold ?? 10,
    products: productRows(all),
    lowStock: productRows(lowStock),
    outOfStock: productRows(outOfStock),
  });
});

const TYPES = ["receive", "sale", "adjustment", "refund"];

router.get("/history", async (req, res) => {
  const productId = optionalId(queryStr(req, "product"));
  const type = queryStr(req, "type");

  const conditions = [];
  if (productId) conditions.push(eq(inventoryLogs.productId, productId));
  if (TYPES.includes(type)) conditions.push(eq(inventoryLogs.type, type));

  const rows = await db
    .select({
      log: inventoryLogs,
      product: { id: products.id, name: products.name, sku: products.sku },
      user: { id: users.id, name: users.name, role: users.role },
      sale: { id: sales.id, receiptNumber: sales.receiptNumber },
    })
    .from(inventoryLogs)
    .leftJoin(products, eq(inventoryLogs.productId, products.id))
    .leftJoin(users, eq(inventoryLogs.userId, users.id))
    .leftJoin(sales, eq(inventoryLogs.saleId, sales.id))
    .where(conditions.length ? sql.join(conditions, sql` and `) : undefined)
    .orderBy(desc(inventoryLogs.createdAt), desc(inventoryLogs.id))
    .limit(500);

  res.json(rows.map((r) => inventoryOut(r.log, r.product, r.user, r.sale)));
});

router.put("/:id", async (req, res) => {
  const id = idParam(req.params.id, "Product");
  const type = str(req.body?.type);
  const qty = toNumber(req.body?.quantity, NaN);

  if (!["receive", "adjustment"].includes(type)) throw badRequest("Type must be receive or adjustment.");
  if (!Number.isInteger(qty) || qty === 0) throw badRequest("Enter a valid whole-number quantity.");
  if (type === "receive" && qty < 0) throw badRequest("Received quantity must be positive.");

  const log = await db.transaction(async (tx) => {
    const [product] = await tx.select().from(products).where(eq(products.id, id)).for("update");
    if (!product) throw notFound("Product not found.");

    const previousQuantity = product.quantity;
    const newQuantity = previousQuantity + qty;
    if (newQuantity < 0) throw badRequest("Adjustment would result in negative stock.");

    await tx.update(products).set({ quantity: newQuantity }).where(eq(products.id, id));
    const [entry] = await tx
      .insert(inventoryLogs)
      .values({
        productId: id,
        type,
        quantityChange: qty,
        previousQuantity,
        newQuantity,
        reason: str(req.body?.reason) || (type === "receive" ? "Stock received" : "Manual adjustment"),
        userId: req.user!.id,
      })
      .returning();
    return entry;
  });

  res.json({ product: await findProduct(id), log: inventoryOut(log, null, null, null) });
});

export default router;
