import { Router } from "express";
import { asc, eq, ilike, or } from "drizzle-orm";
import { db, customers } from "../../../db/index.js";
import { authorize, protect } from "../lib/auth.js";
import { badRequest, idParam, likePattern, notFound, queryStr, str } from "../lib/http.js";
import { withId } from "../lib/serialize.js";

const router = Router();
router.use(protect);

const FIELDS = ["name", "phone", "email", "address", "notes"] as const;

router.get("/", async (req, res) => {
  const search = queryStr(req, "search");
  const pattern = likePattern(search);
  const rows = await db
    .select()
    .from(customers)
    .where(
      search
        ? or(ilike(customers.name, pattern), ilike(customers.phone, pattern), ilike(customers.email, pattern))
        : undefined
    )
    .orderBy(asc(customers.name));
  res.json(rows.map(withId));
});

router.post("/", authorize("admin", "cashier"), async (req, res) => {
  const values = Object.fromEntries(FIELDS.map((f) => [f, str(req.body?.[f])])) as Record<(typeof FIELDS)[number], string>;
  if (!values.name || !values.phone) throw badRequest("Name and phone are required.");
  values.email = values.email.toLowerCase();
  const [customer] = await db.insert(customers).values(values).returning();
  res.status(201).json(withId(customer));
});

router.put("/:id", authorize("admin", "cashier"), async (req, res) => {
  const id = idParam(req.params.id, "Customer");
  const changes: Partial<typeof customers.$inferInsert> = {};
  for (const f of FIELDS) if (req.body?.[f] !== undefined) changes[f] = str(req.body[f]);
  if (changes.email) changes.email = changes.email.toLowerCase();
  if (changes.name === "" || changes.phone === "") throw badRequest("Name and phone are required.");

  const [customer] = Object.keys(changes).length
    ? await db.update(customers).set(changes).where(eq(customers.id, id)).returning()
    : await db.select().from(customers).where(eq(customers.id, id));
  if (!customer) throw notFound("Customer not found.");
  res.json(withId(customer));
});

router.delete("/:id", authorize("admin"), async (req, res) => {
  const id = idParam(req.params.id, "Customer");
  const [customer] = await db.delete(customers).where(eq(customers.id, id)).returning({ id: customers.id });
  if (!customer) throw notFound("Customer not found.");
  res.json({ message: "Customer deleted." });
});

export default router;
