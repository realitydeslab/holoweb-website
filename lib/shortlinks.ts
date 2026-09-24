import fs from "node:fs";
import path from "node:path";

/** A permanent short link, https://web.holokit.io/c/<code>, sized for App Clip Codes.
 *  Codes are printed on physical App Clip Codes, so never reuse or renumber one: append new codes,
 *  and keep the target URL here even if the entry leaves the gallery. */
export type ShortLink = { code: string; id: string; url: string };

const FILE = path.join(process.cwd(), "content", "shortlinks.json");

export function loadShortLinks(): ShortLink[] {
  if (!fs.existsSync(FILE)) return [];
  const raw = JSON.parse(fs.readFileSync(FILE, "utf8")) as Record<string, { id?: unknown; url?: unknown }>;
  return Object.entries(raw).map(([code, v]) => {
    if (!/^[a-z0-9]+$/.test(code)) throw new Error(`shortlinks.json: bad code "${code}"`);
    if (typeof v.url !== "string" || !v.url.startsWith("https://")) throw new Error(`shortlinks.json: code ${code} needs an https url`);
    return { code, id: typeof v.id === "string" ? v.id : "", url: v.url };
  });
}

/** Local App Clip Code image for a short code, if one has been generated into public/appclip. */
export function appClipCodeImage(code: string): string | null {
  const rel = `/appclip/${code}.svg`;
  return fs.existsSync(path.join(process.cwd(), "public", rel)) ? rel : null;
}
