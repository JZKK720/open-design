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

Recommended update lane:

1. Keep your CubeCloud customizations on your fork's `main` branch.
2. Regularly merge or rebase `upstream/main` into your fork's `main`.
3. Push the updated fork branch.
4. Let the GHCR workflow republish the web and daemon images.
5. On other machines, pull the refreshed images and restart the stack.

For image-based deployment on other machines, use `compose.ghcr.yaml` instead of the local build compose file.

Example environment file:

- `.env.ghcr.example`

Set `OPEN_DESIGN_IMAGE_OWNER` to the GitHub owner of the fork that publishes the images. The example file uses a placeholder on purpose so the pull target does not silently drift to the wrong registry namespace.

For local machines that should follow future GHCR updates instead of rebuilding from source each time, keep a local `.env.ghcr` file based on the example and use the GHCR compose file on the same workstation.

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

## 1. Container Runtime

- The web shell is built as a static export and served by nginx.
- The daemon runs as a separate Node service on port `7456`.
- nginx forwards `/api`, `/artifacts`, and `/frames` to the daemon so the static web shell keeps its expected runtime behavior.
- Persistent daemon data is stored in the `open-design-data` volume and mounted at `/data`.
- Runtime persistence stays on the daemon's built-in SQLite database at `/data/app.sqlite`; no PostgreSQL service is required for the current deployment shape.
- Keep PostgreSQL as a later migration only if this moves beyond a single stack into a shared multi-instance service.

Use the root compose file:

```bash
docker compose build
docker compose up -d
```

Default endpoints:

- Web UI: `http://localhost:7831`
- Daemon API: `http://localhost:7456`

If OpenSpace joins the same Docker network, route browser traffic to `open-design-web:80` and server-to-server calls to `open-design-daemon:7456`.

For remote machines that should consume your fork's published images instead of building locally, use:

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