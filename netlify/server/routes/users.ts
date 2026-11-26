import { Router } from "express";
import bcrypt from "bcryptjs";
import { desc, eq } from "drizzle-orm";
import { db, users } from "../../../db/index.js";
import { authorize, protect, ROLES, type Role } from "../lib/auth.js";
import { badRequest, idParam, notFound, str, toBool } from "../lib/http.js";
import { userOut } from "../lib/serialize.js";

const router = Router();
router.use(protect, authorize("admin"));

router.get("/", async (_req, res) => {
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));
  res.json(rows.map(userOut));
});

router.get("/:id", async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, idParam(req.params.id, "User")));
  if (!user) throw notFound("User not found.");
  res.json(userOut(user));
});

router.post("/", async (req, res) => {
  const name = str(req.body?.name);
  const email = str(req.body?.email).toLowerCase();
  const password = String(req.body?.password ?? "");
  const role = (str(req.body?.role) || "cashier") as Role;
  if (!name || !email || !password) throw badRequest("Name, email and password are required.");
  if (password.length < 6) throw badRequest("Password must be at least 6 characters.");
  if (!ROLES.includes(role)) throw badRequest("Invalid role.");

  const [user] = await db
    .insert(users)
    .values({ name, email, role, phone: str(req.body?.phone), passwordHash: await bcrypt.hash(password, 10) })
    .returning();
  res.status(201).json(userOut(user));
});

router.put("/:id", async (req, res) => {
  const id = idParam(req.params.id, "User");
  const body = req.body ?? {};
  const changes: Partial<typeof users.$inferInsert> = {};

  if (body.name !== undefined) changes.name = str(body.name);
  if (body.email !== undefined) changes.email = str(body.email).toLowerCase();
  if (body.phone !== undefined) changes.phone = str(body.phone);
  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) throw badRequest("Invalid role.");
    changes.role = body.role;
  }
  if (body.isActive !== undefined) changes.isActive = toBool(body.isActive);
  if (body.password) {
    if (String(body.password).length < 6) throw badRequest("Password must be at least 6 characters.");
    changes.passwordHash = await bcrypt.hash(String(body.password), 10);
  }

  if (id === req.user!.id && (changes.isActive === false || (changes.role && changes.role !== "admin"))) {
    throw badRequest("You cannot deactivate or demote your own account.");
  }
  if (changes.name === "" || changes.email === "") throw badRequest("Name and email cannot be empty.");

  const [user] = Object.keys(changes).length
    ? await db.update(users).set(changes).where(eq(users.id, id)).returning()
    : await db.select().from(users).where(eq(users.id, id));
  if (!user) throw notFound("User not found.");
  res.json(userOut(user));
});

router.delete("/:id", async (req, res) => {
  const id = idParam(req.params.id, "User");
  if (id === req.user!.id) throw badRequest("You cannot delete your own account.");
  const [user] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  if (!user) throw notFound("User not found.");
  res.json({ message: "User deleted." });
});

export default router;
