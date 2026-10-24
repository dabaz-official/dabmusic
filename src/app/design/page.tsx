import type { Metadata } from "next";

import { ThemeToggle } from "@/components/theme-toggle";
import { contrastRatio } from "@/lib/contrast";
import {
  accent,
  controlHeights,
  focusColor,
  functionalColors,
  grayPrimitives,
  iconSizes,
  radiusScale,
  selectionColors,
  semanticTokens,
  spacingScale,
  typeScale,
} from "@/lib/design-tokens";

export const metadata: Metadata = { title: "Design" };

type ContrastRow = {
  pair: string;
  fg: string;
  bg: string;
  min: number;
  note?: string;
};

const lightRows: ContrastRow[] = [
  { pair: "text-primary / background", fg: "#171717", bg: "#FAFAFA", min: 4.5 },
  { pair: "text-secondary / background", fg: "#525252", bg: "#FAFAFA", min: 4.5 },
  { pair: "text-secondary / surface", fg: "#525252", bg: "#FFFFFF", min: 4.5 },
  { pair: "text-tertiary / background", fg: "#737373", bg: "#FAFAFA", min: 4.5 },
  { pair: "text-tertiary / surface", fg: "#737373", bg: "#FFFFFF", min: 4.5 },
  ...functionalColors.flatMap((c) => [
    { pair: `${c.role}-strong / background`, fg: c.light.strong, bg: "#FAFAFA", min: 4.5 },
    { pair: `${c.role}-on / ${c.role}-strong`, fg: c.light.on, bg: c.light.strong, min: 4.5 },
    { pair: `text-primary / ${c.role}-subtle`, fg: "#171717", bg: c.light.subtle, min: 4.5 },
  ]),
  { pair: "focus / background", fg: focusColor.light, bg: "#FAFAFA", min: 3 },
  { pair: "focus / surface", fg: focusColor.light, bg: "#FFFFFF", min: 3 },
  { pair: "selection-fg / selection-bg", fg: selectionColors.light.fg, bg: selectionColors.light.bg, min: 4.5 },
];

const darkRows: ContrastRow[] = [
  { pair: "text-primary / background", fg: "#FAFAFA", bg: "#0A0A0A", min: 4.5 },
  { pair: "text-secondary / background", fg: "#D4D4D4", bg: "#0A0A0A", min: 4.5, note: "revised mapping — pending validation (OD-002)" },
  { pair: "text-secondary / surface", fg: "#D4D4D4", bg: "#171717", min: 4.5, note: "revised mapping — pending validation (OD-002)" },
  { pair: "text-tertiary / background", fg: "#A3A3A3", bg: "#0A0A0A", min: 4.5, note: "revised mapping — pending validation (OD-002)" },
  { pair: "text-tertiary / surface", fg: "#A3A3A3", bg: "#171717", min: 4.5, note: "revised mapping — pending validation (OD-002)" },
  ...functionalColors.flatMap((c) => [
    { pair: `${c.role} / background`, fg: c.dark.base, bg: "#0A0A0A", min: 4.5 },
    { pair: `${c.role}-on / ${c.role}-strong`, fg: c.dark.on, bg: c.dark.strong, min: 4.5 },
    { pair: `text-primary / ${c.role}-subtle`, fg: "#FAFAFA", bg: c.dark.subtle, min: 4.5 },
  ]),
  { pair: "focus / background", fg: focusColor.dark, bg: "#0A0A0A", min: 3 },
  { pair: "focus / surface", fg: focusColor.dark, bg: "#171717", min: 3 },
  { pair: "selection-fg / selection-bg", fg: selectionColors.dark.fg, bg: selectionColors.dark.bg, min: 4.5 },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-text-primary">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ContrastTable({ rows }: { rows: ContrastRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th scope="col" className="px-4 py-3 font-medium">Pair</th>
            <th scope="col" className="px-4 py-3 font-medium">Ratio</th>
            <th scope="col" className="px-4 py-3 font-medium">Minimum</th>
            <th scope="col" className="px-4 py-3 font-medium">Verdict</th>
            <th scope="col" className="px-4 py-3 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ratio = contrastRatio(row.fg, row.bg);
            const pass = ratio >= row.min;
            return (
              <tr key={row.pair} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 text-text-primary">{row.pair}</td>
                <td className="px-4 py-3 tabular-nums text-text-primary">{ratio.toFixed(2)}</td>
                <td className="px-4 py-3 tabular-nums text-text-secondary">{row.min}:1</td>
                <td className="px-4 py-3 font-medium">
                  <span className={pass ? "text-success-strong" : "text-danger-strong"}>
                    {pass ? "Pass" : "Fail"}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-tertiary">{row.note ?? ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function DesignPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-16 px-4 py-16 sm:px-6 lg:px-8">
      <header className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-semibold leading-10 text-text-primary">
              Design foundations
            </h1>
            <p className="mt-2 text-base text-text-secondary">
              Foundation Test Page — DabAZ design spec v0.1 + DabWave Core v0.2.
            </p>
          </div>
          <ThemeToggle />
        </div>
        <p className="max-w-2xl text-sm text-text-tertiary">
          Semantic tokens flip with the toggle above. Contrast ratios are
          computed from the rendered token pairs, not transcribed from the spec.
        </p>
      </header>

      <Section title="Neutral palette" description="14 approved primitives, shared by both themes.">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {grayPrimitives.map((g) => (
            <li key={g.name} className="space-y-2">
              <div
                className="h-16 rounded-md border border-border"
                style={{ backgroundColor: g.hex }}
              />
              <div className="text-xs text-text-secondary">
                <div className="font-medium text-text-primary">{g.name}</div>
                {g.hex}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Semantic tokens"
        description="Background / surface / text / border as resolved by the current theme."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-6">
            <p className="text-sm font-medium text-text-primary">surface</p>
            <p className="text-sm text-text-secondary">text-secondary on surface</p>
            <p className="text-sm text-text-tertiary">text-tertiary on surface</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-secondary p-6">
            <p className="text-sm font-medium text-text-primary">surface-secondary</p>
            <p className="text-sm text-text-secondary">text-secondary on surface-secondary</p>
          </div>
          <div className="space-y-2">
            <div className="h-10 rounded-md border border-border" />
            <p className="text-xs text-text-tertiary">border</p>
          </div>
          <div className="space-y-2">
            <div className="h-10 rounded-md border-2 border-border-strong" />
            <p className="text-xs text-text-tertiary">border-strong</p>
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {semanticTokens.map((t) => (
            <div
              key={t.name}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-2"
            >
              <dt className="font-mono text-xs text-text-secondary">{t.name}</dt>
              <dd className="text-xs text-text-tertiary tabular-nums">
                L {t.light} / D {t.dark}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Accent (ink)" description="DabMusic brand accent is the gray ramp (OD-003); primary → hover → pressed darkens.">
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="h-10 rounded-md bg-primary px-5 text-sm font-medium text-on-primary">
            Primary — {accent.light.primary}
          </button>
          <span className="h-10 w-24 rounded-md bg-primary-hover" title="primary-hover" />
          <span className="h-10 w-24 rounded-md bg-primary-pressed" title="primary-pressed" />
          <span className="h-10 w-24 rounded-md border border-border bg-primary-subtle" title="primary-subtle" />
        </div>
      </Section>

      <Section title="Functional colors" description="success / warning / danger / focus / selection, approved 2026-10-24 (core-template.md §4.3).">
        <div className="space-y-4">
          {functionalColors.map((c) => (
            <div key={c.role} className="flex flex-wrap items-center gap-2">
              <span className="w-20 text-sm font-medium text-text-primary">{c.role}</span>
              {(["base", "strong", "subtle", "on"] as const).map((step) => (
                <div key={step} className="flex flex-col items-center gap-1">
                  <div
                    className="h-10 w-20 rounded-md border border-border"
                    style={{ backgroundColor: c.light[step] }}
                  />
                  <span className="text-xs text-text-tertiary">{step}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-sm font-medium text-text-primary">focus</span>
            <div className="h-10 w-20 rounded-md" style={{ backgroundColor: focusColor.light }} />
            <button type="button" className="h-10 rounded-md border border-border-strong bg-surface px-4 text-sm text-text-primary">
              Tab to me — focus ring uses {focusColor.light}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-sm font-medium text-text-primary">selection</span>
            <p className="max-w-md text-base text-text-primary">
              Select this sentence to see the selection tokens apply.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Type scale" description="Inter for Latin, Alibaba PuHuiTi 3.0 for CJK; body sizes fixed, only large headings shrink on small screens.">
        <div className="space-y-6">
          {typeScale.map((t) => (
            <div key={t.token} className="flex flex-col gap-1 border-b border-border pb-6 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-6">
              <div className="w-64 shrink-0 text-xs text-text-secondary">
                <span className="font-mono font-medium text-text-primary">{t.token}</span>
                <span className="tabular-nums"> — {t.size}/{t.lineHeight}, w{t.weight}</span>
                <div className="text-text-tertiary">{t.use}</div>
              </div>
              <p
                className="text-text-primary"
                style={{
                  fontSize: t.size,
                  lineHeight: `${t.lineHeight}px`,
                  fontWeight: t.weight,
                }}
              >
                DabMusic 音乐播放器 — I AM MUSIC.
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing" description="4px base + 2px fine token (design.md §6.2).">
        <div className="space-y-2">
          {spacingScale.map((s) => (
            <div key={s.token} className="flex items-center gap-4 text-sm">
              <span className="w-28 shrink-0 font-mono text-xs text-text-secondary">{s.token}</span>
              <span className="w-10 shrink-0 text-right text-xs tabular-nums text-text-tertiary">{s.px}</span>
              <div
                className="h-4 rounded-xs bg-primary"
                style={{ width: Math.max(s.px, 2) }}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radius" description="0–24px + radius-full for pills and avatars only; md is the control default, lg the card default.">
        <div className="flex flex-wrap items-end gap-6">
          {radiusScale.map((r) => (
            <div key={r.token} className="flex flex-col items-center gap-2">
              <div
                className="h-16 w-16 border border-border-strong bg-surface-secondary"
                style={{ borderRadius: r.px === "full" ? 9999 : r.px }}
              />
              <div className="text-center text-xs text-text-tertiary">
                <div className="font-mono text-text-secondary">{r.token}</div>
                {r.px === "full" ? "full" : `${r.px}px`}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sizing" description="Controls 32/40/48/56 (40 default); icons 12/16/20/24. Touch targets aim 44–48px+ on touch surfaces.">
        <div className="flex flex-wrap items-end gap-4">
          {controlHeights.map((h) => (
            <div key={h} className="flex flex-col items-center gap-2">
              <div
                className="flex items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-on-primary"
                style={{ height: h }}
              >
                {h}
              </div>
              <span className="text-xs text-text-tertiary">h-{h}px</span>
            </div>
          ))}
          <div className="flex items-end gap-4">
            {iconSizes.map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className="rounded-xs bg-primary" style={{ width: s, height: s }} />
                <span className="text-xs text-text-tertiary">{s}px</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Contrast — light theme" description="WCAG AA: 4.5:1 normal text, 3:1 large text and essential UI.">
        <ContrastTable rows={lightRows} />
      </Section>

      <Section title="Contrast — dark theme">
        <ContrastTable rows={darkRows} />
      </Section>

      <Section title="Open items" description="Tracked in the design docs; listed here so the gaps stay visible.">
        <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
          <li>Dark text-secondary / text-tertiary mappings pending final contrast validation (OD-002).</li>
          <li>Overlay 50% black is still proposed (design.md §3.6) — token defined, not approved.</li>
          <li>Small-screen values for heading-lg / display-sm / display-lg are not final.</li>
          <li>Focus ring width/offset per design.md §9.1 (2px / 2px); exact radius of the ring undecided.</li>
        </ul>
      </Section>

      <Section
        title="Mixed-language specimens"
        description="中英混排标本 — Latin renders in Inter at the requested weight; CJK renders in Alibaba PuHuiTi 3.0 at the matching weight and 96% size."
      >
        <div className="space-y-4 rounded-lg border border-border bg-surface p-6 text-base leading-6 text-text-primary">
          <p>DabMusic 是一个极简的音乐播放器，slogan 只有一句：I AM MUSIC.</p>
          <p>播放器支持 LRC 歌词、duet 对唱标记，以及最大 1200px 的 container-xl 版心。</p>
          <p>那小子真帅 —— All That Remains 这张专辑循环了一整个下午。</p>
          <p>字体分工：Inter 负责 Latin 与数字，阿里巴巴普惠体 3.0 负责中文与全角标点。</p>
          <p>{"常用标点：，。、！？；：\"\"''《》——…·（括号内）[方括号] {花括号}“中文引号”"}</p>
          <p>数字与单位：24bit/96kHz 无损、音量 75%、时长 3:45、码率约 1411kbps。</p>
          <p>薄荷水（Bo He Shui）在 2024 年 6 月发行，可以兑换 ¥30 或 $4.20。</p>
          <p>The quick brown fox 跳过了 2 只 lazy dogs，然后 jinxed wizards 才出现。</p>
          <p>{"歌词同步：当副歌唱到 \"I am music\" 时，滚动条应该停在第三行。"}</p>
          <p>收藏夹里混着 Cantonese pop、City Pop、民谣和后摇，一共 128 张专辑。</p>
          <p>{"搜索“那小子真帅”或搜索 \"bo-he-shui\"，都能定位到同一张专辑页面。"}</p>
          <p>视觉验证宽度：375、640、768、1024、1280、1536，外加 fluid。</p>
          <p>深色模式下，gray-950 背景上的正文对比度必须不低于 4.5:1。</p>
          <p>他提前买好了 next week 的巡演门票，就为了听一首《Not Afraid》的 remix。</p>
        </div>
      </Section>
    </main>
  );
}
