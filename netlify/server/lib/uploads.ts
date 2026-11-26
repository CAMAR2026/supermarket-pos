import { randomBytes } from "node:crypto";
import path from "node:path";
import multer from "multer";
import { getStore } from "@netlify/blobs";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export const contentTypeFor = (key: string) => TYPES[path.extname(key).slice(1).toLowerCase()];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (TYPES[ext] && Object.values(TYPES).includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed."));
  },
});

const store = () => getStore("uploads");

/** Saves an uploaded image to Netlify Blobs and returns its public path. */
export const saveUpload = async (file: Express.Multer.File) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const key = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const bytes = file.buffer.buffer.slice(file.buffer.byteOffset, file.buffer.byteOffset + file.buffer.byteLength);
  await store().set(key, bytes as ArrayBuffer);
  return `/uploads/${key}`;
};

export const readUpload = (key: string) => store().get(key, { type: "arrayBuffer" });
