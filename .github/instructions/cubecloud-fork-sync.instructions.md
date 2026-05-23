---
description: "Use when reviewing or comparing fork/main with upstream/main, counting ahead or behind commits, planning the next upstream version bump, mapping fork Docker releases to absorbed upstream versions, deciding between fork latest and pinned Docker release lanes, checking whether fork/main can absorb upstream commits, preserving CubeCloud branding or local env or data overlays, republishing fork GHCR latest or versioned Docker releases, or planning downstream pull or update smoke tests."
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
  - "docs/cubecloud-fork-release-0.2.2.md"
  - "docs/cubecloud-fork-release-0.3.0.md"
  - "docs/cubecloud-fork-release-0.4.0.md"
  - "docs/cubecloud-upstream-sync-0.4.0.md"
  - "scripts/install-open-design-docker.sh"
  - "scripts/install-open-design-docker.ps1"
  - "scripts/update-open-design-ghcr.ps1"
  - "scripts/register-open-design-ghcr-update-task.ps1"
  - "scripts/release-docker.ts"
---

# CubeCloud Fork Sync Guidance

- Start by verifying live branch state. `docs/cubecloud-upstream-sync-0.4.0.md` is a seam and conflict snapshot, not a standing ahead or behind count.
- Keep these version surfaces separate in every comparison:
  - upstream product tags such as `open-design-v0.4.0` or `open-design-v0.6.0`
  - fork branch commits on `main`
  - fork Docker release tags such as `0.3.0` or `0.4.0`
- Do not collapse an upstream product version, a fork commit, and a fork Docker release into one implied version number.
- Current release-lane split:
  - fork GHCR `latest` is the rolling validation lane for future fork syncs, checked-out repo updates, and staging environments
  - `ghcr.io/jzkk720/open-design-{daemon,web}:0.4.0` is the current pinned Docker release snapshot for the validated upstream `0.6.0` integration and split-port Docker fix at `1f37351f`
  - do not assume `latest` and `0.4.0` resolve to the same revision after later fork runtime releases
- Current GHCR publish gate:
  - `.github/workflows/publish-ghcr.yml` ignores docs-only and repo-guidance-only pushes under `*.md`, `docs/**`, `.github/agents/**`, `.github/instructions/**`, `.github/prompts/**`, and `.github/skills/**`
  - publish-relevant pushes to `fork/main` still refresh fork `latest`, branch, and `sha-*` tags
  - workflow-file changes are still publish-relevant and can legitimately move `latest`
- Separate these questions before proposing work:
  - can `fork/main` absorb a selected upstream fix batch with owner-reviewed cherry-picks
  - can the fork survive a broader merge or rebase event without dropping CubeCloud runtime behavior
  - does the user want only refreshed `latest` images or a named Docker release too
- For review-only compare tasks, collect evidence in this order:
  1. live branch relation: use ahead or behind counts plus the current branch tips before reasoning from older docs
  2. commit windows in both directions: inspect representative `fork/main..upstream/main` and `upstream/main..fork/main` ranges before diffing files
  3. hotspot surface: use a repo-wide diff summary first, then step into the current conflict-prone runtime files only when the summary points there
  4. version lanes: read the newest `docs/cubecloud-fork-release-*.md`, `docs/cubecloud-upstream-sync-0.4.0.md`, and `scripts/release-docker.ts`; do not infer fork Docker semver from upstream product tags
  5. publish meaning: confirm `.github/workflows/publish-ghcr.yml` and `.github/workflows/release-docker.yml` before claiming what `latest` or a named Docker tag represents
- Default policy remains cherry-pick first:
  - keep `fork/main` authoritative for CubeCloud runtime and deployment behavior
  - use owner-reviewed cherry-picks from `upstream/main` as the normal sync lane
  - keep `latest` as the rolling validation lane and cut a new semver Docker release when the user wants a stable downstream snapshot
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
- Use two downstream lanes:
  - validation or staging environments may follow fork GHCR `latest`
  - important or long-lived downstream environments should prefer `.env.ghcr` plus `compose.ghcr.yaml` pinned to the newest validated fork release such as `0.4.0`
  - `compose.yaml` may follow fork `latest` for repo-local convenience, but routine downstream updates should still be pull plus restart, not rebuild from source
- Smoke-test expectations after publish or update:
  1. resolve the image references from the active compose lane
  2. pull first if the result must reflect the latest registry state
  3. verify the running container image IDs match the current local tag objects
  4. confirm daemon and web endpoints answer on the expected ports
  5. check service logs only after the image and container state evidence is clear
- Return fork-versus-upstream comparison results in this shape:
  - branch state: current refs, ahead or behind counts, and a short incoming and outgoing commit window
  - overlay boundaries: expected fork-owned surfaces versus shared runtime hotspots
  - version lanes: current fork GHCR `latest`, newest named fork Docker release, absorbed upstream version or merge note, and any mismatch between docs and live git state
  - recommendation: cherry-pick batch, broader merge or rebase event, `latest` refresh only, or a new named Docker release
- Reuse existing references instead of restating procedures:
  - `AGENTS.md`
  - `docs/cubecloud-openspace-installation.md`
  - `docs/cubecloud-fork-release-0.2.2.md`
  - `docs/cubecloud-fork-release-0.3.0.md`
  - `docs/cubecloud-fork-release-0.4.0.md`
  - `docs/cubecloud-upstream-sync-0.4.0.md`
  - `.github/instructions/ghcr-distribution.instructions.md`
  - `.github/instructions/open-design-container-runtime-diagnostics.instructions.md`
  - `.github/workflows/publish-ghcr.yml`
  - `.github/workflows/release-docker.yml`
  - `scripts/release-docker.ts`
