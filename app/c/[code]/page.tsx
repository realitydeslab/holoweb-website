import type { Metadata } from "next";
import { loadGallery } from "@/lib/gallery";
import { shortUrl } from "@/lib/links";
import { appClipCodeImage, loadShortLinks } from "@/lib/shortlinks";
import { LaunchView } from "../../components/LaunchPage";

// Static export: one page per code in content/shortlinks.json, nothing else.
export const dynamicParams = false;

export function generateStaticParams() {
  return loadShortLinks().map(({ code }) => ({ code }));
}

type Props = { params: Promise<{ code: string }> };

function find(code: string) {
  const link = loadShortLinks().find((l) => l.code === code);
  if (!link) throw new Error(`unknown short code ${code}`);
  return link;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const link = find((await params).code);
  // Lets the HoloWeb app resolve the short link without a lookup table.
  return { other: { "holoweb:target": link.url } };
}

export default async function ShortLink({ params }: Props) {
  const { code } = await params;
  const link = find(code);
  const known = loadGallery().map(({ url, title, author }) => ({ url, title, author }));
  // Inside the HoloWeb app or App Clip the WebXR polyfill defines window.__holoweb: go straight to
  // the experience. Everywhere else (Safari, desktop) the landing page stays.
  const redirect = `if (window.__holoweb) location.replace(${JSON.stringify(link.url)});`;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: redirect }} />
      <LaunchView target={link.url} known={known} shareUrl={shortUrl(code)} appClipCode={appClipCodeImage(code)} />
    </>
  );
}
