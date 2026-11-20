"use client";

import { useEffect, useMemo, useState } from "react";
import { createTheme, themeToCss } from "@/lib/expressive/tokens/theme";

type PaletteId = "gray" | "coral" | "indigo" | "gold" | "lavender" | "forest";

type SchemeVariant =
  | "expressive"
  | "tonal-spot"
  | "vibrant"
  | "neutral"
  | "monochrome"
  | "fidelity"
  | "content"
  | "rainbow"
  | "fruit-salad";

interface PaletteOption {
  id: PaletteId;
  name: string;
  seed: string;
}

interface SchemeOption {
  id: SchemeVariant;
  name: string;
}

const PALETTES: PaletteOption[] = [
  { id: "gray", name: "Teal", seed: "#006874" },
  { id: "coral", name: "Coral", seed: "#ffb4a3" },
  { id: "indigo", name: "Indigo", seed: "#b8c3ff" },
  { id: "gold", name: "Gold", seed: "#d8c770" },
  { id: "lavender", name: "Lavender", seed: "#bfc2ff" },
  { id: "forest", name: "Forest", seed: "#a0d49b" },
];

const SCHEMES: SchemeOption[] = [
  {
    id: "expressive",
    name: "Expressive",
  },
  {
    id: "tonal-spot",
    name: "Tonal Spot",
  },
  {
    id: "vibrant",
    name: "Vibrant",
  },
  {
    id: "neutral",
    name: "Neutral",
  },
  {
    id: "monochrome",
    name: "Monochrome",
  },
  {
    id: "fidelity",
    name: "Fidelity",
  },
  {
    id: "content",
    name: "Content",
  },
  {
    id: "rainbow",
    name: "Rainbow",
  },
  {
    id: "fruit-salad",
    name: "Fruit Salad",
  },
];

const STYLE_ELEMENT_ID = "m3-expressive-runtime-theme";

export default function ThemePaletteController() {
  const [activePalette, setActivePalette] = useState<PaletteId>("gray");
  const [activeScheme, setActiveScheme] = useState<SchemeVariant>("expressive");
  const [isDark, setIsDark] = useState(true);

  const selectedPalette =
    PALETTES.find((palette) => palette.id === activePalette) ?? PALETTES[0];

  const theme = useMemo(
    () =>
      createTheme({
        colors: {
          seed: selectedPalette.seed,
          variant: activeScheme,
        },
      }),
    [selectedPalette.seed, activeScheme],
  );

  useEffect(() => {
    const root = document.documentElement;
    const themeName = `m3-${activePalette}-${activeScheme}`;
    const themeSelector = `html[data-theme="${themeName}"]`;
    const scopedCss =
      themeToCss(theme)
        .replaceAll(":root", themeSelector)
        .replaceAll(".dark", `${themeSelector}[data-color-mode="dark"]`) +
      `
${themeSelector} {
  /* Compatibility bridge for existing daisyUI/Tailwind theme utilities. */
  --color-base-100: var(--ex-color-surface);
  --color-base-200: var(--ex-color-surface-container);
  --color-base-300: var(--ex-color-surface-container-high);
  --color-base-content: var(--ex-color-on-surface);
  --color-primary: var(--ex-color-primary);
  --color-primary-content: var(--ex-color-on-primary);
  --color-secondary: var(--ex-color-secondary);
  --color-secondary-content: var(--ex-color-on-secondary);
  --color-accent: var(--ex-color-tertiary);
  --color-accent-content: var(--ex-color-on-tertiary);
  --color-neutral: var(--ex-color-surface-container-highest);
  --color-neutral-content: var(--ex-color-on-surface);
  --color-info: var(--ex-color-primary);
  --color-info-content: var(--ex-color-on-primary);
  --color-success: var(--ex-color-secondary);
  --color-success-content: var(--ex-color-on-secondary);
  --color-warning: var(--ex-color-tertiary);
  --color-warning-content: var(--ex-color-on-tertiary);
  --color-error: var(--ex-color-error);
  --color-error-content: var(--ex-color-on-error);
  
}
`;

    let style = document.getElementById(
      STYLE_ELEMENT_ID,
    ) as HTMLStyleElement | null;

    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ELEMENT_ID;
      document.head.appendChild(style);
    }

    style.textContent = scopedCss;
    root.setAttribute("data-theme", themeName);
    root.setAttribute("data-color-mode", isDark ? "dark" : "light");

    return () => {};
  }, [theme, activePalette, activeScheme, isDark]);

  return (
    <section className="w-full space-y-6 rounded-box border border-outline-variant bg-surface-container p-5 text-on-surface shadow-elevation-2 transition-colors duration-300 sm:p-6">
      {/* Header and appearance toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-title-large font-semibold text-on-surface">
            Pick Theme
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsDark((current) => !current)}
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          aria-pressed={isDark}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-elevation-1 transition-all duration-300 hover:scale-105 hover:shadow-elevation-2 active:scale-95"
        >
          {isDark ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="size-6 fill-current"
              aria-hidden="true"
            >
              <path d="M12 21q-3.75 0-6.38-2.63T3 12q0-3.75 2.63-6.37T12 3q.35 0 .69.02.34.02.66.07-1.03.73-1.64 1.89T11.1 7.5q0 2.25 1.57 3.82t3.83 1.58q1.38 0 2.53-.61t1.88-1.64q.05.33.07.66T21 12q0 3.75-2.63 6.38T12 21Z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="size-6 fill-current"
              aria-hidden="true"
            >
              <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM11 1h2v4h-2V1Zm0 18h2v4h-2v-4ZM1 11h4v2H1v-2Zm18 0h4v2h-4v-2ZM3.88 5.3l1.42-1.42 2.83 2.83-1.42 1.42L3.88 5.3Zm12 12 1.42-1.42 2.83 2.83-1.42 1.42-2.83-2.83Zm1.42-10.59 2.83-2.83 1.42 1.42-2.83 2.83-1.42-1.42Zm-12 12 2.83-2.83 1.42 1.42-2.83 2.83-1.42-1.42Z" />
            </svg>
          )}
        </button>
      </div>

      <div className="grid gap-3 grid-cols-3">
        {PALETTES.map((palette, index) => {
          const isSelected = activePalette === palette.id;
          const shapes = [
            "rounded-field rounded-tl-box rounded-br-box",
            "rounded-field rounded-b-box",
            "rounded-field rounded-tr-box rounded-bl-box",
            "rounded-field rounded-bl-box rounded-tr-box",
            "rounded-field rounded-t-box",
            "rounded-field rounded-br-box rounded-tl-box",
          ];

          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => setActivePalette(palette.id)}
              aria-pressed={isSelected}
              className={`flex  min-w-25 flex-col justify-between gap-2 border p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] ${
                isSelected
                  ? "border-primary bg-secondary-container text-on-secondary-container shadow-elevation-1"
                  : "border-outline-variant bg-surface-container-high hover:bg-surface-container-highest"
              } ${shapes[index]}`}
            >
              <span
                className="flex size-8 shrink-0 self-end items-center justify-center rounded-full border border-outline-variant shadow-elevation-1"
                style={{ backgroundColor: palette.seed }}
              >
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="size-5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="m9.55 18-5.7-5.7 1.43-1.42 4.28 4.28 9.18-9.18 1.41 1.42L9.55 18Z" />
                  </svg>
                )}
              </span>

              <span className="w-full">
                <span className="block truncate text-label-large font-semibold">
                  {palette.name}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-title-medium font-semibold">Color scheme</h3>
          </div>
        </div>

        <div className="group relative w-full">
          <select
            id="color-scheme"
            value={activeScheme}
            onChange={(event) =>
              setActiveScheme(event.target.value as SchemeVariant)
            }
            className="
      w-full appearance-none
      rounded-[1.25rem]
      border border-outline-variant
      bg-surface-container-high
      px-4 pb-3 pt-3 pr-12
      text-body-large font-medium text-on-surface
      shadow-elevation-1
      outline-none
      transition-all duration-300
      hover:bg-surface-container-highest
      hover:border-on-surface-variant
      focus:border-primary
      focus:shadow-[inset_0_0_0_1px_var(--ex-color-primary)]
      active:scale-[0.99]
      cursor-pointer
    "
          >
            {SCHEMES.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name}
              </option>
            ))}
          </select>

          <div
            className="
    pointer-events-none absolute right-4 top-1/2
    flex size-8 -translate-y-1/2 items-center justify-center
    rounded-full text-on-surface-variant
    transition-all duration-300
    group-hover:bg-on-surface/10
    group-focus-within:rotate-180
    group-focus-within:text-primary
  "
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5 fill-current"
              aria-hidden="true"
            >
              <path d="m7 10 5 5 5-5H7Z" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
