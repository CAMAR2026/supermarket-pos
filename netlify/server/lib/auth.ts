import { randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, users, appSecrets } from "../../../db/index.js";
import { HttpError } from "./http.js";

export type Role = "admin" | "cashier" | "stock_manager";
export const ROLES: Role[] = ["admin", "cashier", "stock_manager"];

export type AuthUser = typeof users.$inferSelect;

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

let cachedSecret: string | null = null;

/**
 * Uses JWT_SECRET when configured; otherwise generates one random signing key and keeps it
 * in the database so every server instance (and every deploy) signs tokens the same way.
 */
const getSecret = async () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (cachedSecret) return cachedSecret;
  await db
    .insert(appSecrets)
    .values({ key: "jwt_secret", value: randomBytes(48).toString("base64url") })
    .onConflictDoNothing();
  const [row] = await db.select().from(appSecrets).where(eq(appSecrets.key, "jwt_secret"));
  cachedSecret = row.value;
  return cachedSecret;
};

export const signToken = async (id: number) =>
  jwt.sign({ id }, await getSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"],
  });

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized. Token missing." });
  }

  let id: number;
  try {
    const decoded = jwt.verify(header.slice(7), await getSecret()) as { id: number };
    id = Number(decoded.id);
  } catch {
    return res.status(401).json({ message: "Not authorized. Invalid token." });
  }

  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) return res.status(401).json({ message: "User no longer exists." });
  if (!user.isActive) return res.status(403).json({ message: "Account is deactivated." });

  req.user = user;
  next();
};

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      return next(new HttpError(403, "You do not have permission for this action."));
    }
    next();
  };
