# CubeCloud Fork Release 0.4.2

This brief defines the planned `0.4.2` named Docker release for the CubeCloud fork after fixing the web-side stale bootstrap snapshot that kept older Ollama models such as `gemma4:e2b-it-q4_K_M` pinned in browser state even after the daemon bootstrap moved to `qwen3.5:35b-a3b`.

## Base state

- Planned fork `main` release commit: `b854a3fb`
- Previous named Docker release: `open-design-docker-v0.4.1` at commit `7661018c`
- Current downstream operator policy remains unchanged: routine Docker machines should continue following fork GHCR `latest`, while the named `0.4.2` tag exists as the auditable pinned fallback for controlled environments

## Release recommendation

- Proposed fork Docker release version: `0.4.2`
- Rationale: this is the next patch on the fork Docker release track after `0.4.1`, and it captures the browser-side bootstrap migration fix on top of the already-validated local Ollama gateway and discovery work
- Goal: publish a named, reproducible Docker release while keeping the default downstream update lane on fork GHCR `latest`

## Fork behavior preserved in this release

These fork-specific behaviors remain intentional runtime overlays and are still part of the release:

- `/api/app-config` continues to return long-lived daemon preferences in `config` plus fork bootstrap defaults in `bootstrap`
- trusted local Ollama gateways such as `http://host.docker.internal:11434` still work without an API key for the intended fork deployment path
- local Ollama provider-model discovery remains available without an API key for the trusted self-hosted case
- the UI continues to distinguish managed Ollama Cloud from the trusted self-hosted Ollama preset
- browser-persisted execution config now distinguishes daemon bootstrap defaults from explicit user overrides, so a newer daemon bootstrap pin can replace older bootstrap-derived browser state without clobbering a real user customization
- the fork GHCR lane remains the deployment source of truth for downstream Docker machines, and routine updates should continue to use pull plus restart instead of local source rebuilds

## Validation completed before release

- focused web regression tests passed for the stale-bootstrap migration and custom-override preservation:
  - `corepack pnpm --filter @open-design/web exec vitest run -c vitest.config.ts tests/state/config.test.ts tests/App.test.ts`
- focused web typecheck passed for the touched slice:
  - `corepack pnpm --filter @open-design/web exec tsc -b --noEmit`
- broader workspace and package-scoped validation passed before release:
  - `corepack pnpm guard`
  - `corepack pnpm typecheck`
  - `corepack pnpm --filter @open-design/web build`

## Planned workflow inputs

Run `.github/workflows/release-docker.yml` from fork `main` with:

- `version`: `0.4.2`
- `publish_latest`: `true`

Suggested `notes` input:

```text
CubeCloud fork patch Docker release on top of the validated 0.4.1 lane, now published from fork main b854a3fb.

Highlights in this release:
- fixes stale browser bootstrap snapshots so the web app adopts newer daemon-pinned Ollama defaults again
- preserves explicit user BYOK execution overrides instead of overwriting them during bootstrap refresh
- keeps trusted local Ollama discovery and self-hosted labeling behavior from the 0.4.1 lane
- refreshes fork GHCR latest and provides a pinned Docker release for downstream machines

Validation completed before this release:
- focused web config regression tests passed
- focused web typecheck passed
- workspace guard passed
- workspace typecheck passed
- web build passed
```

## Expected published release outputs

After the workflow completes, the named release should expose:

- GitHub release tag: `open-design-docker-v0.4.2`
- GHCR daemon image: `ghcr.io/jzkk720/open-design-daemon:0.4.2`
- GHCR web image: `ghcr.io/jzkk720/open-design-web:0.4.2`
- refreshed rolling tags:
  - `ghcr.io/jzkk720/open-design-daemon:latest`
  - `ghcr.io/jzkk720/open-design-web:latest`

## Install and update guidance

Operator policy after `0.4.2` should stay the same: validation and routine downstream machines continue following fork GHCR `latest`.

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

If a machine must stay pinned to the named release instead of following `latest`, set `OPEN_DESIGN_IMAGE_TAG=0.4.2` in `.env.ghcr` before the pull step.

## Operator note

This release should be treated as the named audit point on top of the already-validated fork `latest` lane, not as a deployment retarget. All routine downstream updates should continue to follow fork GHCR `latest`, while `0.4.2` exists for traceability, rollback planning, and controlled fallback.