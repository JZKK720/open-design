# CubeCloud Fork Release 0.5.1

This brief defines the planned `0.5.1` patch Docker release for the CubeCloud fork after the post-`0.5.0` daemon fix that restores keyless local OpenAI-compatible onboarding on the fork `0.8.1` line.

## Base state

- Planned fork `main` release commit: pending commit for the local OpenAI-compatible no-key daemon fix
- Previous named Docker release: `open-design-docker-v0.5.0` at merge commit `db6def1e`
- Rolling validation lane remains unchanged: routine Docker machines should continue following fork GHCR `latest`, while `0.5.1` exists as the new auditable pinned fallback

## Release recommendation

- Proposed fork Docker release version: `0.5.1`
- Rationale: this is a focused daemon behavior fix on top of the already-validated `0.5.0` upstream `0.8.x` merge, so a patch release is the correct operator signal
- Goal: refresh fork GHCR `latest` with the fixed daemon behavior and publish a named fallback release without changing the meaning of `0.5.0`

## Operator-visible fix in this release

- local OpenAI-compatible gateways such as Ollama exposed through loopback or `host.docker.internal` no longer require a placeholder API key for:
  - `POST /api/proxy/openai/stream`
  - `POST /api/test/connection`
- non-local OpenAI-compatible endpoints still require an API key, so the daemon behavior remains narrowed to trusted local gateway routes only

## Validation completed before release

- focused daemon no-key regressions passed:
  - `pnpm --filter @open-design/daemon exec vitest run tests/proxy-routes.test.ts tests/connection-test.test.ts -t "without an apiKey"`
- patched daemon source build passed:
  - `pnpm --filter @open-design/daemon build`
- patched daemon runtime proof on alternate port `8456` reached provider execution with no `apiKey` field on both endpoints:
  - `POST /api/test/connection` returned a classified provider result instead of `400 BAD_REQUEST`
  - `POST /api/proxy/openai/stream` returned streamed text deltas for the local `nemotron3:33b-q8` path without an `apiKey`

## Planned workflow inputs

Run `.github/workflows/release-docker.yml` from fork `main` with:

- `version`: `0.5.1`
- `publish_latest`: `true`

Suggested `notes` input:

```text
CubeCloud fork patch Docker release on top of the validated 0.5.0 upstream 0.8.1 merge line.

Highlights in this release:
- fixes local OpenAI-compatible onboarding so loopback and host.docker.internal gateways no longer need a placeholder API key
- keeps the restriction that non-local OpenAI-compatible endpoints still require an API key
- refreshes fork GHCR latest and provides a pinned Docker fallback release

Validation completed before this release:
- focused daemon no-key regression tests passed
- daemon build passed
- patched daemon runtime proof on port 8456 reached both no-key endpoints without BAD_REQUEST
```

## Expected published release outputs

After the workflow completes, the named release should expose:

- GitHub release tag: `open-design-docker-v0.5.1`
- GHCR daemon image: `ghcr.io/jzkk720/open-design-daemon:0.5.1`
- GHCR web image: `ghcr.io/jzkk720/open-design-web:0.5.1`
- refreshed rolling tags:
  - `ghcr.io/jzkk720/open-design-daemon:latest`
  - `ghcr.io/jzkk720/open-design-web:latest`

## Install and update guidance

Operator policy after `0.5.1` should stay the same: validation and routine downstream machines continue following fork GHCR `latest`.

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

If a machine must stay pinned to the named release instead of following `latest`, set `OPEN_DESIGN_IMAGE_TAG=0.5.1` in `.env.ghcr` before the pull step.

## Operator note

This release should be treated as the named audit point for the local no-key onboarding fix, while the default downstream update lane remains fork GHCR `latest`.