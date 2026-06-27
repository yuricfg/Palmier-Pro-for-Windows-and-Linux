/** Slow, subtle aurora blobs behind the glass shell. CSS-animated (transform only)
 *  and disabled under prefers-reduced-motion via theme.css. Decorative — aria-hidden. */
export function AuroraBackground() {
  return (
    <div className="pp-aurora" aria-hidden="true">
      <div className="pp-aurora__blob pp-aurora__blob--a" />
      <div className="pp-aurora__blob pp-aurora__blob--b" />
    </div>
  );
}
