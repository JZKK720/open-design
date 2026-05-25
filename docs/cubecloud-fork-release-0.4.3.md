# CubeCloud Fork Release 0.4.3

This brief defines the prepared `0.4.3` named Docker release path for the CubeCloud fork after the first validated upstream sync slice on `sync/upstream-main-20260525`.

## Base state

- Planned fork `main` release commit: `e5f779be`
- Previous named Docker release: `open-design-docker-v0.4.2` at commit `12c40ed`
- Current downstream lane split remains unchanged:
  - fork GHCR `latest` is the rolling validation lane after merge to `fork/main`
  - `0.4.2` remains the current pinned Docker release for controlled downstream machines until `0.4.3` is intentionally published

## Release recommendation

- Proposed fork Docker release version: `0.4.3`
- Rationale: this is the next patch on the fork Docker release lane after `0.4.2`, and it packages the first low-conflict upstream sync fixes already validated on the isolated sync branch
- Recommended publish order:
  1. merge `sync/upstream-main-20260525` to `fork/main`
  2. allow `.github/workflows/publish-ghcr.yml` to refresh fork GHCR `latest`
  3. cut `0.4.3` only if the pinned downstream lane should move beyond `0.4.2`
- If the goal is only to refresh the rolling validation lane, stop after step 2 and do not publish `0.4.3` yet

## Changes included in this prepared release

- `285d904c` fixes weak hover feedback on primary plugin authoring buttons by increasing hover contrast
- `e5f779be` treats missing plugin preview or example HTML as an unavailable state instead of a misleading fetch error

## Fork behavior preserved in this release path

These fork-specific behaviors remain unchanged and are not affected by this release candidate:

- CubeCloud branding, compose defaults, and GHCR owner or repository settings
- the current operator policy that keeps fork GHCR `latest` as the rolling validation lane and named Docker releases as explicit pinned snapshots
- the existing `.env.ghcr` pin to `0.4.2` on controlled downstream machines until the owner intentionally advances them

## Validation completed before this prepared release

- sync-branch git hygiene passed:
  - `git diff --check origin/main..HEAD`
- focused web regression test passed for the touched slice:
  - `node <repo-root>/node_modules/.pnpm/vitest@4.1.6.../node_modules/vitest/vitest.mjs run apps/web/tests/providers/registry.test.ts`
- file diagnostics were clean for the touched sources:
  - `apps/web/src/providers/registry.ts`
  - `apps/web/src/components/plugin-details/PluginExampleDetail.tsx`
  - `apps/web/tests/providers/registry.test.ts`

## Planned workflow inputs

When the owner decides to advance the pinned Docker lane, run `.github/workflows/release-docker.yml` from fork `main` with:

- `version`: `0.4.3`
- `publish_latest`: `true`

Suggested `notes` input:

```text
CubeCloud fork patch Docker release on top of the validated 0.4.2 lane, now prepared from fork main e5f779be.

Highlights in this release:
- improves plugin authoring button hover contrast so primary actions read as interactive again
- treats missing plugin preview HTML as a calm unavailable state instead of a misleading fetch failure
- keeps the existing CubeCloud fork GHCR lane, compose defaults, and downstream pinning policy intact

Validation completed before this release:
- sync-branch git diff check passed
- focused web provider regression test passed
- touched-file diagnostics were clean
```

## Expected published release outputs

After the workflow completes, the named release should expose:

- GitHub release tag: `open-design-docker-v0.4.3`
- GHCR daemon image: `ghcr.io/jzkk720/open-design-daemon:0.4.3`
- GHCR web image: `ghcr.io/jzkk720/open-design-web:0.4.3`
- refreshed rolling tags:
  - `ghcr.io/jzkk720/open-design-daemon:latest`
  - `ghcr.io/jzkk720/open-design-web:latest`

## Operator guidance

- If this sync branch is merged but no named release is cut, validation and routine downstream machines may follow fork GHCR `latest` after the publish workflow refreshes it
- Controlled downstream machines that are intentionally pinned should remain on `OPEN_DESIGN_IMAGE_TAG=0.4.2` until `0.4.3` is explicitly released and validated
- Once `0.4.3` is published, advancing a pinned machine remains the same pull-plus-restart workflow already used for `0.4.2`