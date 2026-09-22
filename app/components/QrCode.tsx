import type { QrPath } from "@/lib/qr";

/** Dark-on-white QR code. Always white, whatever the theme, so phone cameras read it reliably. */
export default function QrCode({ qr, label, className }: { qr: QrPath; label: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${qr.size} ${qr.size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect width={qr.size} height={qr.size} fill="#fff" />
      <path d={qr.d} fill="#000" />
    </svg>
  );
}
