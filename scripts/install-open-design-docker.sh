#!/usr/bin/env bash

set -euo pipefail

owner="jzkk720"
repository="open-design"
repo_ref="main"
image_tag="latest"
install_dir="$(pwd)/open-design-docker"
mode=""
api_protocol=""
api_base_url=""
api_model=""
ghcr_username=""
ghcr_token=""
skip_start="false"

usage() {
  cat <<'EOF'
Usage: install-open-design-docker.sh [options]

Options:
  --owner <value>                      GitHub owner that publishes the GHCR images. Default: jzkk720
  --repository <value>                 Repository name. Default: open-design
  --repo-ref <value>                   Git ref used to download compose.ghcr.yaml. Default: main
  --image-tag <value>                  GHCR image tag to deploy. Default: latest
  --install-dir <value>                Target directory for compose. Default: ./open-design-docker
  --mode <value>                       Optional OD_DEFAULT_MODE value.
  --api-protocol <value>               Optional OD_DEFAULT_API_PROTOCOL value.
  --api-base-url <value>               Optional OD_DEFAULT_API_BASE_URL value.
  --api-model <value>                  Optional OD_DEFAULT_API_MODEL value.
  --ghcr-username <value>              Optional GHCR username for docker login.
  --ghcr-token <value>                 Optional GHCR token for docker login.
  --skip-start                         Only pull the images; do not run docker compose up -d.
  --help                               Show this help text.
EOF
}

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

need_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "required command not found: $1"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --owner)
      owner="${2:-}"
      shift 2
      ;;
    --repository)
      repository="${2:-}"
      shift 2
      ;;
    --repo-ref)
      repo_ref="${2:-}"
      shift 2
      ;;
    --image-tag)
      image_tag="${2:-}"
      shift 2
      ;;
    --install-dir)
      install_dir="${2:-}"
      shift 2
      ;;
    --mode)
      mode="${2:-}"
      shift 2
      ;;
    --api-protocol)
      api_protocol="${2:-}"
      shift 2
      ;;
    --api-base-url)
      api_base_url="${2:-}"
      shift 2
      ;;
    --api-model)
      api_model="${2:-}"
      shift 2
      ;;
    --ghcr-username)
      ghcr_username="${2:-}"
      shift 2
      ;;
    --ghcr-token)
      ghcr_token="${2:-}"
      shift 2
      ;;
    --skip-start)
      skip_start="true"
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      fail "unknown argument: $1"
      ;;
  esac
done

need_command curl
need_command docker

owner_lower="$(printf '%s' "$owner" | tr '[:upper:]' '[:lower:]')"
compose_url="https://raw.githubusercontent.com/${owner}/${repository}/${repo_ref}/compose.ghcr.yaml"
compose_path="${install_dir}/compose.ghcr.yaml"
env_path="${install_dir}/.env.ghcr"

mkdir -p "$install_dir"
curl -fsSL "$compose_url" -o "$compose_path"

cat > "$env_path" <<EOF
OPEN_DESIGN_IMAGE_OWNER=${owner_lower}
OPEN_DESIGN_IMAGE_REPOSITORY=${repository}
OPEN_DESIGN_IMAGE_TAG=${image_tag}
OD_DEFAULT_MODE=${mode}
OD_DEFAULT_API_PROTOCOL=${api_protocol}
OD_DEFAULT_API_BASE_URL=${api_base_url}
OD_DEFAULT_API_MODEL=${api_model}
EOF

if [[ -n "$ghcr_username" && -n "$ghcr_token" ]]; then
  printf '%s' "$ghcr_token" | docker login ghcr.io --username "$ghcr_username" --password-stdin
fi

pushd "$install_dir" >/dev/null
if ! docker compose --env-file .env.ghcr -f compose.ghcr.yaml pull; then
  cat <<EOF >&2
docker compose pull failed.

If GHCR access is private on this machine, run:
  docker login ghcr.io

Then rerun this installer.
EOF
  exit 1
fi

if [[ "$skip_start" != "true" ]]; then
  docker compose --env-file .env.ghcr -f compose.ghcr.yaml up -d
fi
popd >/dev/null

printf 'Open Design Docker files written to %s\n' "$install_dir"
if [[ "$skip_start" = "true" ]]; then
  printf 'Images pulled successfully. Start later with docker compose --env-file .env.ghcr -f compose.ghcr.yaml up -d\n'
else
  printf 'Stack started successfully.\n'
fi