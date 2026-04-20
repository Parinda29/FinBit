$ErrorActionPreference = "Stop"

$sourceFrontend = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$localRoot = "C:\fb-local"
$localFrontend = Join-Path $localRoot "frontend"

if (-not (Test-Path $localRoot)) {
  New-Item -ItemType Directory -Path $localRoot | Out-Null
}

Write-Host "Syncing frontend to local build path: $localFrontend"
$null = robocopy $sourceFrontend $localFrontend /MIR /XD node_modules .expo android\build android\.gradle android\.cxx /NFL /NDL /NJH /NJS /NC /NS
$rc = $LASTEXITCODE
if ($rc -ge 8) {
  throw "robocopy failed with exit code $rc"
}

$srcLock = Join-Path $sourceFrontend "package-lock.json"
$dstLock = Join-Path $localFrontend "package-lock.json"
$needsInstall = $false
if (-not (Test-Path (Join-Path $localFrontend "node_modules"))) {
  $needsInstall = $true
} elseif ((Test-Path $srcLock) -and (Test-Path $dstLock)) {
  $srcHash = (Get-FileHash $srcLock -Algorithm SHA256).Hash
  $dstHash = (Get-FileHash $dstLock -Algorithm SHA256).Hash
  if ($srcHash -ne $dstHash) {
    $needsInstall = $true
  }
}

Set-Location $localFrontend

if ($needsInstall) {
  Write-Host "Installing dependencies in local build mirror..."
  npm install
}

if (Test-Path ".\android\gradlew.bat") {
  Set-Location ".\android"
  .\gradlew.bat --stop | Out-Null
  Set-Location ".."
}

$localCaches = @(
  ".\.gradle",
  ".\android\.gradle",
  ".\android\build",
  ".\android\app\build"
)
foreach ($cachePath in $localCaches) {
  if (Test-Path $cachePath) {
    Remove-Item $cachePath -Recurse -Force -ErrorAction SilentlyContinue
  }
}

# Remove stale native module build outputs that are frequently locked on Windows.
$stalePaths = @(
  ".\node_modules\react-native-reanimated\android\build",
  ".\node_modules\react-native-worklets\android\build",
  ".\node_modules\react-native-svg\android\build",
  ".\node_modules\react-native-screens\android\build",
  ".\node_modules\react-native-gesture-handler\android\build",
  ".\node_modules\react-native-safe-area-context\android\build",
  ".\node_modules\react-native-get-sms-android\android\build"
)
foreach ($path in $stalePaths) {
  if (Test-Path $path) {
    Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
  }
}

$env:NODE_ENV = "development"
$env:CI = "1"

# Regenerate android files in local mirror so autolinking paths stay local.
npx expo prebuild --platform android --clean

Write-Host "Running Expo Android from local mirror: $localFrontend"
npx expo run:android
