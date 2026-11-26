import type { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const notFound = (message: string) => new HttpError(404, message);

/** Parse a numeric route id, or throw 404 so bad ids look like missing records. */
export const idParam = (value: unknown, label = "Record") => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw notFound(`${label} not found.`);
  return id;
};

/** Optional numeric id from a query/body value (empty -> null). */
export const optionalId = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

/** Numbers arrive as strings from multipart forms. */
export const toNumber = (value: unknown, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

export const toBool = (value: unknown) => value === true || value === "true" || value === "1" || value === 1;

export const str = (value: unknown) => (value === undefined || value === null ? "" : String(value).trim());

export const queryStr = (req: Request, key: string) => {
  const v = req.query[key];
  return typeof v === "string" ? v.trim() : "";
};

/** Escape LIKE wildcards in user search input. */
export const likePattern = (term: string) => `%${term.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

const UNIQUE_MESSAGES: Record<string, string> = {
  users_email_key: "A user with this email already exists.",
  products_sku_key: "SKU already exists.",
  customers_phone_key: "A customer with this phone already exists.",
  categories_name_lower_idx: "Category already exists.",
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const pg = err?.cause?.code ? err.cause : err;
  if (pg?.code === "23505") {
    return res.status(400).json({ message: UNIQUE_MESSAGES[pg.constraint] || "That record already exists." });
  }
  if (pg?.code === "23503") {
    return res.status(400).json({ message: "This record is linked to other data and cannot be changed that way." });
  }
  if (err?.name === "MulterError" || err?.message === "Only image files are allowed.") {
    return res.status(400).json({ message: err.message });
  }
  const status = err instanceof HttpError ? err.status : err?.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? "Server error" : err.message });
};
