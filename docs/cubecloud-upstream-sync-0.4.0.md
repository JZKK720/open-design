# CubeCloud Upstream Sync Toward 0.4.0

This brief answers two questions for the CubeCloud fork:

1. Which current fork changes are safe to keep as a fork overlay versus which ones should be moved out of core runtime files.
2. What actually conflicts today when the fork is dry-run merged with upstream `open-design-v0.4.0`.

## Current baseline

- Fork `main`: `9d099de`
- Upstream tag inspected: `open-design-v0.4.0` at `c69dee7`
- Upstream `main` at inspection time: `5df04c2`
- Relative state at inspection time: fork is `101` commits behind and `2` commits ahead

## Keep As Overlay

These changes are good fork-specific boundaries. They are either branding assets, deployment defaults, or packaging resources and do not need to be merged back into upstream runtime files.

### Branding and packaging assets

- `apps/web/public/logo.svg`
- `apps/web/public/app-icon.svg`
- `assets/cubecloud-logos/**`
- `tools/pack/resources/mac/icon.icns`
- `tools/pack/resources/win/icon.ico`

These are correct fork overlay surfaces. They should remain fork-owned.

### Deployment and GHCR defaults

- `compose.yaml`
- `compose.ghcr.yaml`
- `.env.ghcr.example`
- `docs/cubecloud-openspace-installation.md`
- `scripts/install-open-design-docker.sh`
- `scripts/install-open-design-docker.ps1`

These are also valid fork-owned surfaces. They define how the CubeCloud fork is deployed and updated and should stay separate from upstream product runtime work.

### Container build lane

- `Dockerfile.daemon`
- `Dockerfile.web`
- `docker/nginx/open-design.conf`

These are deployment-lane files. They can stay fork-owned as long as the fork intentionally owns its GHCR publishing lane. They are not the main source of upstream merge pain.

## Move Out Of Core Runtime Files

These current CubeCloud changes are the main reason regular upstream merges are expensive. They embed local gateway and CubeCloud execution defaults inside shared daemon, web, and contract files that upstream is actively evolving.

### Local API mode and gateway settings in shared app config

Current fork-owned fields were added to:

- `apps/daemon/src/app-config.ts`
- `packages/contracts/src/api/app-config.ts`
- `apps/web/src/state/config.ts`

Added fork-specific fields include:

- `mode`
- `baseUrl`
- `allowLocalApiBaseUrl`
- `model`
- `apiProtocol`
- `apiProviderBaseUrl`

Why this should move:

- These are deployment or local environment defaults for CubeCloud.
- They are currently persisted through shared config contracts and local storage, which causes merge overlap with upstream settings and config work.

Recommended extraction target:

- Keep CubeCloud default values in daemon env and compose defaults.
- If the app still needs runtime bootstrap values, expose them through a narrow daemon bootstrap surface rather than expanding the shared long-lived config contract.

Current progress on this seam:

- Implemented: daemon-persisted `app-config` now stores only long-lived user prefs (`onboardingCompleted`, `agentId`, `agentModels`, `skillId`, `designSystemId`).
- Implemented: `GET /api/app-config` now returns CubeCloud API defaults as a separate bootstrap payload instead of merging them into persisted prefs.
- Implemented: the web bootstrap path applies those API defaults only when the local API config is still on the untouched built-in defaults, so user-local API settings stay browser-owned.
- Implemented: the explicit local/private checkbox and proxy request flag were removed; the daemon now infers trusted local/private gateways directly from the API base URL.
- Remaining work: reduce the remaining app-shell and provider overlap listed below.

### Local/private-network gateway allowance in proxy contracts and providers

Current fork-owned local-gateway behavior lives in:

- `packages/contracts/src/api/proxy.ts`
- `apps/web/src/providers/anthropic-compatible.ts`
- `apps/web/src/providers/openai-compatible.ts`
- `apps/web/src/utils/apiBaseUrl.ts`
- `apps/web/src/components/SettingsDialog.tsx`
- `apps/daemon/src/server.ts`

Fork-specific behavior includes:

- allowing local or private-network base URLs
- allowing API-key-less calls to trusted local gateways
- exposing the `allowLocalNetwork` request switch
- showing a fork-specific “Local/private endpoint” control in settings

Why this should move:

- Upstream is actively changing provider routing, settings UX, and proxy behavior.
- This is the highest-collision CubeCloud customization after `server.ts`.

Recommended extraction target:

- Keep the local/private gateway trust policy daemon-side.
- Keep CubeCloud gateway defaults env-driven.
- Avoid expanding shared request and config contracts unless the behavior is intended to become upstream-compatible.
- If the local-gateway UX must stay fork-only, keep it behind a narrow fork-specific settings seam rather than mixing it into the main shared settings flow.

### Default API-mode bootstrapping in app startup

Current fork-owned startup behavior lives in:

- `apps/web/src/App.tsx`

Fork behavior includes:

- merging daemon-sourced config fields into the app state for CubeCloud-specific API mode values
- defaulting to `mode = 'api'` when the daemon is not live

Why this should move:

- Upstream `App.tsx` is changing rapidly.
- Fork-only execution defaults should be injected through a narrower bootstrap or provider seam, not carried as ongoing divergence in the main app shell component.

## Dry-Run Merge Result Against Upstream 0.4.0

A non-destructive merge dry-run was performed in a temporary detached worktree:

- base: fork `HEAD` `9d099de`
- target: `open-design-v0.4.0` at `c69dee7`

### Conflict files after the current extraction work

After the app-config split and the proxy trust-flag removal, a fresh dry-run merge against `open-design-v0.4.0` reduced the live conflict set from 10 files to 7.

These files still produce real content conflicts:

- `apps/daemon/src/server.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/components/SettingsDialog.tsx`
- `apps/web/src/providers/anthropic-compatible.ts`
- `apps/web/src/providers/openai-compatible.ts`
- `apps/web/src/state/config.ts`
- `apps/web/tests/state/config.test.ts`

Resolved from the previous conflict set:

- `apps/daemon/src/app-config.ts`
- `packages/contracts/src/api/app-config.ts`
- `packages/contracts/src/api/proxy.ts`

### Important non-conflict observation

The fork-owned branding, packaging, compose, GHCR, installer, and logo asset files did not produce merge conflicts in this dry-run.

That means the main sync blocker is not rebranding. The sync blocker is the fork-owned local API mode and gateway behavior currently embedded in shared runtime files.

## What Remains After The Recommended Cleanup

If CubeCloud-specific local gateway defaults and trust policy are extracted out of shared config and app settings seams, the remaining fork overlay should mostly be:

- branding assets
- packaging icons
- compose and GHCR defaults
- installer and deployment docs
- optional daemon-side local-environment wiring kept behind a narrow boundary

In that state, regular upstream merges should become much lower risk because the current live conflict set is almost entirely tied to the extractable runtime behavior above.

The one area likely to remain fork-sensitive even after cleanup is daemon-side local gateway trust handling if it remains intentionally fork-only. That should be isolated to a narrow helper or boundary near the proxy implementation rather than left spread across contracts, providers, app config, and settings UI.

## Recommended Sync Strategy

1. Finish extracting CubeCloud local/private gateway policy out of shared proxy/settings/provider files.
2. Keep branding, GHCR, compose, installer, and packaging resources as fork overlay.
3. Re-run the upstream `0.4.0` merge dry-run after the proxy seam cleanup.
4. If the conflict set drops to the narrow daemon-only boundary, switch the fork from selective cherry-picks to a regular merge-based sync flow.
5. Republish fork GHCR after each validated upstream sync.

## Short-term conclusion

Today, before cleanup, selective cherry-picks are still the lower-risk way to absorb upstream fixes.

Long-term, if the goal is to stay close to upstream `0.4.x` and later while preserving CubeCloud identity and local environment defaults, the fork should be restructured so CubeCloud is an overlay plus env-driven deployment profile rather than an ongoing divergence inside daemon, web, and contract runtime files.