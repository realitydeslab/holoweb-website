"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { GalleryEntry } from "@/lib/gallery";
import { hues, httpsHost, launchHref, sitePath } from "@/lib/links";
import s from "./Gallery.module.css";

const ALL = "All";

/** Tag filter plus experience grid. Filtering is local state only, so it works without the router. */
export default function Gallery({ entries }: { entries: GalleryEntry[] }) {
  const [tag, setTag] = useState(ALL);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [entries]);

  const shown = tag === ALL ? entries : entries.filter((e) => e.tags.includes(tag));

  return (
    <>
      <div className={s.filterBar} role="group" aria-label="Filter by tag">
        <div className={s.filters}>
          <button type="button" className="chip" aria-pressed={tag === ALL} onClick={() => setTag(ALL)}>
            {ALL} <span className="count">{entries.length}</span>
          </button>
          {tags.map(([t, n]) => (
            <button key={t} type="button" className="chip" aria-pressed={tag === t} onClick={() => setTag(t)}>
              {t} <span className="count">{n}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {tag === ALL ? `Showing all ${shown.length} experiences` : `Showing ${shown.length} tagged ${tag}`}
      </p>
      <ul className={s.grid}>
        {shown.map((e, i) => (
          <Card key={e.id} entry={e} index={i} onTag={setTag} />
        ))}
      </ul>
    </>
  );
}

function Card({ entry: e, index, onTag }: { entry: GalleryEntry; index: number; onTag: (t: string) => void }) {
  const host = httpsHost(e.url);
  const [h1, h2] = hues(e.id);
  return (
    <li className={`${s.card} rise`} style={{ "--i": Math.min(index, 8) } as CSSProperties}>
      <div className={s.thumb}>
        {e.thumbnail ? (
          // Local, pre-sized screenshots from /public/gallery; next/image adds nothing under static export.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sitePath(e.thumbnail)} alt={`Screenshot of ${e.title}`} loading="lazy" decoding="async" />
        ) : (
          <div
            className={s.generated}
            style={{ "--h1": h1, "--h2": h2 } as CSSProperties}
            aria-hidden="true"
          >
            <span className="mono">{e.renderer}</span>
          </div>
        )}
        {e.thumbnail && <span className={`${s.renderer} mono`}>{e.renderer}</span>}
      </div>
      <div className={s.body}>
        <h3 className={s.title}>{e.title}</h3>
        <p className={s.author}>by {e.author}</p>
        {e.description && <p className={s.desc}>{e.description}</p>}
        {e.tags.length > 0 && (
          <ul className={s.tags} aria-label="Tags">
            {e.tags.map((t) => (
              <li key={t}>
                <button type="button" className="chip chip-sm" onClick={() => onTag(t)} aria-label={`Show ${t}`}>
                  {t}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className={s.actions}>
          <a className="btn btn-primary" href={launchHref(e.url)}>
            Open in HoloWeb
          </a>
          <div className={s.secondary}>
            <a className="textlink" href={e.url} rel="noopener">
              {host ?? "Original page"} ↗
            </a>
            {e.sourceUrl && (
              <a className="textlink" href={e.sourceUrl} rel="noopener">
                Source ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
