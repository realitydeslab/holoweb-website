// Browser-safe helpers shared by server and client components (no fs imports here).

/** Canonical origin for links that leave the site (QR codes, copied links). App Clip invocation needs this domain. */
export const SITE_ORIGIN = "https://web.holokit.io";

/** App Clip invocation link, the form for QR codes and sharing. The App Clip experience in
 *  App Store Connect is registered for the https://web.holokit.io/c prefix, so the camera shows the
 *  App Clip card for these; /launch links only work as taps. */
export function appClipUrl(url: string): string {
  return `${SITE_ORIGIN}/c?url=${encodeURIComponent(url)}`;
}

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

/** Prefixes a site-absolute path with the deploy base path (empty on web.holokit.io). */
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

/** Short App Clip link for a code from content/shortlinks.json. */
export function shortUrl(code: string): string {
  return `${SITE_ORIGIN}/c/${code}`;
}
