# Shifts the vendored Inter Variable glyphs vertically relative to the
# baseline so Latin sits optically centred next to Alibaba PuHuiTi 3.0.
#
# Measured on 2026-10-24 (canvas ink boxes, em units above the baseline):
#   PuHuiTi hanzi 中心 ≈ +0.345em; Inter caps/mixed 中心 ≈ +0.365..0.37em —
#   Latin read ~0.02em high in mixed lines. Shared baselines make CSS unable
#   to move one script relative to the other, so the outlines move instead.
#   Line-box metrics (hhea/OS2) are untouched: only glyphs shift.
#
# Run from the repo root:  python scripts/shift-inter.py
# The source of truth is the committed InterVariable.woff2; rerunning this
# script on an already-shifted file would shift again, so it restores the
# pristine font from git first. Requires fontTools + brotli.

import subprocess
import sys

from fontTools.ttLib import TTFont

SHIFT = 40  # units at UPM 2048 (~0.0195em, positive = down)
FONT = "src/app/fonts/InterVariable.woff2"

# Restore the pristine font so the script is idempotent.
subprocess.run(["git", "checkout", "--", FONT], check=True)

font = TTFont(FONT)
upm = font["head"].unitsPerEm
if upm != 2048:
    sys.exit(f"unexpected unitsPerEm {upm}; revisit SHIFT before running")
glyf = font["glyf"]

for name in font.getGlyphOrder():
    glyph = glyf[name]
    if glyph.isComposite():
        for comp in glyph.components:
            transform = getattr(comp, "transform", None)
            if transform:
                xx, xy, yx, yy, dx, dy = transform
                comp.transform = (xx, xy, yx, yy, dx, dy - SHIFT)
            else:
                comp.y -= SHIFT
    elif glyph.numberOfContours:
        glyph.coordinates.translate((0, -SHIFT))

font.save(FONT)
print(f"shifted {len(font.getGlyphOrder())} glyphs down by {SHIFT} units "
      f"({SHIFT / upm:.4f}em) in {FONT}")
