$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$poleNodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($poleNodeCommand) { $poleRuntime = $poleNodeCommand.Source }
else { $poleRuntime = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
if (-not (Test-Path -LiteralPath $poleRuntime)) { throw 'Node.js 22.13 or newer is required.' }
$poleVite = Join-Path $PSScriptRoot 'node_modules\vite\bin\vite.js'
if (-not (Test-Path -LiteralPath $poleVite)) { $poleVite = Join-Path $PSScriptRoot '..\node_modules\vite\bin\vite.js' }
if (-not (Test-Path -LiteralPath $poleVite)) { throw 'Install the project dependencies with npm ci first.' }
Write-Host 'Pole Insights P27 DEV (P26 base): http://127.0.0.1:5190 (Ctrl+C to stop)'
& $poleRuntime $poleVite --config vite.config.ts
