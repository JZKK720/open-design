# CubeCloud Fork Release 0.2.2

This brief defines a low-risk upstream sync for the CubeCloud fork without attempting a full upstream `0.4.0` adoption.

## Base state

- Current fork `main`: `9d099de`
- Current fork GHCR `latest`: image version `0.2.1`
- Upstream tag inspected: `open-design-v0.4.0` at `c69dee7`
- Upstream status relative to the fork at inspection time: fork is `101` commits behind and `2` commits ahead

## Release recommendation

- Proposed fork Docker release version: `0.2.2`
- Rationale: this is a patch release on top of the current fork's `0.2.1` image line. The shortlist below backports targeted fixes and packaging improvements, not the broader upstream `0.4.0` feature set.
- Goal: keep CubeCloud-specific runtime behavior intact while refreshing a small number of upstream fixes with lower collision risk.

## Fork extraction already completed on top of this release line

Before any `0.2.2` GHCR publish, keep the current app-config extraction in the release contents:

- daemon-persisted `app-config` now stores only long-lived user prefs
- CubeCloud API mode defaults are served as daemon bootstrap values instead of persisted daemon prefs
- browser-local API settings now stay local after first bootstrap instead of being written back into daemon storage
- the explicit local/private endpoint checkbox and proxy request flag were removed; trusted local/private gateways are now inferred directly from the API base URL

This extraction should ship together with the cherry-pick batch because it directly reduces future upstream merge pressure on the fork.

## Current release-prep status

- Workspace package manifests and internal workspace references are now bumped to `0.2.2`.
- Compose and installer surfaces no longer expose the removed `OD_DEFAULT_ALLOW_LOCAL_API_BASE_URL` knob.
- A fresh upstream `open-design-v0.4.0` dry-run merge now conflicts in 7 files instead of 10, and the shared contract conflicts are gone.
- Actual GHCR publication is still pending a real release commit/tag or an explicitly approved manual push path with authenticated GHCR credentials.

## Cherry-pick shortlist

Pick these in order.

1. `92087b5` `fix(web): isolate preview blob export paths (#429)`
   - Why: targeted preview and export correctness fix.
   - Touched files stay in preview or export surfaces, not the CubeCloud deployment path.
   - Touched files: `apps/web/src/components/ExamplesTab.tsx`, `apps/web/src/components/FileViewer.tsx`, `apps/web/src/components/PreviewModal.tsx`, `apps/web/src/runtime/exports.ts`, `apps/web/src/runtime/srcdoc.ts`, matching tests.
   - Collision risk: low.

2. `a719f02` `fix(web): normalize daemon proxy origins`
   - Why: improves same-origin proxy handling between the web sidecar and daemon.
   - Touched files are sidecar and tooling surfaces rather than the heavily customized chat or settings surfaces.
   - Touched files: `apps/web/sidecar/server.ts`, `apps/web/src/sidecar-proxy.test.ts`, `tools/dev/src/index.ts`.
   - Collision risk: low to medium.

3. `ce4eb92` `fix(desktop): show window on macOS dock activate (#270)`
   - Why: small desktop usability fix with no overlap on CubeCloud container or web runtime changes.
   - Touched files: `apps/desktop/src/main/index.ts`, `apps/desktop/src/main/runtime.ts`.
   - Collision risk: low.

4. `e3b5bf7` `fix(packaged): include nvm/fnm/mise agent CLI bins in packaged PATH (#364)`
   - Why: improves packaged agent discovery when CLIs are installed through common Node version managers.
   - Touched files: `apps/packaged/src/sidecars.ts`.
   - Collision risk: low.

5. `e5ed4bb` `fix(packaged): preserve *_API_KEY env vars for CLI agents (#404)`
   - Why: preserves provider credentials for packaged daemon sidecars.
   - Touched files: `apps/packaged/src/sidecars.ts`.
   - Collision risk: low.

6. Optional: `02638af` `Add linux x64 AppImage to tools-pack and release workflows (#369)`
   - Why: useful only if Linux packaged artifacts matter for the fork release lane.
   - Touched files are concentrated in `tools/pack` and release workflow surfaces.
   - Collision risk: low to medium.
   - Skip this if the fork release is container-first and you do not need Linux desktop artifacts now.

## Do not cherry-pick in the first pass

Hold these for a later, broader upgrade because they touch the same daemon, web, and contract surfaces the CubeCloud fork already customized.

- `c3d9136` `Add live artifacts and Composio connector catalog (#381)`
- `76e6c7a` `feat: Critique Theater Phase 4 (persistence + transcript + orchestrator) (#481)`
- `79fcaef` `Add Tweaks mode for HTML previews with picker, pod selection, and batched chat attachments (#513)`
- `cbe2baf` `feat(web): add skills & design systems management page in settings (#535)`
- `33c3b94` `feat(daemon): add od mcp - expose Open Design as an MCP server (#399)`
- `179b23d` `Modernize multi-provider API proxy routing`
- `a3a0ae6` `fix(daemon): respect baseUrl path verbatim in OpenAI-compat proxy (#410)`
- `963bbf2` `release: Open Design 0.4.0 (#454)`
- `c69dee7` `fix(release): defer Linux artifact from 0.4.0 stable`

`a3a0ae6` is valuable for OpenAI-compatible provider base paths, but it lands in `apps/daemon/src/server.ts`, which already has high CubeCloud overlap. Treat it as a manual port or second-wave cherry-pick, not part of the low-risk batch.

## Cherry-pick commands

Run these on a review branch first, not directly on `fork/main`.

```bash
git cherry-pick 92087b5 a719f02 ce4eb92 e3b5bf7 e5ed4bb
```

If Linux packaged artifacts matter for this fork release:

```bash
git cherry-pick 02638af
```

## Validation after cherry-picks

Run the narrowest checks that match the touched surfaces.

```bash
pnpm --filter @open-design/web test
pnpm --filter @open-design/desktop build
pnpm --filter @open-design/packaged build
pnpm --filter @open-design/tools-dev build
pnpm --filter @open-design/tools-pack build
pnpm typecheck
```

If you cherry-pick `02638af`, keep the `tools-pack` build check mandatory.

## Release execution

After the cherry-picks are committed onto `fork/main` and the remaining proxy/settings extraction is either completed or intentionally deferred, run the existing Docker release workflow with:

- `version`: `0.2.2`
- `publish_latest`: `true`

Suggested release notes body:

```text
CubeCloud fork patch release on top of fork runtime `0.2.1`.

CubeCloud fork extraction included in this release:
- stop persisting CubeCloud API bootstrap defaults in daemon app-config
- keep CubeCloud API defaults env-driven and browser-local after first bootstrap

Cherry-picked upstream fixes from the `0.4.0` delta:
- 92087b5 fix(web): isolate preview blob export paths
- a719f02 fix(web): normalize daemon proxy origins
- ce4eb92 fix(desktop): show window on macOS dock activate
- e3b5bf7 fix(packaged): include nvm/fnm/mise agent CLI bins in packaged PATH
- e5ed4bb fix(packaged): preserve *_API_KEY env vars for CLI agents

This release intentionally does not claim full upstream `0.4.0` parity.
```

## Why this is lower risk than merge or rebase

- It avoids the high-collision daemon and settings work that dominates the upstream `0.4.0` delta.
- It preserves CubeCloud-specific runtime and deployment behavior on `fork/main`.
- It refreshes the fork's own GHCR `latest` images with a controlled patch-level release rather than a broad runtime upgrade.