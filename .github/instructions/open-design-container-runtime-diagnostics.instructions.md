---
description: "Use when working in the Open Design repo and checking current Docker containers, identifying which image a running container is actually using, comparing live containers with compose.yaml or compose.ghcr.yaml, diagnosing daemon or web containers that are not running, or investigating GHCR tag mismatches, stale pulls, or mislabeled local rebuilds."
name: "Open Design Container Runtime Diagnostics"
applyTo:
  - "compose.yaml"
  - "compose.ghcr.yaml"
  - ".env.ghcr.example"
  - "Dockerfile.daemon"
  - "Dockerfile.web"
  - ".github/workflows/publish-ghcr.yml"
  - ".github/workflows/release-docker.yml"
  - "docs/cubecloud-openspace-installation.md"
  - "scripts/install-open-design-docker.sh"
  - "scripts/install-open-design-docker.ps1"
  - "scripts/update-open-design-ghcr.ps1"
  - "scripts/register-open-design-ghcr-update-task.ps1"
---

# Open Design Container Runtime Diagnostics

- Classify the active lane before drawing conclusions:
  - default repo compose lane: `compose.yaml`
  - env-file GHCR lane: `compose.ghcr.yaml` plus `.env.ghcr`
  - explicit local rebuild lane: `compose.yaml` with `docker compose up --build` or `docker compose build`
  - local non-Docker lifecycle lane: `pnpm tools-dev ...`
- Use the repo guides instead of re-explaining policy:
  - `AGENTS.md`
  - `docs/cubecloud-openspace-installation.md`
  - `.github/instructions/ghcr-distribution.instructions.md`
  - `.github/instructions/cubecloud-fork-sync.instructions.md`
  - `.github/workflows/publish-ghcr.yml`
  - `.github/workflows/release-docker.yml`
- Gather evidence in this order when the user asks what is running now:
  1. resolve the expected image references from the active compose lane
     - `docker compose config`
     - `docker compose --env-file .env.ghcr -f compose.ghcr.yaml config`
  2. list the actual containers and states
     - `docker compose ps`
     - `docker inspect <container>`
  3. inspect the local image metadata before trusting the visible tag
     - `docker image inspect <image>`
     - compare `RepoDigests`, `Created`, and OCI labels when present
  4. only then read service logs
     - `docker compose logs open-design-daemon`
     - `docker compose logs open-design-web`
- Treat this repo's `compose.yaml` as a common source of false certainty:
  - both services define `image:` and `build:`
  - a local `docker compose up --build` can rebuild the image and tag it with the same GHCR name shown in compose
  - the image name string alone does not prove the container came from GHCR
  - use image metadata and the compose command history to distinguish pulled images from local rebuilds
- Prefer repo-native diagnostics when the issue is local dev runtime rather than Docker:
  - `pnpm tools-dev status`
  - `pnpm tools-dev check`
  - `pnpm tools-dev inspect daemon status`
- Check these repo-specific failure points early:
  - `.env.ghcr` owner must stay lowercase for `OPEN_DESIGN_IMAGE_OWNER`, or Docker rejects the image reference before it reaches GHCR
  - the web service should publish `7831:80`; the daemon should publish `7456:7456`
  - the daemon persists data through the `open-design-data` volume mounted at `/data`
  - GHCR-published images use workflow-generated OCI labels from `.github/workflows/publish-ghcr.yml`; a plain local compose build may not carry equivalent metadata
- When reporting findings, separate these facts explicitly:
  - which compose lane was used
  - which image reference compose resolves to
  - which container is actually running or exited
  - what local image metadata says about pull vs local rebuild
  - whether the evidence points to stale GHCR tags, wrong owner or tag configuration, or a container crash after startup
- Do not claim upstream GHCR contains fork-only runtime behavior unless the fork changes were merged upstream or republished from the fork GHCR lane.
