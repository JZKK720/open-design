# CubeCloud OpenSpace Installation Plan

This repository is being adapted so Open Design runs as an internal CubeCloud design service inside OpenSpace, not as a standalone public product.

## 0. Fork And GHCR Distribution

Keep the customization in your own fork's `main` branch, then let GitHub Actions publish your runtime images to GHCR.

- The new workflow is `.github/workflows/publish-ghcr.yml`.
- It publishes two images from your fork on every push to `main` and on manual dispatch.
- Image names follow this pattern:
  - `ghcr.io/<owner>/<repo>-daemon`
  - `ghcr.io/<owner>/<repo>-web`
- Tags include the branch tag (`main` on your fork), a commit SHA tag, and `latest` on the default branch.

For named Docker releases with versioned GHCR tags and GitHub release notes, use:

- `.github/workflows/release-docker.yml`

Prepared brief for the next named fork Docker release:

- `docs/cubecloud-fork-release-0.3.0.md`

That workflow is manual on purpose. It lets you enter a release version such as `0.2.1`, optionally add release notes, publish semver-tagged Docker images, and create a GitHub release named `Open Design Docker <version>`.

Docker release outputs use these conventions:

- GitHub release tag: `open-design-docker-v<version>`
- GHCR daemon image: `ghcr.io/<owner>/<repo>-daemon:<version>`
- GHCR web image: `ghcr.io/<owner>/<repo>-web:<version>`
- Optional rolling tag refresh: `latest`

Recommended update lane:

1. Keep your CubeCloud branding, local data paths, env defaults, and credentials on your fork's `main` branch.
2. As the fork owner, cherry-pick selected fixes from `upstream/main` onto your fork's `main` instead of treating merge or rebase as the normal update path.
3. Validate the updated fork branch locally.
4. Push the validated `fork/main` branch and let `.github/workflows/publish-ghcr.yml` refresh the fork GHCR `main`, `sha-*`, and `latest` tags.
5. Run `.github/workflows/release-docker.yml` only when you also want a named versioned Docker release in addition to the refreshed `latest` lane.
6. On other machines, pull the refreshed fork `latest` images and restart the stack.

Operational rule:

- local repo changes and validated `fork/main` updates should always land on the fork GHCR `latest` lane first
- other machines should take effect by `docker compose pull` plus `docker compose up -d`
- the branch tag `main` is a convenience branch tag, but `latest` is the default deployment lane for checked-out repos and downstream machines

The root `compose.yaml` now defaults to the verified fork GHCR path `ghcr.io/jzkk720/open-design-{daemon,web}:latest` while keeping the build sections available for explicit local rebuilds.

Use `compose.ghcr.yaml` when you want the env-file driven GHCR lane explicitly, such as installer or update-helper flows.

Example environment file:

- `.env.ghcr.example`

The example file now defaults to the verified fork GHCR path for this repo:

- `OPEN_DESIGN_IMAGE_OWNER=jzkk720`
- `OPEN_DESIGN_IMAGE_REPOSITORY=open-design`
- `OPEN_DESIGN_IMAGE_TAG=latest`

Override the owner or tag only when you are intentionally targeting a different publishing fork or a pinned release tag.

For local machines that should follow future GHCR updates instead of rebuilding from source each time, keep a local `.env.ghcr` file based on the example and use the GHCR compose file on the same workstation.

`compose.ghcr.yaml` also defaults to `ghcr.io/jzkk720/open-design-{daemon,web}:latest` when no env overrides are provided, so the fork GHCR lane is now the explicit deployment default.

Concrete fork sync flow:

```bash
git fetch upstream
git checkout main
git cherry-pick <upstream-commit>...
pnpm --filter @open-design/web test
pnpm --filter @open-design/desktop build
pnpm --filter @open-design/packaged build
pnpm --filter @open-design/tools-dev build
pnpm --filter @open-design/tools-pack build
pnpm typecheck
git push origin main
```

That push updates the fork GHCR publish lane automatically. Other machines should stay on `.env.ghcr` plus `compose.ghcr.yaml` with `OPEN_DESIGN_IMAGE_TAG=latest` so they only need pull/update after the fork owner republishes.

Example update flow:

```bash
docker login ghcr.io
docker compose --env-file .env.ghcr -f compose.ghcr.yaml pull
docker compose --env-file .env.ghcr -f compose.ghcr.yaml up -d
```

Validate the running images after install or update:

- Do not trust the configured image string alone. A container can still be running an older image object even when `ghcr.io/<owner>/<repo>-*:latest` has moved.
- The source of truth is the container's actual image ID from `docker inspect`, compared with the current tag target from `docker image inspect`.
- If you want the validation to reflect the newest registry state, run the `pull` step first.

Linux or macOS:

```bash
checks=(
  "daemon|open-design-open-design-daemon-1|ghcr.io/jzkk720/open-design-daemon:latest"
  "web|open-design-open-design-web-1|ghcr.io/jzkk720/open-design-web:latest"
)

for entry in "${checks[@]}"; do
  IFS='|' read -r service container tag <<< "$entry"
  running_id="$(docker inspect --format '{{.Image}}' "$container")"
  running_rev="$(docker image inspect "$running_id" --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}')"
  tag_id="$(docker image inspect "$tag" --format '{{.Id}}')"
  tag_rev="$(docker image inspect "$tag" --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}')"

  if [ "$running_id" = "$tag_id" ]; then
    match=true
  else
    match=false
  fi

  printf '%s\n  container=%s\n  running_id=%s\n  running_revision=%s\n  tag=%s\n  tag_id=%s\n  tag_revision=%s\n  matches_current_tag=%s\n\n' \
    "$service" "$container" "$running_id" "$running_rev" "$tag" "$tag_id" "$tag_rev" "$match"
done
```

Windows PowerShell:

```powershell
$checks = @(
  @{ Service='daemon'; Container='open-design-open-design-daemon-1'; Tag='ghcr.io/jzkk720/open-design-daemon:latest' },
  @{ Service='web'; Container='open-design-open-design-web-1'; Tag='ghcr.io/jzkk720/open-design-web:latest' }
)

$checks | ForEach-Object {
  $container = (docker inspect $_.Container | ConvertFrom-Json)[0]
  $tagImage = (docker image inspect $_.Tag | ConvertFrom-Json)[0]
  $runningImage = (docker image inspect $container.Image | ConvertFrom-Json)[0]

  [pscustomobject]@{
    Service = $_.Service
    Container = $_.Container
    RunningImageId = $container.Image
    RunningRevision = $runningImage.Config.Labels.'org.opencontainers.image.revision'
    CurrentTag = $_.Tag
    CurrentTagId = $tagImage.Id
    CurrentTagRevision = $tagImage.Config.Labels.'org.opencontainers.image.revision'
    MatchesCurrentTag = ($container.Image -eq $tagImage.Id)
  }
} | Format-List
```

Expected result:

- `MatchesCurrentTag = true` means the running container now matches the current local `latest` tag target.
- `MatchesCurrentTag = false` means the container is still pinned to an older image object and should be recreated with `docker compose up -d` or `docker compose up -d --force-recreate`.

If you override the Compose project name with `-p`, adjust the container names in the snippets before running them.

For repeatable host-side updates from a checked-out repo, use:

- `scripts/update-open-design-ghcr.ps1`

On Windows hosts, register the validated daily update task with:

```powershell
& .\scripts\register-open-design-ghcr-update-task.ps1
```

That creates or replaces the `OpenDesignGhcrUpdateDaily` scheduled task and points it at the repo-local GHCR update helper.

For a one-shot install on other machines without cloning the repository first, use the fork-first installer commands below.

These defaults pull the verified fork GHCR path:

- `ghcr.io/jzkk720/open-design-daemon:latest`
- `ghcr.io/jzkk720/open-design-web:latest`

Linux or macOS, follow fork `latest`:

```bash
curl -fsSL https://raw.githubusercontent.com/JZKK720/open-design/main/scripts/install-open-design-docker.sh | bash
```

Windows PowerShell, follow fork `latest`:

```powershell
$script = Join-Path $env:TEMP 'install-open-design-docker.ps1'; Invoke-WebRequest 'https://raw.githubusercontent.com/JZKK720/open-design/main/scripts/install-open-design-docker.ps1' -OutFile $script; & $script
```

If you need a pinned release instead of the moving `latest` tag, use the tagged installer commands.

Linux or macOS, pinned release:

```bash
curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/<release-tag>/scripts/install-open-design-docker.sh | bash -s -- --owner <owner> --repository <repo> --repo-ref <release-tag> --image-tag <version>
```

Windows PowerShell, pinned release:

```powershell
$script = Join-Path $env:TEMP 'install-open-design-docker.ps1'; Invoke-WebRequest 'https://raw.githubusercontent.com/<owner>/<repo>/<release-tag>/scripts/install-open-design-docker.ps1' -OutFile $script; & $script -Owner '<owner>' -Repository '<repo>' -RepoRef '<release-tag>' -ImageTag '<version>'
```

The installer scripts:

- download `compose.ghcr.yaml` from the selected ref
- write a local `.env.ghcr`
- pull the requested GHCR image tag
- start the stack with `docker compose up -d`

If GHCR is private on the target machine, run `docker login ghcr.io` first or pass credentials into the installer script.

## 1. Container Runtime

- The web shell is built as a static export and served by nginx.
- The daemon runs as a separate Node service on port `7456`.
- nginx forwards `/api`, `/artifacts`, and `/frames` to the daemon so the static web shell keeps its expected runtime behavior.
- Persistent daemon data is stored in the `open-design-data` volume and mounted at `/data`.
- Runtime persistence stays on the daemon's built-in SQLite database at `/data/app.sqlite`; no PostgreSQL service is required for the current deployment shape.
- Keep PostgreSQL as a later migration only if this moves beyond a single stack into a shared multi-instance service.

Use the root compose file to follow the fork's moving `latest` images:

```bash
docker compose pull
docker compose up -d
```

If you need to rebuild the images from the current local source instead of consuming fork GHCR `latest`, run:

```bash
docker compose up --build -d
```

Default endpoints:

- Web UI: `http://localhost:7831`
- Daemon API: `http://localhost:7456`

If OpenSpace joins the same Docker network, route browser traffic to `open-design-web:80` and server-to-server calls to `open-design-daemon:7456`.

For explicit env-file driven GHCR runs, installer flows, or per-machine owner or tag overrides, use:

```bash
docker compose -f compose.ghcr.yaml up -d
```

## 2. CubeCloud Logo Branding

The current repo changes cover the runtime shell surfaces:

- Browser title remains `Open Design`.
- The loading shell remains `Open Design`.
- The web header and entry mark now use the approved CubeCloud square SVG asset.
- The desktop window title and pending splash HTML remain `Open Design`.
- Locale `app.brand` labels remain `Open Design`.
- Packaged desktop app identity and release titles remain `Open Design`.

Packaged installer assets use these formats:

- macOS: `tools/pack/resources/mac/icon.icns`
- Windows: `tools/pack/resources/win/icon.ico`

Those installer assets are now generated from `assets/cubecloud-logos/Logo.png/800X800 常规.png` and stored in the pack resource paths.

## 3. OpenSpace App Platform Integration

The recommended v1 integration is Showcase registration, not an extra OpenSpace page.

- Register Open Design in `openspace/config/standalone_apps.json` as another Agent Apps Platform app.
- Point the app card at the Open Design web UI container URL.
- Let the OpenSpace dashboard and Showcase surfaces redirect users to the standalone Open Design web UI.
- Keep Open Design isolated as its own app shell instead of importing `apps/web` React components directly into OpenSpace.

Recommended topology:

```text
OpenSpace browser
  -> /showcase
  -> Open Design card
  -> http://localhost:7831
  -> open-design-web
  -> open-design-daemon
```

This keeps the current Open Design routing, assets, and daemon-backed API surface intact while making it appear beside My Daily Monitor and OpenHarness in the OpenSpace app gallery.

Because most of step 3 lives on the OpenSpace surface, do not move the OpenSpace code into this repository. Instead, open both repositories in one VS Code workspace.

Recommended workspace shape:

```text
workspace
  /open-design
  /openspace
```

This repo now includes `cubecloud-suite.code-workspace`, which opens both `open-design` and the sibling `../OpenSpace` repo together when they live under the same parent directory.

In VS Code, add the OpenSpace repository as a second workspace folder. That lets the integration stay where it belongs:

- OpenSpace owns app registration, navigation, auth, and redirect behavior.
- Open Design stays focused on its own runtime shell and daemon contract.

If the integration is mostly "one of the OpenSpace web apps", then most of the implementation should happen in the OpenSpace repo, not here.

## 4. Service API Wiring

OpenSpace, Ironclaw, OpenClaw, or other internal service clients should call the daemon directly.

Primary endpoints:

- `GET /api/agents`
- `POST /api/runs`
- `GET /api/runs/:id/events`
- `POST /api/runs/:id/cancel`
- `POST /api/chat`
- Project, file, raw, archive, media, deploy, artifact, and frame routes exposed by the daemon

Recommended integration flow:

1. Query `GET /api/agents` to confirm which runtimes are available.
2. Create work with `POST /api/runs` or `POST /api/chat`.
3. Stream progress through `GET /api/runs/:id/events`.
4. Fetch artifacts and generated files from daemon-backed endpoints.
5. Cancel long-running work through `POST /api/runs/:id/cancel`.

## 5. Hermes Validation

Hermes is already wired in source:

- Agent id: `hermes`
- Binary: `hermes`
- Transport: ACP JSON-RPC

Current validation status in this workspace:

- Source registration exists in `apps/daemon/src/agents.ts`.
- Live runtime validation is blocked because `Get-Command hermes` failed in the current environment.

Once the Hermes CLI is installed, validate with:

```bash
hermes --version
docker compose up -d
curl http://localhost:7456/api/agents
```

Expected result: Hermes appears in the daemon agent list and can be selected through the normal run/chat flow.

## 6. Auth And Tenant Scope

For v1, keep Open Design private behind OpenSpace. Do not add a separate auth layer or tenant model unless one of these becomes true:

- Open Design is exposed directly to end users.
- Multiple external tenants need isolated workspaces.
- OpenSpace can no longer enforce access at the gateway layer.

Until then, rely on OpenSpace or the private network boundary to gate access.