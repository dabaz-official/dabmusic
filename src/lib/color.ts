/**
 * `#rrggbb` → the same colour with each channel stepped down by `by`
 * (clamped at 0). Apple's album pages paint their footer band exactly this
 * far below the page tint — measured `#2d1e11 → #231407`, `#0e0e0e → #040404`,
 * `#2e2e2e → #242222` — so the step is a flat subtraction, not a mix.
 */
export function stepDown(hex: string, by = 10) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number) =>
    Math.max(0, ((value >> shift) & 0xff) - by)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}
