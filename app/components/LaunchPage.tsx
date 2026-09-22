"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { sitePath } from "@/lib/links";
import s from "./LaunchPage.module.css";

type Known = { url: string; title: string; author: string };

/** Landing page for HoloWeb invocation links (`/launch?url=` and `/c?url=`).
 *  On iPhone the App Clip card or the installed app takes over; elsewhere this page explains
 *  what the link is and where it points. */
function LaunchBody({ known }: { known: Known[] }) {
  const target = useSearchParams().get("url");
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
          <span className={`mono ${s.path}`}>holoweb.app/launch?url=https%3A%2F%2Fexample.com%2Far.html</span>.
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
    </Shell>
  );
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
      <LaunchBody known={known} />
    </Suspense>
  );
}
