/*
 * Mirror of the token definitions in src/app/globals.css, which is canonical.
 * Used by the /design foundation test page for swatches and contrast math.
 *
 * Primitive neutrals — design.md §2.3. Semantic — design.md §3.2.
 * Functional — core-template.md §4.3, approved by the owner on 2026-10-24
 * (closes OD-001; the core doc still says "Proposed").
 * Accent — DabMusic ink mapping per core-template.md OD-003.
 */

export const grayPrimitives: ReadonlyArray<{ name: string; hex: string }> = [
  { name: "gray-0", hex: "#FFFFFF" },
  { name: "gray-50", hex: "#FAFAFA" },
  { name: "gray-100", hex: "#F5F5F5" },
  { name: "gray-150", hex: "#EBEBEB" },
  { name: "gray-200", hex: "#E5E5E5" },
  { name: "gray-300", hex: "#D4D4D4" },
  { name: "gray-400", hex: "#A3A3A3" },
  { name: "gray-500", hex: "#737373" },
  { name: "gray-600", hex: "#525252" },
  { name: "gray-700", hex: "#404040" },
  { name: "gray-800", hex: "#262626" },
  { name: "gray-900", hex: "#171717" },
  { name: "gray-950", hex: "#0A0A0A" },
  { name: "gray-1000", hex: "#000000" },
];

export type FunctionalColor = {
  role: string;
  light: { base: string; strong: string; subtle: string; on: string };
  dark: { base: string; strong: string; subtle: string; on: string };
};

export const functionalColors: ReadonlyArray<FunctionalColor> = [
  {
    role: "success",
    light: { base: "#008C3F", strong: "#007131", subtle: "#DEF1E1", on: "#FFFFFF" },
    dark: { base: "#69BE7D", strong: "#98D1A3", subtle: "#003F18", on: "#000000" },
  },
  {
    role: "warning",
    light: { base: "#936E00", strong: "#775800", subtle: "#F4EAD7", on: "#FFFFFF" },
    dark: { base: "#C8A24F", strong: "#D8BE86", subtle: "#423000", on: "#000000" },
  },
  {
    role: "danger",
    light: { base: "#CC3336", strong: "#AD1621", subtle: "#FFE4E1", on: "#FFFFFF" },
    dark: { base: "#F3827A", strong: "#FAA8A1", subtle: "#65000A", on: "#000000" },
  },
];

export const focusColor = { light: "#4C89EF", dark: "#4C89EF" } as const;

export const selectionColors = {
  light: { bg: "#171717", fg: "#FFFFFF" },
  dark: { bg: "#FAFAFA", fg: "#000000" },
} as const;

// Ink (gray) accent alias ladder: primary → hover → pressed darkens.
export const accent = {
  light: {
    primary: "#262626",
    hover: "#171717",
    pressed: "#000000",
    subtle: "#F5F5F5",
    on: "#FFFFFF",
  },
  dark: {
    primary: "#F5F5F5",
    hover: "#FAFAFA",
    pressed: "#FFFFFF",
    subtle: "#262626",
    on: "#000000",
  },
} as const;

export const semanticTokens: ReadonlyArray<{
  name: string;
  light: string;
  dark: string;
}> = [
  { name: "color-background", light: "#FAFAFA", dark: "#0A0A0A" },
  { name: "color-surface", light: "#FFFFFF", dark: "#171717" },
  { name: "color-surface-secondary", light: "#F5F5F5", dark: "#262626" },
  { name: "color-text-primary", light: "#171717", dark: "#FAFAFA" },
  { name: "color-text-secondary", light: "#525252", dark: "#D4D4D4" },
  { name: "color-text-tertiary", light: "#737373", dark: "#A3A3A3" },
  { name: "color-border", light: "#E5E5E5", dark: "#262626" },
  { name: "color-border-strong", light: "#D4D4D4", dark: "#404040" },
];

// Type scale — design.md §5.1 (px).
export const typeScale: ReadonlyArray<{
  token: string;
  size: number;
  lineHeight: number;
  weight: number;
  use: string;
}> = [
  { token: "text-xs", size: 12, lineHeight: 16, weight: 400, use: "Compact metadata, secondary labels" },
  { token: "text-sm", size: 14, lineHeight: 20, weight: 400, use: "Supporting text" },
  { token: "text-base", size: 16, lineHeight: 24, weight: 400, use: "Body default" },
  { token: "text-lg", size: 18, lineHeight: 28, weight: 500, use: "Emphasised body, lead" },
  { token: "heading-sm", size: 20, lineHeight: 28, weight: 600, use: "Sub-section titles" },
  { token: "heading-md", size: 24, lineHeight: 32, weight: 600, use: "Section titles" },
  { token: "heading-lg", size: 32, lineHeight: 40, weight: 600, use: "Page titles" },
  { token: "display-sm", size: 40, lineHeight: 48, weight: 700, use: "Heroes, brand moments" },
  { token: "display-lg", size: 48, lineHeight: 56, weight: 700, use: "Heroes, brand moments" },
];

// Spacing scale — design.md §6.2 (px).
export const spacingScale: ReadonlyArray<{ token: string; px: number }> = [
  { token: "space-0", px: 0 },
  { token: "space-0-5", px: 2 },
  { token: "space-1", px: 4 },
  { token: "space-2", px: 8 },
  { token: "space-3", px: 12 },
  { token: "space-4", px: 16 },
  { token: "space-5", px: 20 },
  { token: "space-6", px: 24 },
  { token: "space-8", px: 32 },
  { token: "space-10", px: 40 },
  { token: "space-12", px: 48 },
  { token: "space-16", px: 64 },
  { token: "space-20", px: 80 },
  { token: "space-24", px: 96 },
];

// Radius scale — design.md §7.3 (px).
export const radiusScale: ReadonlyArray<{ token: string; px: number | "full" }> = [
  { token: "radius-none", px: 0 },
  { token: "radius-xs", px: 4 },
  { token: "radius-sm", px: 6 },
  { token: "radius-md", px: 8 },
  { token: "radius-lg", px: 12 },
  { token: "radius-xl", px: 16 },
  { token: "radius-2xl", px: 24 },
  { token: "radius-full", px: "full" },
];

export const controlHeights = [32, 40, 48, 56] as const;
export const iconSizes = [12, 16, 20, 24] as const;
