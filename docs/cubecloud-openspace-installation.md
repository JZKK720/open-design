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

That workflow is manual on purpose. It lets you enter a release version such as `0.2.1`, optionally add release notes, publish semver-tagged Docker images, and create a GitHub release named `Open Design Docker <version>`.

Docker release outputs use these conventions:

- GitHub release tag: `open-design-docker-v<version>`
- GHCR daemon image: `ghcr.io/<owner>/<repo>-daemon:<version>`
- GHCR web image: `ghcr.io/<owner>/<repo>-web:<version>`
- Optional rolling tag refresh: `latest`

Recommended update lane:

1. Keep your CubeCloud customizations on your fork's `main` branch.
2. Regularly merge or rebase `upstream/main` into your fork's `main`.
3. Push the updated fork branch.
4. Let the GHCR workflow republish the web and daemon images.
5. On other machines, pull the refreshed images and restart the stack.

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
git merge upstream/main
git push origin main
```

Example update flow:

```bash
docker login ghcr.io
docker compose --env-file .env.ghcr -f compose.ghcr.yaml pull
docker compose --env-file .env.ghcr -f compose.ghcr.yaml up -d
```

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