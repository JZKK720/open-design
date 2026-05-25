# CubeCloud Fork Release 0.4.1

This brief defines the `0.4.1` named Docker release for the CubeCloud fork after restoring the local Ollama bootstrap path, fixing trusted local Ollama smoke tests, and republishing the fork GHCR lane from `fork/main` commit `7661018c`.

## Base state

- Current fork `main`: `7661018c`
- Current fork GHCR `latest`: OCI revision `7661018cc996a570bd62af52768f8772ef37b44f`
- Previous named Docker release: `open-design-docker-v0.4.0` at commit `1f37351f`
- Release lane policy after this publish: all downstream Docker machines should keep following fork GHCR `latest`; the named `0.4.1` tag exists as a release record and fallback, not as the routine deployment target

## Release recommendation

- Proposed fork Docker release version: `0.4.1`
- Rationale: this is the next patch on the fork Docker release track after `0.4.0`, and it captures the Ollama/bootstrap repair set plus the restored daemon runtime content without changing the default downstream update lane.
- Goal: publish a named, auditable Docker release while keeping the operator default on the already-validated fork GHCR `latest` lane.

## Fork behavior preserved in this release

These fork-specific behaviors remain part of the release and should be treated as intentional runtime overlays, not merge leftovers.

- `/api/app-config` still returns long-lived preferences in `config` plus fork bootstrap defaults in `bootstrap`
- daemon bootstrap defaults now correctly accept `OD_DEFAULT_API_PROTOCOL=ollama` and advertise the local Ollama base URL and model through `bootstrap`
- trusted local Ollama gateways still work without an API key for the intended fork case `host.docker.internal`
- trusted local Ollama smoke tests now use a longer default timeout, so a healthy self-hosted model does not fail at the old generic `12s` provider probe limit
- the daemon image still includes bundled `plugins/` and `design-templates/`, so the container runtime exposes the full bundled inventories
- plugin-local skill refs such as `./SKILL.md` still resolve without the false warning introduced by the earlier runtime regression
- the fork GHCR lane remains the deployment source of truth for downstream Docker machines, and all routine updates should continue to follow `latest`

## Validation completed before release

- the release commit landed on fork `main` as `7661018c`
- `publish-ghcr #22` refreshed both fork GHCR `latest` tags to OCI revision `7661018cc996a570bd62af52768f8772ef37b44f` in `13m 18s`
- `release-docker #6` completed successfully for `0.4.1` in `20m 57s` with `publish_latest=true`
- targeted tracked-source validations passed before the publish:
  - `corepack pnpm --filter @open-design/daemon build`
  - `corepack pnpm exec vitest run tests/connection-test.test.ts -c vitest.config.ts -t "connection test timeout overrides"`
  - `corepack pnpm exec vitest run tests/app-config.test.ts -c vitest.config.ts`
- the refreshed downstream GHCR lane passed via `docker compose --env-file .env.ghcr -f compose.ghcr.yaml pull` and `up -d`
- the refreshed runtime matched the newly published image metadata:
  - daemon `latest` digest `sha256:473d490c4d81ef7a5a91fb5aa37d650c23c951851c024a537d9743f9a0cbde17`
  - web `latest` digest `sha256:b67533168eff5e244bda913c31a1811faf92902367c6bb07196e4e5002f1ad4e`
  - both running containers reported `org.opencontainers.image.revision=7661018cc996a570bd62af52768f8772ef37b44f`
  - both running containers reported `org.opencontainers.image.version=0.4.1`
- post-refresh runtime smoke checks passed:
  - `http://localhost:7456/api/health` returned `200`
  - `http://localhost:7831` returned `200`
  - `/api/app-config` still returned the Ollama bootstrap payload with `mode=api`, `apiProtocol=ollama`, `baseUrl=http://host.docker.internal:11434`, and `model=gemma4:e2b-it-q4_K_M`
  - `/api/plugins` returned `401` bundled plugins
  - `/api/design-templates` returned `121` bundled design templates
  - authenticated live `/api/test/connection` against local Ollama returned success after the refresh

## Workflow result

`.github/workflows/release-docker.yml` completed successfully from `fork/main` commit `7661018c` with:

- `version`: `0.4.1`
- `publish_latest`: `true`

Published `notes` input:

```text
CubeCloud fork patch Docker release on top of the validated 0.4.0 lane, now published from fork main 7661018c.

Highlights in this release:
- restores daemon bootstrap defaults for local Ollama BYOK flows
- allows trusted local Ollama endpoints to run without an API key
- restores bundled plugins and design templates in the daemon image
- fixes plugin-local skill resolution warnings
- extends trusted local Ollama connection probes so self-hosted models do not fail at the old 12s smoke-test limit
- refreshes fork GHCR latest and provides a pinned Docker release for downstream machines

Validation completed before this release:
- daemon build passed
- daemon connection-test timeout regressions passed
- daemon app-config regressions passed
- live GHCR daemon/web runtime remained healthy
- authenticated live /api/test/connection to local Ollama returned success against gemma4:e2b-it-q4_K_M
```

## Published release outputs

The named release now exposes:

- GitHub release tag: `open-design-docker-v0.4.1`
- GHCR daemon image: `ghcr.io/jzkk720/open-design-daemon:0.4.1`
- GHCR web image: `ghcr.io/jzkk720/open-design-web:0.4.1`
- named release digests:
  - daemon `0.4.1`: `sha256:473d490c4d81ef7a5a91fb5aa37d650c23c951851c024a537d9743f9a0cbde17`
  - web `0.4.1`: `sha256:b67533168eff5e244bda913c31a1811faf92902367c6bb07196e4e5002f1ad4e`
- refreshed rolling tags:
  - `ghcr.io/jzkk720/open-design-daemon:latest`
  - `ghcr.io/jzkk720/open-design-web:latest`

## Install and update guidance

Operator policy after `0.4.1`: all downstream machines should continue to follow fork GHCR `latest`.

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

Linux or macOS pinned install for the named release remains available only as a fallback:

```bash
curl -fsSL https://raw.githubusercontent.com/JZKK720/open-design/open-design-docker-v0.4.1/scripts/install-open-design-docker.sh | bash -s -- --owner jzkk720 --repository open-design --repo-ref open-design-docker-v0.4.1 --image-tag 0.4.1
```

Windows PowerShell pinned install for the named release remains available only as a fallback:

```powershell
$script = Join-Path $env:TEMP 'install-open-design-docker.ps1'; Invoke-WebRequest 'https://raw.githubusercontent.com/JZKK720/open-design/open-design-docker-v0.4.1/scripts/install-open-design-docker.ps1' -OutFile $script; & $script -Owner 'jzkk720' -Repository 'open-design' -RepoRef 'open-design-docker-v0.4.1' -ImageTag '0.4.1'
```

## Operator note

This release should be treated as the named audit point on top of the already-validated fork `latest` lane, not as a deployment retarget. All routine downstream updates should continue to follow fork GHCR `latest`. The named `0.4.1` tag exists for traceability, rollback planning, and controlled fallback only.