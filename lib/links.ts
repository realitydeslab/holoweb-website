// Browser-safe helpers shared by server and client components (no fs imports here).

/** HoloWeb invocation link for a page: opens the App Clip on iPhone, or the page directly inside the app. */
export function launchHref(url: string): string {
  return sitePath(`/launch?url=${encodeURIComponent(url)}`);
}

/** Deterministic pair of hues for a generated card background. */
export function hues(id: string): [number, number] {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  const a = (h >>> 0) % 360;
  return [a, (a + 40 + ((h >>> 9) % 80)) % 360];
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefixes a site-absolute path with the deploy base path (empty on holoweb.app). */
export function sitePath(p: string): string {
  return p.startsWith("/") ? `${BASE}${p}` : p;
}

/** Hostname for display, or null when the URL is not a valid https URL. */
export function httpsHost(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.host : null;
  } catch {
    return null;
  }
}
