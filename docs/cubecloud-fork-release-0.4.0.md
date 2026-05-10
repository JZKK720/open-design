# CubeCloud Fork Release 0.4.0

This brief defines the current `0.4.0` named Docker release for the CubeCloud fork after the validated upstream `0.6.0` integration and the split-port Docker proxy fix now running on `fork/main`.

## Base state

- Current fork `main`: `1f37351f`
- Current fork GHCR `latest`: OCI revision `1f37351fcbe69bf517fe0befb913d86a5dea6cb5`
- Previous named Docker release: `open-design-docker-v0.3.0` at commit `02b6486`
- Upstream status absorbed into the fork for this release: the validated upstream `0.6.0` merge is now integrated on top of the fork while keeping the fork-only runtime overlays intact

## Release recommendation

- Proposed fork Docker release version: `0.4.0`
- Rationale: this is the next minor on the fork Docker release track after `0.3.0`, and it captures a broader upstream `0.6.0`-era integration instead of a narrow patch on top of the previous named snapshot.
- Goal: publish a named, pin-able Docker release on top of the already-validated fork GHCR `latest` lane without claiming that CubeCloud-specific overlays were removed.

## Fork behavior preserved in this release

These fork-specific behaviors remain part of the release and should be treated as intentional runtime overlays, not merge leftovers.

- `/api/app-config` still returns long-lived preferences in `config` plus fork bootstrap defaults in `bootstrap`
- the web config merge path still applies daemon bootstrap values only when local API settings remain at built-in defaults
- trusted local OpenAI-compatible gateways still work without an API key for the intended fork cases such as `host.docker.internal` and direct private IPv4 endpoints
- internal IPv6 and mapped-private IPv6 endpoints remain blocked before proxying
- the fork GHCR lane remains the deployment source of truth for downstream Docker machines
- the split-port Docker lane now preserves the full forwarded browser `Host` header and `OD_WEB_PORT`, so guarded routes such as `/api/app-config` work behind the web proxy on `:7831`
- the restored `Connectors` top tab is present in the integrated `0.6.0` runtime instead of disappearing behind the upstream merge

## Validation completed before release

- the release commit landed on fork `main` as `1f37351f`
- `publish-ghcr` refreshed both fork GHCR `latest` tags to OCI revision `1f37351fcbe69bf517fe0befb913d86a5dea6cb5`
- the merge preview worktree passed `pnpm guard`
- the merge preview worktree passed `pnpm typecheck`
- targeted post-merge tests passed:
  - `pnpm --filter @open-design/daemon test -- tests/app-config.test.ts`
  - `pnpm --filter @open-design/web test -- tests/state/config.test.ts tests/components/App.connectors.test.tsx`
- the refreshed workspace passed `pnpm install` followed by `pnpm --filter @open-design/web build`
- the isolated preview stack passed browser/runtime smoke validation on ports `18456` and `18831`, including the restored `Connectors` navigation surface
- the real downstream GHCR lane passed via `docker compose --env-file .env.ghcr -f compose.ghcr.yaml pull` and `up -d`, with matching image revisions plus healthy `http://localhost:7831`, healthy `http://localhost:7456/api/health`, proxied `/api/app-config` returning `200`, and the `Connectors` surface loading in the browser

## Workflow result

`.github/workflows/release-docker.yml` completed successfully from `fork/main` commit `1f37351f` with:

- `version`: `0.4.0`
- `publish_latest`: `true`

Published `notes` input:

```text
CubeCloud fork minor Docker release on top of the validated upstream 0.6.0 integration now published on fork main `1f37351f`.

Highlights in this release:
- integrates the validated upstream 0.6.0 merge onto the CubeCloud fork
- includes the split-port Docker proxy Host-header fix for guarded daemon routes such as /api/app-config
- keeps the fork bootstrap contract for daemon-provided API defaults
- preserves trusted local/private OpenAI-compatible gateway behavior required by the fork
- keeps the restored Connectors navigation surface in the integrated runtime
- refreshes fork GHCR latest and provides a pinned Docker release for downstream machines

Validation completed before this release:
- refreshed the workspace with pnpm install and passed pnpm --filter @open-design/web build
- preview worktree passed pnpm guard and pnpm typecheck
- targeted daemon and web regression tests passed
- isolated preview browser/runtime smoke checks passed
- downstream GHCR compose smoke test passed with matching image revisions, healthy web + daemon endpoints, and proxied /api/app-config returning 200
```

## Published release outputs

The named release now exposes:

- GitHub release tag: `open-design-docker-v0.4.0`
- GHCR daemon image: `ghcr.io/jzkk720/open-design-daemon:0.4.0`
- GHCR web image: `ghcr.io/jzkk720/open-design-web:0.4.0`
- refreshed rolling tags:
  - `ghcr.io/jzkk720/open-design-daemon:latest`
  - `ghcr.io/jzkk720/open-design-web:latest`

## Pinned install and update guide

These are the pinned commands for machines that should follow the named Docker release instead of the moving `latest` lane.

Linux or macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/JZKK720/open-design/open-design-docker-v0.4.0/scripts/install-open-design-docker.sh | bash -s -- --owner jzkk720 --repository open-design --repo-ref open-design-docker-v0.4.0 --image-tag 0.4.0
```

Windows PowerShell:

```powershell
$script = Join-Path $env:TEMP 'install-open-design-docker.ps1'; Invoke-WebRequest 'https://raw.githubusercontent.com/JZKK720/open-design/open-design-docker-v0.4.0/scripts/install-open-design-docker.ps1' -OutFile $script; & $script -Owner 'jzkk720' -Repository 'open-design' -RepoRef 'open-design-docker-v0.4.0' -ImageTag '0.4.0'
```

Existing repo checkout using the explicit GHCR lane:

```bash
docker login ghcr.io
docker compose --env-file .env.ghcr -f compose.ghcr.yaml pull
docker compose --env-file .env.ghcr -f compose.ghcr.yaml up -d
```

If a machine must stay pinned to the named release, set `OPEN_DESIGN_IMAGE_TAG=0.4.0` in `.env.ghcr` before the pull step.

## Operator note

This release should be treated as the named version on top of the already-validated fork `latest` lane, not as a replacement for the default update path. Routine downstream updates should continue to follow fork GHCR `latest`, while `0.4.0` is the pinned fallback for controlled environments.