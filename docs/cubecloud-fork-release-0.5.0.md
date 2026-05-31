# CubeCloud Fork Release 0.5.0

This brief defines the planned `0.5.0` named Docker release for the CubeCloud fork after integrating upstream `main` through `53fb1758` on top of the `open-design-v0.8.0` product line.

## Base state

- Planned fork `main` release commit: pending final merge commit after the validated `upstream/main` integration
- Upstream base absorbed by this release: `open-design-v0.8.0` at `c20d1560` plus subsequent upstream `main` fixes through `53fb1758`
- Previous named Docker release: `open-design-docker-v0.4.2` at commit `12c40ed8`
- Current downstream operator policy remains unchanged: routine Docker machines should continue following fork GHCR `latest`, while `0.5.0` exists as the auditable pinned fallback for controlled environments

## Release recommendation

- Proposed fork Docker release version: `0.5.0`
- Rationale: this is the first fork uptake of the upstream `0.8.x` architecture shift, so a minor fork release is a clearer operator signal than another patch tag on the `0.4.x` line
- Goal: publish a named, reproducible Docker release while keeping the default downstream update lane on fork GHCR `latest`

## Upstream 0.8 capabilities adopted in this release

- plugin-first catalog and landing-page routing surfaces from upstream `0.8.x`
- headless and runtime expansion work now present in upstream `main`
- additional daemon and web platform fixes shipped after `open-design-v0.8.0`, including the current upstream `main` tip at merge time

## Fork behavior preserved in this release

These CubeCloud-specific behaviors remain intentional runtime overlays and are still part of the release:

- trusted local OpenAI-compatible gateways can still proxy without a bearer key when the fork deployment path uses a local endpoint
- the OpenAI-compatible daemon proxy still retries the raw `/chat/completions` path when a versioned path returns `404`
- local Ollama endpoints still label as `Ollama Local API` in the web UI
- provider quick-fill matching still treats local self-hosted Ollama presets as the same logical provider even when the exact base URL string differs
- the fork app icon remains the CubeCloud-specific asset instead of the upstream icon
- the fork GHCR lane remains the deployment source of truth for downstream Docker machines, and routine updates should continue to use pull plus restart instead of local source rebuilds

## Merge notes

- A broad merge preview from `origin/main` to `upstream/main` resolved with 22 conflicts, but only 7 of those were runtime or UI files
- The main runtime merge hotspots were:
  - `apps/daemon/src/chat-routes.ts`
  - `apps/web/src/providers/api-proxy.ts`
  - `apps/web/src/utils/apiProtocol.ts`
  - `apps/web/src/components/EntryShell.tsx`
  - `apps/landing-page/app/_components/header.tsx`
  - `apps/landing-page/app/pages/[locale]/plugins/index.astro`
  - `apps/web/public/app-icon.svg`
- Repo guidance and translated README conflicts were resolved in favor of the upstream product docs while preserving fork-specific repo guidance and local ignore rules

## Validation completed before release

- merged workspace install completed:
  - `pnpm install`
- focused daemon build passed:
  - `pnpm --filter @open-design/daemon build`
- focused web typecheck passed:
  - `pnpm --filter @open-design/web typecheck`
- focused web protocol regression test passed:
  - `pnpm --filter @open-design/web exec vitest run -c vitest.config.ts tests/utils/apiProtocol.test.ts`
- landing-page build passed:
  - `pnpm --filter @open-design/landing-page build`

## Planned workflow inputs

Run `.github/workflows/release-docker.yml` from fork `main` with:

- `version`: `0.5.0`
- `publish_latest`: `true`

Suggested `notes` input:

```text
CubeCloud fork minor Docker release on top of the validated upstream 0.8 main integration.

Highlights in this release:
- integrates upstream Open Design 0.8-era plugin and headless platform changes through upstream/main 53fb1758
- preserves trusted local OpenAI-compatible proxy behavior without forcing API keys on local endpoints
- preserves local Ollama labeling and provider quick-fill behavior in the web UI
- keeps the CubeCloud fork app icon and fork GHCR deployment lane
- refreshes fork GHCR latest and provides a pinned Docker release for downstream machines

Validation completed before this release:
- merged workspace install passed
- web typecheck passed
- daemon build passed
- focused web apiProtocol regression test passed
- landing-page build passed
```

## Expected published release outputs

After the workflow completes, the named release should expose:

- GitHub release tag: `open-design-docker-v0.5.0`
- GHCR daemon image: `ghcr.io/jzkk720/open-design-daemon:0.5.0`
- GHCR web image: `ghcr.io/jzkk720/open-design-web:0.5.0`
- refreshed rolling tags:
  - `ghcr.io/jzkk720/open-design-daemon:latest`
  - `ghcr.io/jzkk720/open-design-web:latest`

## Install and update guidance

Operator policy after `0.5.0` should stay the same: validation and routine downstream machines continue following fork GHCR `latest`.

Existing repo checkout using the explicit GHCR lane:

```bash
docker login ghcr.io
docker compose --env-file .env.ghcr -f compose.ghcr.yaml pull
docker compose --env-file .env.ghcr -f compose.ghcr.yaml up -d
```

`.env.ghcr` should keep:

```dotenv
OPEN_DESIGN_IMAGE_OWNER=jzkk720
OPEN_DESIGN_IMAGE_REPOSITORY=open-design
OPEN_DESIGN_IMAGE_TAG=latest
```

If a machine must stay pinned to the named release instead of following `latest`, set `OPEN_DESIGN_IMAGE_TAG=0.5.0` in `.env.ghcr` before the pull step.

## Operator note

This release should be treated as the named audit point on top of the already-validated fork `latest` lane, not as a deployment retarget. All routine downstream updates should continue to follow fork GHCR `latest`, while `0.5.0` exists for traceability, rollback planning, and controlled fallback.