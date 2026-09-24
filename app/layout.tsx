import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://web.holokit.io"),
  title: "HoloWeb: WebXR AR on iPhone",
  description:
    "Open WebXR immersive-ar pages on iPhone through an App Clip, handheld or in a HoloKit X stereo headset. No install.",
  other: {
    // Smart banner that shows the App Clip card in Safari on iPhone.
    "apple-itunes-app":
      "app-clip-bundle-id=org.realitydeslab.holokit-web.Clip, app-clip-display=card",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0c0e10" },
    { media: "(prefers-color-scheme: light)", color: "#f2f1ec" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
