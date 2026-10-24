/** The compact "E" tag, matching the ink-only accent system. */
export function ExplicitBadge() {
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border border-current text-[10px] font-semibold leading-none text-text-secondary"
      aria-label="Explicit"
      title="Explicit"
    >
      E
    </span>
  );
}
