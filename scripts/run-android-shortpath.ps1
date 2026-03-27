$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$workspaceRoot = Split-Path -Parent $projectRoot
$shortLink = "C:\fb"

if (-not (Test-Path $shortLink)) {
  Write-Host "Creating junction: $shortLink -> $workspaceRoot"
  cmd /c "mklink /J $shortLink \"$workspaceRoot\"" | Out-Null
}

$shortFrontend = Join-Path $shortLink "frontend"
if (-not (Test-Path $shortFrontend)) {
  throw "Short frontend path not found: $shortFrontend"
}

Write-Host "Running Expo Android from short path: $shortFrontend"
Set-Location $shortFrontend
npx expo run android
