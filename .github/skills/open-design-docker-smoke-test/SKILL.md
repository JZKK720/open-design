---
name: open-design-docker-smoke-test
description: 'Run the Open Design Docker smoke-test workflow for GHCR updates or local compose verification on Windows or Unix. Use when validating docker compose pull or up results, checking whether running containers match the current image tags, confirming the daemon and web endpoints respond, or diagnosing stale latest tags, wrong image owners, or accidental local rebuilds.'
argument-hint: '[compose lane] [owner/repository/tag overrides] [windows|unix]'
disable-model-invocation: true
---

# Open Design Docker Smoke Test

Use this skill to verify that a pulled or updated Open Design Docker stack is actually running the expected images and serving the expected endpoints.

## Repo anchors

Read these first when the task depends on fork GHCR policy or runtime diagnostics:

- [root agent guide](../../../AGENTS.md)
- [CubeCloud installation and GHCR update guide](../../../docs/cubecloud-openspace-installation.md)
- [GHCR distribution instruction](../../instructions/ghcr-distribution.instructions.md)
- [CubeCloud fork sync instruction](../../instructions/cubecloud-fork-sync.instructions.md)
- [container runtime diagnostics instruction](../../instructions/open-design-container-runtime-diagnostics.instructions.md)

## Required inputs

Collect or confirm these before running commands:

- active lane under test
  - default repo compose lane: `compose.yaml`
  - env-file GHCR lane: `compose.ghcr.yaml` plus `.env.ghcr`
  - explicit local rebuild lane: `compose.yaml` with `docker compose up --build` or `docker compose build`
- whether the result must reflect the newest registry state
- expected image owner, repository, and tag when GHCR is involved
- host platform for the smoke test: Windows PowerShell or Unix shell

If any of those are unclear, ask before running the smoke test.

## Workflow

1. Classify the lane first.
   - Do not treat `compose.yaml` and `compose.ghcr.yaml` as equivalent.
   - If the lane is an explicit local rebuild, do not use image-tag matching as proof that GHCR contains the same bits.
2. Resolve the image references that Compose will use.
   - repo compose lane:
     ```bash
     docker compose config
     ```
   - env-file GHCR lane:
     ```bash
     docker compose --env-file .env.ghcr -f compose.ghcr.yaml config
     ```
3. Refresh local tag state if the user wants the newest published images.
   - repo compose lane:
     ```bash
     docker compose pull
     docker compose up -d
     ```
   - env-file GHCR lane:
     ```bash
     docker compose --env-file .env.ghcr -f compose.ghcr.yaml pull
     docker compose --env-file .env.ghcr -f compose.ghcr.yaml up -d
     ```
4. Inspect the running containers before reading logs.
   - list service state:
     ```bash
     docker compose ps
     ```
   - if the GHCR lane uses `compose.ghcr.yaml`, keep the same `--env-file` and `-f` flags for all subsequent Compose commands.
5. Compare running image IDs with the current local tag objects.
   - Unix shell:
     ```bash
     checks=(
       "daemon|open-design-open-design-daemon-1|ghcr.io/<owner>/<repo>-daemon:<tag>"
       "web|open-design-open-design-web-1|ghcr.io/<owner>/<repo>-web:<tag>"
     )

     for entry in "${checks[@]}"; do
       IFS='|' read -r service container tag <<< "$entry"
       running_id="$(docker inspect --format '{{.Image}}' "$container")"
       tag_id="$(docker image inspect "$tag" --format '{{.Id}}')"
       printf '%s\n  container=%s\n  running_id=%s\n  tag=%s\n  tag_id=%s\n  matches_current_tag=%s\n\n' \
         "$service" "$container" "$running_id" "$tag" "$tag_id" "$([ "$running_id" = "$tag_id" ] && echo true || echo false)"
     done
     ```
   - Windows PowerShell:
     ```powershell
     $checks = @(
       @{ Service='daemon'; Container='open-design-open-design-daemon-1'; Tag='ghcr.io/<owner>/<repo>-daemon:<tag>' },
       @{ Service='web'; Container='open-design-open-design-web-1'; Tag='ghcr.io/<owner>/<repo>-web:<tag>' }
     )

     $checks | ForEach-Object {
       $container = (docker inspect $_.Container | ConvertFrom-Json)[0]
       $tagImage = (docker image inspect $_.Tag | ConvertFrom-Json)[0]

       [pscustomobject]@{
         Service = $_.Service
         Container = $_.Container
         RunningImageId = $container.Image
         CurrentTag = $_.Tag
         CurrentTagId = $tagImage.Id
         MatchesCurrentTag = ($container.Image -eq $tagImage.Id)
       }
     } | Format-List
     ```
6. Run endpoint health checks only after container and image state are clear.
   - expected endpoints:
     - web UI: `http://localhost:7831`
     - daemon health: `http://localhost:7456/api/health`
   - Unix shell:
     ```bash
     curl -fsS http://localhost:7831 > /dev/null
     curl -fsS http://localhost:7456/api/health
     ```
   - Windows PowerShell:
     ```powershell
     Invoke-WebRequest 'http://localhost:7831' | Out-Null
     Invoke-WebRequest 'http://localhost:7456/api/health' | Select-Object -ExpandProperty Content
     ```
7. Read logs only for the failing service and only after the earlier checks narrow the problem.
   - repo compose lane:
     ```bash
     docker compose logs open-design-daemon
     docker compose logs open-design-web
     ```
   - env-file GHCR lane:
     ```bash
     docker compose --env-file .env.ghcr -f compose.ghcr.yaml logs open-design-daemon
     docker compose --env-file .env.ghcr -f compose.ghcr.yaml logs open-design-web
     ```

## Decision points

- If `MatchesCurrentTag` is `false`, the container is still running an older local image object even if the visible tag string looks correct. Recreate the service with `up -d` or `up -d --force-recreate`.
- If the container image matches the tag but the endpoint checks fail, treat it as an application startup or proxy problem and inspect only the failing service logs.
- If the repo compose lane shows GHCR image names after a recent `--build`, treat that as a possible local rebuild stamped with the GHCR tag name. Inspect image metadata before claiming the image came from GHCR.
- If the env-file GHCR lane fails before pull, check `.env.ghcr` first. `OPEN_DESIGN_IMAGE_OWNER` must stay lowercase.

## Completion criteria

The smoke test passes only when all of these hold:

- the active lane is explicit in the report
- the resolved image references match the intended owner, repository, and tag
- both containers are running
- running image IDs match the current local tag objects for the tested lane
- `http://localhost:7831` responds successfully
- `http://localhost:7456/api/health` responds successfully

## Output contract

Return a concise summary with:

- active lane used
- pull or update commands run
- resolved image references
- running container state
- image ID match results
- endpoint health results
- any log-based diagnosis only if a failure remained after the earlier checks
