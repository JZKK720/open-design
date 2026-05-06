[CmdletBinding()]
param(
  [string]$RepoRoot = "",
  [string]$TaskName = "OpenDesignGhcrUpdateDaily",
  [ValidatePattern('^\d{2}:\d{2}$')]
  [string]$StartTime = "03:30",
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

Require-Command "schtasks"

$powershellCommand = Get-Command powershell -ErrorAction SilentlyContinue
if (-not $powershellCommand) {
  Fail "required command not found: powershell"
}

$resolvedRepoRoot = (Resolve-Path $RepoRoot).Path
$updateScript = Join-Path $resolvedRepoRoot "scripts\update-open-design-ghcr.ps1"

if (-not (Test-Path $updateScript)) {
  Fail "update script not found: $updateScript"
}

$resolvedUpdateScript = (Resolve-Path $updateScript).Path
$taskCommand = ('"{0}" -NoProfile -ExecutionPolicy Bypass -File "{1}"' -f $powershellCommand.Source, $resolvedUpdateScript)
if ($SkipPull.IsPresent) {
  $taskCommand += " -SkipPull"
}

& schtasks /Create /TN $TaskName /SC DAILY /ST $StartTime /TR $taskCommand /F | Out-Null
if ($LASTEXITCODE -ne 0) {
  Fail "schtasks /Create failed"
}

$taskDetails = & schtasks /Query /TN $TaskName /V /FO LIST
if ($LASTEXITCODE -ne 0) {
  Fail "schtasks /Query failed"
}

Write-Host "Scheduled task registered successfully."
Write-Host $taskDetails