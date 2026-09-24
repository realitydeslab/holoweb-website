"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { appClipUrl, sitePath } from "@/lib/links";
import { qrPath } from "@/lib/qr";
import QrCode from "./QrCode";
import s from "./LaunchPage.module.css";

export type Known = { url: string; title: string; author: string };

type ViewProps = {
  target: string | null;
  known: Known[];
  /** Link encoded in the QR code; defaults to the /launch form of the target. */
  shareUrl?: string;
  /** App Clip Code image to show next to the QR code, when one exists. */
  appClipCode?: string | null;
};

/** Landing page for HoloWeb invocation links (`/launch?url=`, `/c?url=` and `/c/<code>`).
 *  On iPhone the App Clip card or the installed app takes over; elsewhere this page explains
 *  what the link is and where it points. */
export function LaunchView({ target, known, shareUrl, appClipCode }: ViewProps) {
  let parsed: URL | null = null;
  try {
    if (target) {
      const u = new URL(target);
      if (u.protocol === "https:") parsed = u;
    }
  } catch {
    parsed = null;
  }
  const match = parsed ? known.find((k) => k.url === target) : undefined;

  if (!parsed) {
    return (
      <Shell>
        <h1 className={s.title}>This link has no page to open</h1>
        <p className={s.note}>
          A HoloWeb link needs a <code className="mono">url</code> parameter with a full https:// address, like{" "}
          <span className={`mono ${s.path}`}>web.holokit.io/c?url=https%3A%2F%2Fexample.com%2Far.html</span>.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="eyebrow">WebXR experience from</p>
      <h1 className={`${s.origin} mono`}>{parsed.origin}</h1>
      {match && (
        <p className={s.match}>
          <strong>{match.title}</strong> by {match.author}
        </p>
      )}
      <p className={`${s.path} mono`}>{parsed.pathname + parsed.search}</p>
      <a className={`btn btn-primary ${s.open}`} href={parsed.href} rel="noopener">
        Open {parsed.host}
      </a>
      <p className={s.note}>
        <strong>On iPhone,</strong> open this link in Safari to get the HoloWeb App Clip card. It runs the page in AR
        with no install, handheld or in a HoloKit&nbsp;X headset. Requires iOS 27 or later.
      </p>
      <div className={s.scan}>
        {appClipCode && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={s.qr} src={sitePath(appClipCode)} alt={`App Clip Code that opens ${parsed.host} in HoloWeb`} />
        )}
        <QrCode
          qr={qrPath(shareUrl ?? appClipUrl(parsed.href))}
          className={s.qr}
          label={`QR code that opens ${parsed.host} in HoloWeb`}
        />
        <p>
          <strong>On a computer?</strong> Scan with your iPhone camera to open it there.
        </p>
      </div>
    </Shell>
  );
}

function FromQuery({ known }: { known: Known[] }) {
  return <LaunchView target={useSearchParams().get("url")} known={known} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className={`wrap ${s.page}`}>
      <a className={`${s.brand} stereo`} href={sitePath("/")}>
        HoloWeb
      </a>
      <div className={`${s.panel} reticle`}>{children}</div>
      <a className="textlink" href={sitePath("/")}>
        ← Browse the gallery
      </a>
    </main>
  );
}

export default function LaunchPage({ known }: { known: Known[] }) {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="eyebrow">Reading link…</p>
        </Shell>
      }
    >
      <FromQuery known={known} />
    </Suspense>
  );
}
