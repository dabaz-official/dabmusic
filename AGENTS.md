<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Typography: space after Chinese punctuation

Chinese punctuation must be followed by a space, exactly like English
punctuation. The site bakes halfwidth CJK punctuation into the webfont
(`Noto Sans SC` — see `DabFonts/scripts/prepare-noto.py`), so halfwidth
glyphs carry no built-in trailing whitespace.

- Write `你好, 世界` — never `你好,世界`.
- Applies to every string this project renders: page copy, metadata,
  album/track metadata files, lyrics, and code samples.
- Halfwidth forms are the default for punctuation (`,` `.` `:` `;` `!` `?`
  `()` and the native halfwidth codepoints `｡､｢｣`); fullwidth forms
  (`，。：；！？（）`) are not used in project copy.
