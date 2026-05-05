[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Owner,
  [string]$Repository = "open-design",
  [string]$RepoRef = "main",
  [string]$ImageTag = "main",
  [string]$InstallDir = (Join-Path (Get-Location) "open-design-docker"),
  [string]$Mode = "",
  [string]$ApiProtocol = "",
  [string]$ApiBaseUrl = "",
  [string]$ApiModel = "",
  [string]$AllowLocalApiBaseUrl = "",
  [string]$GhcrUsername = "",
  [string]$GhcrToken = "",
  [switch]$SkipStart
)

$ErrorActionPreference = "Stop"

function Fail([string]$Message) {
  Write-Error $Message
  exit 1
}

function Require-Command([string]$CommandName) {
  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    Fail "required command not found: $CommandName"
  }
}

Require-Command "docker"

$ownerLower = $Owner.ToLowerInvariant()
$composeUrl = "https://raw.githubusercontent.com/$Owner/$Repository/$RepoRef/compose.ghcr.yaml"
$composePath = Join-Path $InstallDir "compose.ghcr.yaml"
$envPath = Join-Path $InstallDir ".env.ghcr"

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
Invoke-WebRequest -Uri $composeUrl -OutFile $composePath

$envLines = @(
  "OPEN_DESIGN_IMAGE_OWNER=$ownerLower",
  "OPEN_DESIGN_IMAGE_REPOSITORY=$Repository",
  "OPEN_DESIGN_IMAGE_TAG=$ImageTag",
  "OD_DEFAULT_MODE=$Mode",
  "OD_DEFAULT_API_PROTOCOL=$ApiProtocol",
  "OD_DEFAULT_API_BASE_URL=$ApiBaseUrl",
  "OD_DEFAULT_API_MODEL=$ApiModel",
  "OD_DEFAULT_ALLOW_LOCAL_API_BASE_URL=$AllowLocalApiBaseUrl"
)
Set-Content -Path $envPath -Value ($envLines -join [Environment]::NewLine)

if ($GhcrUsername.Length -gt 0 -and $GhcrToken.Length -gt 0) {
  $GhcrToken | docker login ghcr.io --username $GhcrUsername --password-stdin | Out-Null
}

Push-Location $InstallDir
try {
  & docker compose --env-file .env.ghcr -f compose.ghcr.yaml pull
  if ($LASTEXITCODE -ne 0) {
    Fail @"
docker compose pull failed.

If GHCR access is private on this machine, run:
  docker login ghcr.io

Then rerun this installer.
"@
  }

  if (-not $SkipStart.IsPresent) {
    & docker compose --env-file .env.ghcr -f compose.ghcr.yaml up -d
    if ($LASTEXITCODE -ne 0) {
      Fail "docker compose up -d failed"
    }
  }
}
finally {
  Pop-Location
}

Write-Host "Open Design Docker files written to $InstallDir"
if ($SkipStart.IsPresent) {
  Write-Host "Images pulled successfully. Start later with docker compose --env-file .env.ghcr -f compose.ghcr.yaml up -d"
}
else {
  Write-Host "Stack started successfully."
}