param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Archive
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$manifest = Get-Content -LiteralPath (Join-Path $Source 'HANDOFF-MANIFEST.json') -Raw | ConvertFrom-Json
$writer = [System.IO.Compression.ZipFile]::Open($Archive, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    # Explicit forward slashes keep entry names portable across ZIP readers.
    foreach ($relative in @($manifest.files.path) + @('HANDOFF-MANIFEST.json')) {
        [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $writer, (Join-Path $Source $relative), $relative,
            [System.IO.Compression.CompressionLevel]::Optimal
        )
    }
} finally { $writer.Dispose() }
$zip = [System.IO.Compression.ZipFile]::OpenRead($Archive)
try {
    if ($zip.Entries.Count -ne ($manifest.files.Count + 1)) { throw 'ZIP entry count mismatch.' }
    foreach ($file in $manifest.files) {
        $entry = $zip.GetEntry($file.path)
        if ($null -eq $entry -or $entry.Length -ne $file.size) { throw "ZIP entry mismatch: $($file.path)" }
        $stream = $entry.Open()
        $sha = [System.Security.Cryptography.SHA256]::Create()
        try {
            $hash = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '').ToLowerInvariant()
            if ($hash -ne $file.sha256) { throw "ZIP hash mismatch: $($file.path)" }
        } finally { $stream.Dispose(); $sha.Dispose() }
    }
    $entry = $zip.GetEntry('HANDOFF-MANIFEST.json')
    $reader = New-Object System.IO.StreamReader($entry.Open())
    try {
        if ($reader.ReadToEnd() -ne [System.IO.File]::ReadAllText((Join-Path $Source 'HANDOFF-MANIFEST.json'))) {
            throw 'ZIP manifest mismatch.'
        }
    } finally { $reader.Dispose() }
} finally { $zip.Dispose() }
Write-Output "ZIP verified: $($manifest.files.Count) file hashes and manifest."
