---
description: "Use when editing CubeCloud fork branding surfaces (web, landing-page, desktop), logo assets, and brand copy references."
name: "CubeCloud Branding Guidance"
applyTo:
  - "apps/web/app/layout.tsx"
  - "apps/web/src/i18n/locales/*.ts"
  - "apps/web/src/components/AppChromeHeader.tsx"
  - "apps/web/public/*.svg"
  - "apps/landing-page/app/**/*.tsx"
  - "apps/landing-page/app/**/*.astro"
  - "apps/desktop/src/main/runtime.ts"
  - "assets/cubecloud-logos/**"
---

# CubeCloud Branding Guidance

## Scope

- Preserve Open Design upstream identity where intentionally unchanged.
- Apply CubeCloud fork branding where the fork explicitly owns branding overlays.
- Keep branding updates limited to presentation surfaces; avoid changing protocol, API, runtime, or orchestration behavior as a shortcut.

## Source of truth

- Primary logo asset library: `assets/cubecloud-logos/`.
- Agent entry guidance and boundaries: `AGENTS.md`.
- Fork sync and release lane policy: `.github/instructions/cubecloud-fork-sync.instructions.md`.
- Container image and compose lane policy: `.github/instructions/ghcr-distribution.instructions.md`.

## Branding checklist (web, landing, desktop)

1. Web runtime entry points:
   - `apps/web/app/layout.tsx` metadata title/icons
   - `apps/web/src/components/AppChromeHeader.tsx` brand mark rendering
   - `apps/web/src/i18n/locales/*.ts` brand copy (`app.brand`, welcome strings)
2. Landing-page entry points:
   - `apps/landing-page/app/_components/header.tsx`
   - `apps/landing-page/app/page.tsx`
   - `apps/landing-page/app/pages/index.astro` and `app/pages/og.astro`
3. Desktop shell entry points:
   - `apps/desktop/src/main/runtime.ts` loading-shell title and fallback copy
4. Keep naming coherent across surfaces:
   - Use one approved label form per change batch (for example: `CubeCloud Open Design`), and keep `title`, header copy, and aria labels aligned.
5. When changing logo paths, verify the target asset is available in the corresponding app runtime static path.

## Guardrails

- Do not assume root-level `assets/` paths are directly web-served by every app.
- Avoid silent rebranding drift across web, landing-page, and desktop; update all touched surfaces in the same change.
- Keep changes reversible and minimal; do not reformat unrelated sections.
