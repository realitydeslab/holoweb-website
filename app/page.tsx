import type { CSSProperties } from "react";
import { loadGallery } from "@/lib/gallery";
import { appClipUrl } from "@/lib/links";
import { qrPath } from "@/lib/qr";
import { appClipCodeImage, loadShortLinks } from "@/lib/shortlinks";
import Gallery from "./components/Gallery";
import LinkBuilder from "./components/LinkBuilder";
import s from "./home.module.css";

const delay = (i: number) => ({ "--i": i }) as CSSProperties;

export default function Home() {
  // QR codes are computed at build time so they are in the static HTML.
  const short = loadShortLinks();
  const entries = loadGallery().map((e) => {
    const code = short.find((l) => l.id === e.id && l.url === e.url)?.code ?? null;
    return { ...e, qr: qrPath(appClipUrl(e.url)), appClipCode: code ? appClipCodeImage(code) : null };
  });
  return (
    <>
      <header className={`wrap ${s.hero}`}>
        <p className="eyebrow rise">WebXR immersive-ar · iPhone · iOS 27+</p>
        <h1 className={`${s.wordmark} stereo`}>HoloWeb</h1>
        <p className={`${s.lede} rise`} style={delay(1)}>
          Open any WebXR AR page on iPhone. A HoloWeb link starts an App Clip, so there is nothing to install, and the
          same page runs in stereo when you slide the phone into a HoloKit&nbsp;X headset.
        </p>
        <ul className={s.modes} aria-label="Viewing modes">
          <li className="reticle rise" style={delay(2)}>
            <span className="eyebrow">Mode 1</span>
            <strong>Handheld</strong>
            <span>Mono AR through the phone camera.</span>
          </li>
          <li className="reticle rise" style={delay(3)}>
            <span className="eyebrow">Mode 2</span>
            <strong>HoloKit X stereo</strong>
            <span>One image per eye, in the headset.</span>
          </li>
        </ul>
      </header>

      <main id="gallery" className="wrap" aria-labelledby="gallery-title">
        <h2 id="gallery-title" className={s.sectionTitle}>
          Experiences <span className={`mono ${s.count}`}>{String(entries.length).padStart(2, "0")}</span>
        </h2>
        <Gallery entries={entries} />
      </main>

      <footer className={`wrap ${s.footer}`} aria-labelledby="add-title">
        <div className={s.addGrid}>
          <div>
            <h2 id="add-title" className={s.sectionTitle}>
              Add your WebXR experience
            </h2>
            <p>
              Any page that starts an <code className="mono">immersive-ar</code> session through{" "}
              <code className="mono">navigator.xr</code> works in HoloWeb, with no SDK and no changes to the page. Share
              it with a link in this format:
            </p>
            <p className="code">web.holokit.io/c?url=&lt;percent-encoded page URL&gt;</p>
            <p>
              Scanning it as a QR code opens the App Clip. <span className="mono">web.holokit.io/launch?url=</span> works
              the same way for links people tap.
            </p>
            <p>
              To have it listed here,{" "}
              <a href="https://github.com/realitydeslab/holoweb-website/issues">open an issue on GitHub</a> with the
              page URL and a link to its source.
            </p>
          </div>
          <LinkBuilder />
        </div>
        <p className={`eyebrow ${s.colophon}`}>
          HoloWeb by <a href="https://github.com/realitydeslab">Reality Design Lab</a>. Each experience belongs to its
          author.
        </p>
      </footer>
    </>
  );
}
