[CmdletBinding()]
param(
  [string]$RepoRoot = "",
  [switch]$SkipPull
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  $RepoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
}

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

$composePath = Join-Path $RepoRoot "compose.ghcr.yaml"
$envPath = Join-Path $RepoRoot ".env.ghcr"

if (-not (Test-Path $composePath)) {
  Fail "compose file not found: $composePath"
}

if (-not (Test-Path $envPath)) {
  Fail "environment file not found: $envPath"
}

Push-Location $RepoRoot
try {
  if (-not $SkipPull.IsPresent) {
    & docker compose --env-file $envPath -f $composePath pull
    if ($LASTEXITCODE -ne 0) {
      Fail "docker compose pull failed"
    }
  }

  & docker compose --env-file $envPath -f $composePath up -d
  if ($LASTEXITCODE -ne 0) {
    Fail "docker compose up -d failed"
  }
}
finally {
  Pop-Location
}

Write-Host "Open Design GHCR stack updated successfully."