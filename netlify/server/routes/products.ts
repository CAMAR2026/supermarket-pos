import { Router } from "express";
import { asc, eq, ilike, or } from "drizzle-orm";
import { db, products, categories } from "../../../db/index.js";
import { authorize, protect } from "../lib/auth.js";
import { badRequest, idParam, likePattern, notFound, optionalId, queryStr, str, toBool, toNumber } from "../lib/http.js";
import { findProduct, isLowStock, isOutOfStock, productRows, selectProducts, where } from "../lib/queries.js";
import { saveUpload, upload } from "../lib/uploads.js";

const router = Router();
router.use(protect);

const ensureCategory = async (value: unknown) => {
  const id = optionalId(value);
  if (!id) throw badRequest("Select a valid category.");
  const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, id));
  if (!category) throw badRequest("Select a valid category.");
  return id;
};

const nonNegative = (value: unknown, message: string, fallback = 0) => {
  const n = toNumber(value, fallback);
  if (!Number.isFinite(n) || n < 0) throw badRequest(message);
  return n;
};

router.get("/", async (req, res) => {
  const search = queryStr(req, "search");
  const category = optionalId(queryStr(req, "category"));
  const stock = queryStr(req, "stock");
  const pattern = likePattern(search);

  const rows = await selectProducts()
    .where(
      where([
        search ? or(ilike(products.name, pattern), ilike(products.sku, pattern), ilike(products.barcode, pattern)) : undefined,
        category ? eq(products.categoryId, category) : undefined,
        stock === "low" ? isLowStock() : undefined,
        stock === "out" ? isOutOfStock() : undefined,
      ])
    )
    .orderBy(asc(products.name));
  res.json(productRows(rows));
});

router.get("/:id", async (req, res) => {
  const product = await findProduct(idParam(req.params.id, "Product"));
  if (!product) throw notFound("Product not found.");
  res.json(product);
});

router.post("/", authorize("admin", "stock_manager"), upload.single("image"), async (req, res) => {
  const body = req.body ?? {};
  const name = str(body.name);
  const sku = str(body.sku).toUpperCase();
  if (!name || !sku || !body.category) throw badRequest("Name, SKU and category are required.");

  const purchasePrice = nonNegative(body.purchasePrice, "Prices cannot be negative.");
  const sellingPrice = nonNegative(body.sellingPrice, "Prices cannot be negative.");
  const quantity = nonNegative(body.quantity, "Quantity cannot be negative.");
  if (!Number.isInteger(quantity)) throw badRequest("Quantity must be a whole number.");
  const lowStockThreshold = Math.floor(nonNegative(body.lowStockThreshold, "Low-stock threshold cannot be negative.", 10));
  const categoryId = await ensureCategory(body.category);
  const image = req.file ? await saveUpload(req.file) : "";

  const [created] = await db
    .insert(products)
    .values({
      name,
      sku,
      barcode: str(body.barcode),
      categoryId,
      purchasePrice,
      sellingPrice,
      quantity,
      unit: str(body.unit) || "pcs",
      lowStockThreshold,
      image,
    })
    .returning({ id: products.id });

  res.status(201).json(await findProduct(created.id));
});

router.put("/:id", authorize("admin", "stock_manager"), upload.single("image"), async (req, res) => {
  const id = idParam(req.params.id, "Product");
  const body = req.body ?? {};
  const changes: Partial<typeof products.$inferInsert> = {};

  if (body.name !== undefined) changes.name = str(body.name);
  if (body.sku !== undefined) changes.sku = str(body.sku).toUpperCase();
  if (changes.name === "" || changes.sku === "") throw badRequest("Name and SKU are required.");
  if (body.barcode !== undefined) changes.barcode = str(body.barcode);
  if (body.unit !== undefined) changes.unit = str(body.unit) || "pcs";
  if (body.category !== undefined) changes.categoryId = await ensureCategory(body.category);
  if (body.purchasePrice !== undefined) changes.purchasePrice = nonNegative(body.purchasePrice, "Prices cannot be negative.");
  if (body.sellingPrice !== undefined) changes.sellingPrice = nonNegative(body.sellingPrice, "Prices cannot be negative.");
  if (body.lowStockThreshold !== undefined) {
    changes.lowStockThreshold = Math.floor(nonNegative(body.lowStockThreshold, "Low-stock threshold cannot be negative.", 10));
  }
  if (body.isActive !== undefined) changes.isActive = toBool(body.isActive);
  if (req.file) changes.image = await saveUpload(req.file);

  if (Object.keys(changes).length) {
    const [updated] = await db.update(products).set(changes).where(eq(products.id, id)).returning({ id: products.id });
    if (!updated) throw notFound("Product not found.");
  }
  const product = await findProduct(id);
  if (!product) throw notFound("Product not found.");
  res.json(product);
});

router.delete("/:id", authorize("admin"), async (req, res) => {
  const id = idParam(req.params.id, "Product");
  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
  if (!deleted) throw notFound("Product not found.");
  res.json({ message: "Product deleted." });
});

export default router;
