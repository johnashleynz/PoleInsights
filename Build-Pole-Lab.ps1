$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$poleBuildNode = Get-Command node -ErrorAction SilentlyContinue
if ($poleBuildNode) { $poleBuildRuntime = $poleBuildNode.Source }
else { $poleBuildRuntime = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
if (-not (Test-Path -LiteralPath $poleBuildRuntime)) { throw 'Node.js 22.13 or newer is required.' }
& $poleBuildRuntime tools/build.mjs
if ($LASTEXITCODE -ne 0) { throw 'The review build did not pass its checks.' }
