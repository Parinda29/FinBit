param(
    [string]$NgrokAuthToken = "",
    [int]$Port = 8000,
    [string]$PythonExe = "",
    [switch]$SkipFrontendEnvUpdate,
    [switch]$SkipExpoRestart
)

$ErrorActionPreference = "Stop"

if (-not $NgrokAuthToken) {
    $NgrokAuthToken = $env:NGROK_AUTHTOKEN
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..")
$FrontendEnvLocal = Join-Path $RepoRoot "frontend/.env.local"
$NgrokSyncScript = Join-Path $ScriptDir "get_ngrok_url.py"

function Resolve-NgrokExe {
    $cmd = Get-Command ngrok -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source) {
        return $cmd.Source
    }

    $wingetLink = Join-Path $env:LOCALAPPDATA "Microsoft/WinGet/Links/ngrok.exe"
    if (Test-Path $wingetLink) {
        return $wingetLink
    }

    $packageRoot = Join-Path $env:LOCALAPPDATA "Microsoft/WinGet/Packages"
    $candidate = Get-ChildItem $packageRoot -Directory -Filter "Ngrok.Ngrok*" -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($candidate) {
        $exe = Join-Path $candidate.FullName "ngrok.exe"
        if (Test-Path $exe) {
            return $exe
        }
    }

    return $null
}

if (-not $PythonExe) {
    $venvPython = Join-Path $RepoRoot ".venv/Scripts/python.exe"
    if (Test-Path $venvPython) {
        $PythonExe = $venvPython
    } else {
        $PythonExe = "python"
    }
}

$ngrokExe = Resolve-NgrokExe
if (-not $ngrokExe) {
    Write-Host "ngrok is not installed or not in PATH." -ForegroundColor Yellow
    Write-Host "Install from: https://ngrok.com/download" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $NgrokSyncScript)) {
    Write-Host "Missing ngrok sync script: $NgrokSyncScript" -ForegroundColor Red
    exit 1
}

if ($NgrokAuthToken) {
    Write-Host "Configuring ngrok auth token..."
    & $ngrokExe config add-authtoken $NgrokAuthToken | Out-Null
}

Write-Host "Starting ngrok tunnel..."
$ngrokArgs = @("http", "$Port")
$ngrokProc = Start-Process -FilePath $ngrokExe -ArgumentList $ngrokArgs -WorkingDirectory $ScriptDir -PassThru

$syncArgs = @($NgrokSyncScript, "--backend-env", "backend/.env")
if (-not $SkipFrontendEnvUpdate) {
    $syncArgs += @("--frontend-env", "frontend/.env.local")
}

Write-Host "Syncing ngrok URL into env files..."
& $PythonExe $syncArgs --retries 20 --delay 0.25
if ($LASTEXITCODE -ne 0) {
    Write-Host "Could not sync ngrok URL into env files." -ForegroundColor Red
    Stop-Process -Id $ngrokProc.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

$publicUrl = (& $PythonExe $NgrokSyncScript --print-only --retries 20 --delay 0.25).Trim()

Write-Host "Starting Django server on 0.0.0.0:$Port ..."
$djangoArgs = @("manage.py", "runserver", "0.0.0.0:$Port")
$djangoProc = Start-Process -FilePath $PythonExe -ArgumentList $djangoArgs -WorkingDirectory $ScriptDir -PassThru

Start-Sleep -Seconds 1
if ($djangoProc.HasExited) {
    Write-Host "Django server exited unexpectedly." -ForegroundColor Red
    Stop-Process -Id $ngrokProc.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""
Write-Host "FinBit demo tunnel is ready:" -ForegroundColor Green
Write-Host "Public API base: $publicUrl/api"
Write-Host "Django PID: $($djangoProc.Id)"
Write-Host "ngrok PID: $($ngrokProc.Id)"
Write-Host ""
Write-Host "To stop: Stop-Process -Id $($djangoProc.Id),$($ngrokProc.Id)"

if (-not $SkipExpoRestart) {
    Write-Host "Restarting Expo from frontend workspace..."

    $expoNodeProcesses = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
            $_.Name -eq 'node.exe' -and
            $_.CommandLine -and
            ($_.CommandLine -match 'expo(\.cmd)?\s+start' -or $_.CommandLine -match 'expo-router/entry')
        }

    foreach ($proc in $expoNodeProcesses) {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    }

    Start-Process -FilePath "npm" -ArgumentList @("run", "start") -WorkingDirectory (Join-Path $RepoRoot "frontend") | Out-Null
    Write-Host "Expo restarted with updated EXPO_PUBLIC_API_HOST."
}
