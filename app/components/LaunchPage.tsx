"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/** Landing page for HoloWeb invocation links (`/launch?url=` and `/c?url=`).
 *  On iPhone the App Clip card or the installed app takes over; elsewhere this page explains
 *  what the link is and where it points. */
function LaunchBody() {
  const target = useSearchParams().get("url");
  let host: string | null = null;
  try {
    if (target) {
      const parsed = new URL(target);
      if (parsed.protocol === "https:") host = parsed.host;
    }
  } catch {
    host = null;
  }
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 560, margin: "15vh auto", padding: "0 16px" }}>
      <h1>HoloWeb</h1>
      {host ? (
        <>
          <p>This link opens a WebXR experience from <strong>{host}</strong> in HoloWeb.</p>
          <p>On iPhone, open it in Safari to start the HoloWeb App Clip. No install needed.</p>
          <p><a href={target!}>Open {host} in this browser instead</a></p>
        </>
      ) : (
        <p>This HoloWeb link is missing a valid <code>url</code> parameter (https only).</p>
      )}
    </div>
  );
}

export default function LaunchPage() {
  return (
    <Suspense fallback={null}>
      <LaunchBody />
    </Suspense>
  );
}
