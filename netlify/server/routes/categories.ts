import { Router } from "express";
import { asc, count, eq, getColumns } from "drizzle-orm";
import { db, categories, products } from "../../../db/index.js";
import { authorize, protect } from "../lib/auth.js";
import { badRequest, idParam, notFound, str } from "../lib/http.js";
import { withId } from "../lib/serialize.js";

const router = Router();
router.use(protect);

router.get("/", async (_req, res) => {
  const rows = await db
    .select({ ...getColumns(categories), productCount: count(products.id) })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));
  res.json(rows.map(withId));
});

router.post("/", authorize("admin", "stock_manager"), async (req, res) => {
  const name = str(req.body?.name);
  if (!name) throw badRequest("Category name is required.");
  const [category] = await db
    .insert(categories)
    .values({ name, description: str(req.body?.description) })
    .returning();
  res.status(201).json(withId(category));
});

router.put("/:id", authorize("admin", "stock_manager"), async (req, res) => {
  const id = idParam(req.params.id, "Category");
  const changes: Partial<typeof categories.$inferInsert> = {};
  if (req.body?.name !== undefined) {
    changes.name = str(req.body.name);
    if (!changes.name) throw badRequest("Category name is required.");
  }
  if (req.body?.description !== undefined) changes.description = str(req.body.description);

  const [category] = Object.keys(changes).length
    ? await db.update(categories).set(changes).where(eq(categories.id, id)).returning()
    : await db.select().from(categories).where(eq(categories.id, id));
  if (!category) throw notFound("Category not found.");
  res.json(withId(category));
});

router.delete("/:id", authorize("admin"), async (req, res) => {
  const id = idParam(req.params.id, "Category");
  const [{ inUse }] = await db.select({ inUse: count() }).from(products).where(eq(products.categoryId, id));
  if (inUse > 0) throw badRequest(`Cannot delete category. ${inUse} product(s) still use it.`);
  const [category] = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });
  if (!category) throw notFound("Category not found.");
  res.json({ message: "Category deleted." });
});

export default router;
