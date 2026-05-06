# Directory guide

This file is the single source of truth for agents entering this repository. Read this file first; after entering `apps/`, `packages/`, or `tools/`, read that layer's `AGENTS.md` for module-level details. Do not copy module details back into the root file; root stays focused on cross-repository boundaries, workflow, and commands.

## Core documentation index

- Product and onboarding: `README.md`, `README.zh-CN.md`, `QUICKSTART.md`.
- Contribution and environment: `CONTRIBUTING.md`, `CONTRIBUTING.zh-CN.md`.
- Containerized fork distribution: `docs/cubecloud-openspace-installation.md`.
- Architecture and protocols: `docs/spec.md`, `docs/architecture.md`, `docs/skills-protocol.md`, `docs/agent-adapters.md`, `docs/modes.md`.
- Roadmap and references: `docs/roadmap.md`, `docs/references.md`, `specs/current/maintainability-roadmap.md`.
- Directory-level agent guidance: `apps/AGENTS.md`, `packages/AGENTS.md`, `tools/AGENTS.md`.

## Workspace directories

- Workspace packages come from `pnpm-workspace.yaml`: `apps/*`, `packages/*`, `tools/*`, and `e2e`.
- Top-level content directories: `skills/` (artifact-shape skills), `design-systems/` (brand `DESIGN.md` files), `craft/` (universal brand-agnostic craft rules a skill can opt into via `od.craft.requires`).
- `apps/web` is the Next.js 16 App Router + React 18 web runtime; do not restore `apps/nextjs`.
- `apps/daemon` is the local privileged daemon and `od` bin. It owns `/api/*`, agent spawning, skills, design systems, artifacts, and static serving.
- `apps/desktop` is the Electron shell; it discovers the web URL through sidecar IPC.
- `apps/packaged` is the thin packaged Electron runtime entry; it starts packaged sidecars and owns the `od://` entry glue only.
- `packages/contracts` is the pure TypeScript web/daemon app contract layer.
- `packages/sidecar-proto` owns the Open Design sidecar business protocol; `packages/sidecar` owns the generic sidecar runtime; `packages/platform` owns generic OS process primitives.
- `tools/dev` is the local development lifecycle control plane.
- `tools/pack` is the local packaged build/start/stop/logs control plane and mac beta release artifact preparation surface.
- `e2e` contains Playwright UI specs and Vitest/jsdom integration tests.

## Inactive or placeholder directories

- `apps/nextjs` and `packages/shared` have been removed; do not recreate or reference them.
- `.od/`, `.tmp/`, `e2e/.od-data`, Playwright reports, and agent scratch directories are local runtime data and must stay out of git.

# Development workflow

## Environment baseline

- Runtime target is Node `~24` and `pnpm@10.33.2`; use Corepack so the pnpm version pinned in `package.json` is selected.
- New project-owned entrypoints, modules, scripts, tests, reporters, and configs should default to TypeScript.
- Residual JavaScript is limited to generated output, vendored dependencies, explicitly documented compatibility build artifacts, and the allowlist in `scripts/check-residual-js.ts`.

## Local lifecycle

- Use `pnpm tools-dev` as the only local development lifecycle entry point.
- Do not add or restore root lifecycle aliases: `pnpm dev`, `pnpm dev:all`, `pnpm daemon`, `pnpm preview`, or `pnpm start`.
- Ports are governed by `tools-dev` flags: `--daemon-port` and `--web-port`.
- `tools-dev` exports `OD_PORT` for the web proxy target and `OD_WEB_PORT` for the web listener; do not use `NEXT_PORT`.

## Boundary constraints

- Keep shared API DTOs, SSE event unions, error shapes, task shapes, and example payloads in `packages/contracts`; update contracts before wiring divergent web/daemon request or response shapes.
- Keep `packages/contracts` pure TypeScript and free of Next.js, Express, Node filesystem/process APIs, browser APIs, SQLite, daemon internals, and sidecar control-plane dependencies.
- Keep project-owned entrypoints, modules, scripts, tests, reporters, and configs TypeScript-first; generated `dist/*.js` is runtime output, and source edits belong in `.ts` files.
- New `.js`, `.mjs`, or `.cjs` files need an explicit generated/vendor/compatibility reason and must pass `pnpm check:residual-js`.
- App business logic must not know about sidecar/control-plane concepts. Keep sidecar awareness in `apps/<app>/sidecar` or the desktop sidecar entry wrapper.
- Shared web/daemon app contracts belong in `packages/contracts`; that package must not depend on Next.js, Express, Node filesystem/process APIs, browser APIs, SQLite, daemon internals, or the sidecar control-plane protocol.
- Sidecar process stamps must have exactly five fields: `app`, `mode`, `namespace`, `ipc`, and `source`.
- Orchestration layers (`tools-dev`, `tools-pack`, packaged launchers) must call package primitives; do not hand-build `--od-stamp-*` args or process-scan regexes.
- Packaged runtime paths must be namespace-scoped and independent from daemon/web ports; ports are transient transport details only.
- Default runtime files live under `<project-root>/.tmp/<source>/<namespace>/...`; POSIX IPC sockets are fixed at `/tmp/open-design/ipc/<namespace>/<app>.sock`.

## Git commit policy

- Git commits must not include `Co-authored-by` trailers or any other co-author metadata.

## Validation strategy

- After package, workspace, or command-entry changes, run `pnpm install` so workspace links and generated dist entries stay fresh.
- Before marking regular work ready, run at least `pnpm typecheck` and `pnpm test`; run `pnpm build` as well when build boundaries are involved.
- For the web/e2e loop, prefer `pnpm tools-dev run web --daemon-port <port> --web-port <port>`.
- On a GUI-capable machine, validate desktop by running `pnpm tools-dev`, then `pnpm tools-dev inspect desktop status`.
- Stamp/namespace changes must validate two concurrent namespaces and run desktop `inspect eval` plus `inspect screenshot` for each namespace.
- Path/log changes must run `pnpm tools-dev logs --namespace <name> --json` and confirm log paths are under `.tmp/tools-dev/<namespace>/...`.

## Build-agent adaptation workflow

Use this sequence when adapting Open Design build flows for another app or product shell:

1. Classify the change first:
	- App runtime change (`apps/web`, `apps/daemon`, `apps/desktop`, `apps/packaged`)
	- Package boundary change (`packages/contracts`, `packages/sidecar-proto`, `packages/sidecar`, `packages/platform`)
	- Tooling/orchestration change (`tools/dev`, `tools/pack`)
	- Container distribution lane (`compose.yaml`, `compose.ghcr.yaml`, `.github/workflows/publish-ghcr.yml`, `.github/workflows/release-docker.yml`)
2. For container and GHCR work, fix the active lane before editing:
	- Default fork GHCR lane: `compose.yaml`
	- Env-file GHCR lane: `compose.ghcr.yaml` plus `.env.ghcr`
	- Explicit local source rebuild lane: `compose.yaml` with `docker compose up --build` or `docker compose build`
	- GHCR publish lane: publish/release workflows plus install/update scripts
	- Prefer the upstream GHCR consume lane only when the required runtime behavior already exists upstream or the fork-only changes do not affect image contents.
	- If CubeCloud customizations on `fork/main` affect the runtime images, treat the fork GHCR publish lane as the deployment source of truth.
	- The default `compose.yaml` runtime should follow the fork GHCR `latest` tag unless the operator explicitly asks to rebuild from local source.
	- A successful local source build does not prove the pulled GHCR images contain the same changes.
	- Workflow presence proves the repo is configured to publish images, not that a fork package already exists or is the deployed source of truth.
3. Run the narrowest validating command first (package-scoped `pnpm --filter ... typecheck|test|build`), then run workspace gates (`pnpm typecheck`, `pnpm test`, and `pnpm build` when build surfaces changed).
	- Important: root `pnpm build` currently maps to `pnpm --filter @open-design/web build`; package-level build checks are still required for daemon/desktop/tools changes.
4. For lifecycle changes, validate through `pnpm tools-dev` commands only; do not use removed root aliases.
5. For stamp/namespace/path logic, require evidence that:
	- stamp fields remain exactly `app`, `mode`, `namespace`, `ipc`, `source`
	- path derivation is namespace-scoped and does not include daemon/web port values
	- orchestration code consumes package primitives instead of hand-rolled arg/regex logic
6. For packaged flows, validate `tools-pack` lanes independently from local `tools-dev` flows; release artifact naming stays canonical while local install paths may be namespace-scoped for multi-instance checks.
7. If the fork is the GHCR publishing lane, keep `fork/main` authoritative for CubeCloud-specific changes and choose the upstream sync method intentionally:
	- cherry-pick when you want selected upstream fixes without taking unrelated runtime or release changes
	- merge or rebase when you want a broader upstream refresh and are prepared to validate the full combined surface before republishing

If a build-agent proposal skips classification, narrow validation, or namespace/path invariants, treat it as incomplete.

## Current adaptation target

This repository is currently being adapted for another app/product shell. For build-agent work, assume this scoped target unless the user changes it:

- Adaptation categories in scope: branding/white-label shell, runtime/process model, build pipeline/CI, and multi-tenant/namespace behavior.
- Primary edit surfaces: `apps/web`, `apps/desktop`, `tools/dev`, and `tools/pack`.
- For containerized distribution decisions, use `docs/cubecloud-openspace-installation.md` as the reference for fork-published GHCR images, install scripts, and update lanes.
- Keep CubeCloud customizations on `fork/main`; only point deployments at upstream GHCR when that does not drop required fork-only runtime behavior.
- Preserve full existing product behavior. Do not remove, narrow, or silently change existing functions as a shortcut for adaptation work.
- Allowed agent actions: review build changes, generate adaptation patches, run validation commands, and prepare release artifacts.
- If a change requires stepping into `apps/daemon`, `apps/packaged`, or `packages/*`, explain the dependency hop before editing and keep the change minimal.

# Common commands

```bash
pnpm install
pnpm tools-dev
pnpm tools-dev start web
pnpm tools-dev run web --daemon-port 17456 --web-port 17573
pnpm tools-dev status --json
pnpm tools-dev logs --json
pnpm tools-dev inspect desktop status --json
pnpm tools-dev inspect desktop screenshot --path /tmp/open-design.png
pnpm tools-dev stop
pnpm tools-dev check
```

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:ui
pnpm test:ui:headed
pnpm test:e2e:live
pnpm check:residual-js
```

```bash
pnpm --filter @open-design/web typecheck
pnpm --filter @open-design/daemon test
pnpm --filter @open-design/desktop build
pnpm --filter @open-design/tools-dev build
pnpm --filter @open-design/tools-pack build
pnpm -r --if-present run typecheck
pnpm -r --if-present run test
```

# FAQ

## Why is there no root `pnpm dev` / `pnpm start`?

To avoid starting daemon, web, and desktop through inconsistent env, port, namespace, or log paths. All local lifecycle flows must go through `pnpm tools-dev`.

## Why should `apps/nextjs` not be restored?

The current web runtime is `apps/web`. The historical `apps/nextjs` layout has been removed from the active repo shape; restoring it would reintroduce duplicate app boundaries and stale scripts.

## How does desktop discover the web URL?

Desktop queries runtime status through sidecar IPC. The web URL comes from `tools-dev` launch status, not from desktop guessing ports or reading web internals.

## How are sidecar-proto, sidecar, and platform split?

`@open-design/sidecar-proto` owns Open Design app/mode/source constants, namespace validation, stamp fields/flags, IPC message schema, status shapes, and error semantics. `@open-design/sidecar` provides only generic bootstrap, IPC transport, path/runtime resolution, launch env, and JSON runtime files. `@open-design/platform` provides only generic OS process stamp serialization, command parsing, and process matching/search primitives, consuming the proto descriptor.

## Where is data written?

The daemon writes `.od/` by default: SQLite at `.od/app.sqlite`, agent CWDs under `.od/projects/<id>/`, and saved renders under `.od/artifacts/`. `OD_DATA_DIR` can relocate data relative to the repo root; Playwright uses it to isolate test data.

## When is `pnpm install` required?

Run `pnpm install` after changing package manifests, workspace layout, command entrypoints, bin/link-related content, or after adding/removing workspace packages.
