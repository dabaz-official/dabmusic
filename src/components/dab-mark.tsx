/**
 * The DabAZ mark (the owner's 360×360 artwork) — the D with the notch cut out
 * of it. Colour comes from `currentColor`, like the wordmark in `logo.tsx`, so
 * the caller decides it.
 */
export function DabMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M24.1155 90C39.9137 62.6366 62.6366 39.9137 90 24.1155C117.363 8.31721 148.403 0 180 0C211.597 0 242.636 8.3171 270 24.1153C297.364 39.9136 320.087 62.6364 335.884 89.9998C351.682 117.364 360 148.404 360 180C360 211.597 351.682 242.636 335.885 270L180 180V360C148.404 360 117.364 351.682 90.0002 335.885C62.6366 320.087 39.9137 297.364 24.1155 270C8.31721 242.636 0 211.597 0 180C0 148.404 8.3171 117.364 24.1155 90Z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
      />
    </svg>
  );
}
