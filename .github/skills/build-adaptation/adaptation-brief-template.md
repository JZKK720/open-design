# Adaptation Brief Template

Fill this in before build adaptation work starts.

## Target shell

- Product or shell name:
- Branding mode: white-label, OEM, or product fork

## In-scope adaptations

- Branding or shell changes:
- Runtime or process model changes:
- Build pipeline or CI changes:
- Packaging or release changes:
- Namespace or multi-tenant changes:

## Container and GHCR distribution

- Active lane under review: local source build / GHCR consume / GHCR publish / not in scope
- Preferred image strategy: upstream GHCR first / fork GHCR default / undecided
- Target image owner, repository, and tag:
- Must pulled images include fork-only changes:
- Upstream sync policy: merge / rebase / selective cherry-pick / not in scope
- Verification needed: workflow config only / published package exists / deployed compose lane / not in scope

## Primary edit surfaces

- `apps/web`:
- `apps/desktop`:
- `tools/dev`:
- `tools/pack`:

## Boundary crossings that are allowed only if needed

- `apps/daemon`:
- `apps/packaged`:
- `packages/*`:

## Must-preserve invariants

- Existing user-visible functions that must not regress:
- Existing agent-driven flows that must not regress:
- Lifecycle commands that must stay authoritative:
- Stamp, namespace, or path invariants that must stay intact:

## Allowed agent actions

- Review only:
- Generate patches:
- Run validation commands:
- Prepare release artifacts:

## Validation evidence expected

- Narrow package-scoped commands:
- Workspace gates:
- Lifecycle checks:
- Packaging checks:

## Notes

- Non-goals:
- Known risks: