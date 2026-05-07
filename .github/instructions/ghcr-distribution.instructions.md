---
description: "Use when editing Open Design GHCR and container distribution files such as compose.yaml, compose.ghcr.yaml, Dockerfile.daemon, Dockerfile.web, GHCR workflows, and Docker install or update scripts. Covers upstream-vs-fork image decisions, publishing lanes, and CubeCloud fork invariants."
name: "GHCR Distribution Guidance"
applyTo:
  - "compose.yaml"
  - "compose.ghcr.yaml"
  - ".env.ghcr.example"
  - "Dockerfile.daemon"
  - "Dockerfile.web"
  - ".github/workflows/publish-ghcr.yml"
  - ".github/workflows/release-docker.yml"
  - "scripts/install-open-design-docker.sh"
  - "scripts/install-open-design-docker.ps1"
  - "scripts/update-open-design-ghcr.ps1"
  - "scripts/register-open-design-ghcr-update-task.ps1"
  - "scripts/release-docker.ts"
---

# GHCR Distribution Guidance

- Classify the active lane before changing anything:
  - default fork GHCR lane: `compose.yaml`
  - env-file GHCR lane: `compose.ghcr.yaml` plus `.env.ghcr`
  - explicit local source rebuild lane: `compose.yaml` with `docker compose up --build` or `docker compose build`
  - GHCR publish lane: GHCR workflows plus install or update scripts
- `compose.yaml` should default to the verified fork GHCR `latest` images unless the operator explicitly asks for a local source rebuild.
- Local repo changes and validated `fork/main` pushes should refresh fork GHCR `latest`; downstream machines should follow that lane with pull/update rather than rebuild locally.
- Prefer upstream GHCR only when the required runtime behavior already exists upstream or the remaining fork-only changes do not affect image contents.
- If CubeCloud-specific changes on `fork/main` affect the daemon or web images, treat fork GHCR as the deployment source of truth.
- Do not use a successful local source build as proof that pulled GHCR images contain the same changes.
- Do not treat workflow presence as proof that a fork package already exists in GHCR.
- Keep `fork/main` authoritative for CubeCloud runtime changes and make owner-reviewed cherry-picks from `upstream/main` the default sync method:
  - cherry-pick selected upstream fixes onto `fork/main`, validate, and let fork GHCR refresh `latest`
  - use merge or rebase only when the owner explicitly wants a broad upstream refresh and will validate and republish the combined surface
- Keep `OPEN_DESIGN_IMAGE_OWNER` aligned with the publishing fork when consuming fork GHCR images.
- Do not recommend the branch tag `main` as the default deployment lane when `latest` is available on the publishing fork.
- Link to existing references instead of re-explaining them:
  - [AGENTS.md](../../AGENTS.md)
  - [docs/cubecloud-openspace-installation.md](../../docs/cubecloud-openspace-installation.md)