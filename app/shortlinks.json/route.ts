import { loadShortLinks } from "@/lib/shortlinks";

// Published as /shortlinks.json so the app can resolve /c/<code> invocations.
export const dynamic = "force-static";

export function GET() {
  const map = Object.fromEntries(loadShortLinks().map(({ code, url }) => [code, url]));
  return Response.json(map);
}
