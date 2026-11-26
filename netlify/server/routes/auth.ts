import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db, users } from "../../../db/index.js";
import { authorize, protect, ROLES, signToken, type Role } from "../lib/auth.js";
import { badRequest, str } from "../lib/http.js";
import { userOut } from "../lib/serialize.js";

const router = Router();

router.post("/login", async (req, res) => {
  const email = str(req.body?.email).toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!email || !password) throw badRequest("Email and password are required.");

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  if (!user.isActive) {
    return res.status(403).json({ message: "Account is deactivated. Contact an administrator." });
  }

  res.json({ token: await signToken(user.id), user: userOut(user) });
});

router.post("/register", protect, authorize("admin"), async (req, res) => {
  const name = str(req.body?.name);
  const email = str(req.body?.email).toLowerCase();
  const password = String(req.body?.password ?? "");
  const role = (str(req.body?.role) || "cashier") as Role;
  if (!name || !email || !password) throw badRequest("Name, email and password are required.");
  if (password.length < 6) throw badRequest("Password must be at least 6 characters.");
  if (!ROLES.includes(role)) throw badRequest("Invalid role.");

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: count === 0 ? "admin" : role,
      phone: str(req.body?.phone),
    })
    .returning();

  res.status(201).json({ user: userOut(user) });
});

router.get("/me", protect, (req, res) => {
  res.json({ user: userOut(req.user!) });
});

export default router;
