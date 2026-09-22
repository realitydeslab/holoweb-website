import qrcode from "qrcode-generator";

/** A QR code as one SVG path in module units, with a 4-module quiet zone included in `size`. */
export type QrPath = { size: number; d: string };

const QUIET = 4;

/** Encodes text as a QR code path. Level L keeps the grid coarse; codes are shown on clean screens. */
export function qrPath(text: string): QrPath {
  const qr = qrcode(0, "L");
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; ) {
      if (!qr.isDark(r, c)) {
        c++;
        continue;
      }
      let run = 1;
      while (c + run < n && qr.isDark(r, c + run)) run++;
      d += `M${c + QUIET} ${r + QUIET}h${run}v1h-${run}z`;
      c += run;
    }
  }
  return { size: n + QUIET * 2, d };
}
