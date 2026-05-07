---
name: build-adaptation
description: Review and adapt Open Design for another branded or white-label app shell when the task involves build pipeline changes, runtime/process model changes, packaging changes, release preparation, GHCR or container distribution decisions, upstream-vs-fork image strategy, or namespace-aware multi-tenant behavior. Use this skill only after the adaptation scope and must-preserve invariants are explicit.
argument-hint: "[target shell or product] [affected surfaces] [must-preserve invariants]"
disable-model-invocation: true
---

# Build Adaptation

Use this skill for repository adaptation work that changes how Open Design is branded, packaged, launched, validated, or isolated for another app shell.

## Required input

Do not start build adaptation from generic assumptions. First collect or confirm an adaptation brief using [adaptation-brief-template.md](./adaptation-brief-template.md).

The brief must identify:

- adaptation categories in scope
- primary edit surfaces
- must-preserve invariants
- whether the task is review-only, patch generation, validation, and/or release preparation
- if container or GHCR work is in scope: the active lane under review, target image owner/repository/tag, whether fork-only changes must ship, and the preferred upstream sync method
- whether the preferred image strategy is upstream GHCR first with fork GHCR fallback, or fork GHCR as the default source of truth

If any of these are missing, ask for them before proposing automation or edits.

## Repo anchors

Read the repo instructions that govern build adaptation before changing anything:

- [root agent guide](../../../AGENTS.md)
- [apps agent guide](../../../apps/AGENTS.md)
- [tools agent guide](../../../tools/AGENTS.md)
- [container installation plan](../../../docs/cubecloud-openspace-installation.md)

Default adaptation focus for this repository:

- `apps/web`
- `apps/desktop`
- `tools/dev`
- `tools/pack`

If the task requires `apps/daemon`, `apps/packaged`, or `packages/*`, explain the dependency hop before editing and keep the boundary crossing minimal.

## Workflow

1. Classify the change first.
   - app runtime change
   - tooling or orchestration change
   - package boundary change
   - packaged runtime or release flow change
   - container distribution or GHCR lane change
2. If container or GHCR distribution is in scope, classify the active lane before touching files.
   - default fork GHCR lane -> `compose.yaml`
   - env-file GHCR lane -> `compose.ghcr.yaml` plus `.env.ghcr`
   - explicit local source rebuild lane -> `compose.yaml` with `docker compose up --build` or `docker compose build`
   - GHCR publish lane -> `.github/workflows/publish-ghcr.yml`, `.github/workflows/release-docker.yml`, and the install or update scripts
   - prefer the upstream GHCR consume lane only when required fork-only customizations are already upstream or do not change image contents
   - if required CubeCloud customizations live only on `fork/main` and affect runtime images, use the fork GHCR publish lane as the deployment source of truth
   - the default `compose.yaml` runtime should follow fork GHCR `latest` unless the operator explicitly asks to rebuild from local source
   - local repo changes and validated `fork/main` pushes should refresh fork GHCR `latest` first so downstream machines only need pull/update
   - a successful local source build does not prove pulled GHCR images contain the same changes
   - workflow presence alone does not prove a fork package already exists; verify actual publication state when the task depends on it
3. State the invariants that must hold after the change.
   - preserve existing product behavior
   - keep `tools-dev` as the only local lifecycle entry point
   - keep sidecar stamp fields exactly `app`, `mode`, `namespace`, `ipc`, `source`
   - keep namespace-derived paths independent from daemon and web port values
   - do not introduce parallel lifecycle commands when `tools-dev` or `tools-pack` can be extended
   - keep the default fork GHCR lane, the env-file GHCR lane, and explicit local source rebuilds conceptually separate in review and validation
4. Pick the narrowest validating command first.
   - package-scoped `pnpm --filter ... typecheck|test|build`
   - workspace `pnpm typecheck`
   - workspace `pnpm test`
   - workspace `pnpm build` only when the changed surface actually depends on it
5. Apply the root build nuance.
   - root `pnpm build` currently maps to `pnpm --filter @open-design/web build`
   - daemon, desktop, packaged, and tooling changes still need package-scoped build checks
6. For lifecycle and packaging changes, validate the correct lane.
   - `pnpm tools-dev ...` for local runtime lifecycle checks
   - `pnpm tools-pack ...` for packaged install/build/release checks
7. For namespace and path changes, require evidence.
   - paths/logs remain namespace-scoped
   - ports are transport-only and do not leak into runtime/data/cache path derivation
   - orchestration uses shared primitives instead of copied stamp or process matching logic
8. For fork-published GHCR images, define the upstream sync policy explicitly.
   - keep `fork/main` authoritative for CubeCloud-specific runtime changes
   - owner-reviewed cherry-picks from `upstream/main` are the default sync method for carrying upstream fixes into `fork/main`
   - merge or rebase is an explicit exception for a broader upstream refresh and must be treated as a larger validation and republish event

## Review mode

When asked to review:

- report findings first, ordered by severity
- focus on behavioral regressions, missing validation, incorrect boundary crossings, broken invariants, and wrong assumptions about what local builds or workflow files prove about deployed GHCR images
- flag any proposal that skips adaptation scoping, narrow validation, or namespace/path checks as incomplete

## Patch mode

When asked to implement:

- make the smallest change that satisfies the adaptation brief
- preserve existing functions; do not remove or narrow features as a shortcut
- prefer extending `tools/dev` and `tools/pack` over adding new command surfaces
- keep branded-shell changes separate from unrelated runtime refactors whenever possible

## Output contract

Return a concise result with:

- adaptation scope used
- active image lane and source of truth for image contents when container distribution is involved
- whether upstream GHCR was acceptable as-is or rejected because fork-only runtime changes must ship
- files or surfaces touched
- invariants preserved
- validation commands run
- remaining dependency hops or open risks
- upstream sync method when a fork GHCR lane is involved