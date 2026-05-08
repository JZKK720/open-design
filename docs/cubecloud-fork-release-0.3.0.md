# CubeCloud Fork Release 0.3.0

This brief defines the next named Docker release for the CubeCloud fork after the validated upstream integration on `fork/main`.

## Base state

- Current fork `main`: `02b6486`
- Current fork GHCR `latest`: OCI revision `02b64868fc1d6711b29af8daf899d79b72f856ac`
- Previous named Docker release: `open-design-docker-v0.2.2` at commit `b6e479c`
- Upstream status absorbed into the fork for this release: the previously verified `184`-commit upstream gap is now integrated on top of the fork while keeping the fork-only runtime overlays intact

## Release recommendation

- Proposed fork Docker release version: `0.3.0`
- Rationale: this is no longer a small patch on top of the `0.2.x` line. It is a broader upstream integration that brings the fork onto the current `0.5.0`-era Open Design runtime while intentionally preserving CubeCloud-specific behavior.
- Goal: publish a named, pin-able Docker release on top of the already-validated fork GHCR `latest` lane without claiming that CubeCloud-specific overlays were removed.

## Fork behavior preserved in this release

These fork-specific behaviors remain part of the release and should be treated as intentional runtime overlays, not merge leftovers.

- `/api/app-config` still returns long-lived preferences in `config` plus fork bootstrap defaults in `bootstrap`
- the web config merge path still applies daemon bootstrap values only when local API settings remain at built-in defaults
- trusted local OpenAI-compatible gateways still work without an API key for the intended fork cases such as `host.docker.internal` and direct private IPv4 endpoints
- internal IPv6 and mapped-private IPv6 endpoints remain blocked before proxying
- the fork GHCR lane remains the deployment source of truth for downstream Docker machines
- the workspace now includes explicit fork sync guidance, container runtime diagnostics guidance, and the `open-design-docker-smoke-test` skill

## Validation completed before release

- the validated merge landed on fork `main` as commit `02b6486`
- `publish-ghcr` refreshed both fork GHCR `latest` tags to OCI revision `02b64868fc1d6711b29af8daf899d79b72f856ac`
- the merge preview worktree passed full workspace `pnpm typecheck`
- recursive package builds passed in the merge preview worktree
- `pnpm --filter @open-design/web test` passed after restoring the shared proxy helper's OpenAI `message` SSE compatibility
- daemon proxy and provider-connection validation passed for the preserved fork trust policy
- the explicit local rebuild lane passed container smoke validation
- the real downstream GHCR lane passed via `docker compose --env-file .env.ghcr -f compose.ghcr.yaml up -d`, with matching image IDs plus healthy `http://localhost:7831` and `http://localhost:7456/api/health`

## Workflow inputs

Run `.github/workflows/release-docker.yml` with:

- `version`: `0.3.0`
- `publish_latest`: `true`

Suggested `notes` input:

```text
CubeCloud fork minor Docker release on top of the validated upstream integration now published on fork main `02b6486`.

Highlights in this release:
- integrates the previously verified upstream gap onto the CubeCloud fork
- keeps the fork bootstrap contract for daemon-provided API defaults
- preserves trusted local/private OpenAI-compatible gateway behavior required by the fork
- refreshes fork GHCR latest and provides a pinned Docker release for downstream machines

Validation completed before this release:
- workspace typecheck and package builds passed in the merge preview
- web proxy/config tests passed
- daemon proxy/provider trust-policy tests passed
- downstream GHCR compose smoke test passed with matching image IDs and healthy web + daemon endpoints
```

## Expected release outputs

After the workflow succeeds, the named release should expose:

- GitHub release tag: `open-design-docker-v0.3.0`
- GHCR daemon image: `ghcr.io/jzkk720/open-design-daemon:0.3.0`
- GHCR web image: `ghcr.io/jzkk720/open-design-web:0.3.0`
- refreshed rolling tags:
  - `ghcr.io/jzkk720/open-design-daemon:latest`
  - `ghcr.io/jzkk720/open-design-web:latest`

## Pinned install and update guide

Once the workflow finishes, these are the pinned commands for machines that should follow the named Docker release instead of the moving `latest` lane.

Linux or macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/JZKK720/open-design/open-design-docker-v0.3.0/scripts/install-open-design-docker.sh | bash -s -- --owner jzkk720 --repository open-design --repo-ref open-design-docker-v0.3.0 --image-tag 0.3.0
```

Windows PowerShell:

```powershell
$script = Join-Path $env:TEMP 'install-open-design-docker.ps1'; Invoke-WebRequest 'https://raw.githubusercontent.com/JZKK720/open-design/open-design-docker-v0.3.0/scripts/install-open-design-docker.ps1' -OutFile $script; & $script -Owner 'jzkk720' -Repository 'open-design' -RepoRef 'open-design-docker-v0.3.0' -ImageTag '0.3.0'
```

Existing repo checkout using the explicit GHCR lane:

```bash
docker login ghcr.io
docker compose --env-file .env.ghcr -f compose.ghcr.yaml pull
docker compose --env-file .env.ghcr -f compose.ghcr.yaml up -d
```

If a machine must stay pinned to the named release, set `OPEN_DESIGN_IMAGE_TAG=0.3.0` in `.env.ghcr` before the pull step.

## Operator note

This release should be treated as the named version on top of the already-validated fork `latest` lane, not as a replacement for the default update path. Routine downstream updates should continue to follow fork GHCR `latest`, while `0.3.0` is the pinned fallback for controlled environments.