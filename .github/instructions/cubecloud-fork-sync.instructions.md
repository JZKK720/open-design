---
description: "Use when syncing the CubeCloud fork with upstream Open Design, planning the next upstream version bump, deciding between fork latest and pinned Docker release lanes, checking whether fork/main can absorb upstream commits, preserving CubeCloud branding or local env or data overlays, republishing fork GHCR latest or versioned Docker releases, or planning downstream pull or update smoke tests."
name: "CubeCloud Fork Sync Guidance"
applyTo:
  - "compose.yaml"
  - "compose.ghcr.yaml"
  - ".env.ghcr.example"
  - "Dockerfile.daemon"
  - "Dockerfile.web"
  - ".github/workflows/publish-ghcr.yml"
  - ".github/workflows/release-docker.yml"
  - "docs/cubecloud-openspace-installation.md"
  - "docs/cubecloud-upstream-sync-0.4.0.md"
  - "scripts/install-open-design-docker.sh"
  - "scripts/install-open-design-docker.ps1"
  - "scripts/update-open-design-ghcr.ps1"
  - "scripts/register-open-design-ghcr-update-task.ps1"
---

# CubeCloud Fork Sync Guidance

- Start by verifying live branch state. `docs/cubecloud-upstream-sync-0.4.0.md` is a seam and conflict snapshot, not a standing ahead or behind count.
- Current release-lane split:
  - fork GHCR `latest` is the rolling update lane for future fork syncs and checked-out repo updates
  - `ghcr.io/jzkk720/open-design-{daemon,web}:0.3.0` is the current pinned Docker release snapshot for the validated upstream integration at `02b6486`
  - do not assume `latest` and `0.3.0` resolve to the same revision after later fork-only workflow or policy commits
- Current GHCR publish gate:
  - `.github/workflows/publish-ghcr.yml` ignores docs-only and repo-guidance-only pushes under `*.md`, `docs/**`, `.github/instructions/**`, and `.github/skills/**`
  - publish-relevant pushes to `fork/main` still refresh fork `latest`, branch, and `sha-*` tags
  - workflow-file changes are still publish-relevant and can legitimately move `latest`
- Separate these questions before proposing work:
  - can `fork/main` absorb a selected upstream fix batch with owner-reviewed cherry-picks
  - can the fork survive a broader merge or rebase event without dropping CubeCloud runtime behavior
  - does the user want only refreshed `latest` images or a named Docker release too
- Default policy remains cherry-pick first:
  - keep `fork/main` authoritative for CubeCloud runtime and deployment behavior
  - use owner-reviewed cherry-picks from `upstream/main` as the normal sync lane
  - for the next upstream version bump, keep `latest` as the rolling lane and cut a new semver Docker release only when the user wants a new pinned snapshot
  - only recommend merge or rebase when the owner explicitly asks for a broader refresh and accepts conflict resolution plus GHCR republish
- Preserve these fork overlay surfaces unless the user explicitly retires them:
  - branding assets and pack icons
  - compose and GHCR defaults
  - Dockerfiles and nginx runtime wiring
  - installer or update scripts
  - CubeCloud deployment and sync docs
- Expect merge pressure in shared runtime files when CubeCloud local API or gateway behavior still diverges. Use `docs/cubecloud-upstream-sync-0.4.0.md` to identify the current hotspot files before assuming branding or compose is the blocker.
- After a validated sync lands on `fork/main`, the publish order is:
  1. push `fork/main` so `.github/workflows/publish-ghcr.yml` refreshes fork `latest`, branch, and `sha-*` tags
  2. run `.github/workflows/release-docker.yml` only when the user also wants a semver Docker tag and GitHub release notes
  3. keep `docs/cubecloud-openspace-installation.md` aligned with the chosen release and update lane
- Do not treat a successful local source build as proof that the fork GHCR images contain the same bits. Confirm the publish lane separately.
- Downstream machines should follow the fork GHCR update lane:
  - prefer `.env.ghcr` plus `compose.ghcr.yaml` for explicit owner or tag overrides and update-helper flows
  - `compose.yaml` may follow fork `latest` for repo-local convenience, but routine downstream updates should still be pull plus restart, not rebuild from source
- Smoke-test expectations after publish or update:
  1. resolve the image references from the active compose lane
  2. pull first if the result must reflect the latest registry state
  3. verify the running container image IDs match the current local tag objects
  4. confirm daemon and web endpoints answer on the expected ports
  5. check service logs only after the image and container state evidence is clear
- Reuse existing references instead of restating procedures:
  - `AGENTS.md`
  - `docs/cubecloud-openspace-installation.md`
  - `docs/cubecloud-fork-release-0.3.0.md`
  - `docs/cubecloud-upstream-sync-0.4.0.md`
  - `.github/instructions/ghcr-distribution.instructions.md`
  - `.github/instructions/open-design-container-runtime-diagnostics.instructions.md`
