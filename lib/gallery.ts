import fs from "node:fs";
import path from "node:path";

/** One curated WebXR experience, as stored in content/gallery.json. */
export type GalleryEntry = {
  id: string;
  title: string;
  author: string;
  url: string;
  sourceUrl: string | null;
  description: string;
  tags: string[];
  renderer: string;
  requiresFeatures: string[];
  license: string | null;
  verifiedAt: string | null;
  notes: string | null;
  thumbnail: string | null;
};

const CONTENT_DIR = path.join(process.cwd(), "content");

/** Reads content/gallery.json at build time, falling back to the sample fixture when it is absent. */
export function loadGallery(): GalleryEntry[] {
  const real = path.join(CONTENT_DIR, "gallery.json");
  const file = fs.existsSync(real) ? real : path.join(CONTENT_DIR, "gallery.sample.json");
  const raw: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(raw)) throw new Error(`${file}: expected a JSON array`);
  return raw.map((item, i) => normalize(item, `${file}[${i}]`));
}

function normalize(item: any, where: string): GalleryEntry {
  for (const key of ["id", "title", "url"] as const) {
    if (typeof item?.[key] !== "string" || !item[key]) throw new Error(`${where}: missing "${key}"`);
  }
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return {
    id: item.id,
    title: item.title,
    author: str(item.author) ?? "Unknown author",
    url: item.url,
    sourceUrl: str(item.sourceUrl),
    description: str(item.description) ?? "",
    tags: list(item.tags),
    renderer: str(item.renderer) ?? "WebXR",
    requiresFeatures: list(item.requiresFeatures),
    license: str(item.license),
    verifiedAt: str(item.verifiedAt),
    notes: str(item.notes),
    thumbnail: str(item.thumbnail),
  };
}
