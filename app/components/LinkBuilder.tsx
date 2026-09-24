"use client";

import { useState } from "react";
import { appClipUrl, httpsHost } from "@/lib/links";
import { qrPath } from "@/lib/qr";
import QrCode from "./QrCode";
import s from "./LinkBuilder.module.css";

/** Turns a page URL into a web.holokit.io/launch link. */
export default function LinkBuilder() {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const valid = httpsHost(url.trim()) !== null;
  const link = valid ? appClipUrl(url.trim()) : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <form className={`${s.box} reticle`} onSubmit={(e) => e.preventDefault()}>
      <label htmlFor="page-url" className="eyebrow">
        Make a link
      </label>
      <input
        id="page-url"
        className={`${s.input} mono`}
        type="url"
        inputMode="url"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="https://example.com/ar.html"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <output htmlFor="page-url" className={`${s.out} mono`} aria-live="polite">
        {valid ? link : url.trim() ? "Enter a full https:// URL" : "Your HoloWeb link appears here"}
      </output>
      {valid && (
        <div className={s.scan}>
          <QrCode qr={qrPath(link)} className={s.qr} label="QR code for this HoloWeb link" />
          <span>Scan with your iPhone camera to test it.</span>
        </div>
      )}
      <button type="button" className="btn btn-primary" disabled={!valid} onClick={copy}>
        {copied ? "Copied" : "Copy link"}
      </button>
    </form>
  );
}
