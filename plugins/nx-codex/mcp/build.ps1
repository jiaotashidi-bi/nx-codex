$ErrorActionPreference = "Stop"

$temporaryRoot = Join-Path ([IO.Path]::GetTempPath()) ("nx-codex-build-" + [Guid]::NewGuid().ToString("N"))
$resolvedSystemTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())

New-Item -ItemType Directory -Path $temporaryRoot | Out-Null

try {
    node (Join-Path $PSScriptRoot "build.mjs") $temporaryRoot
    if ($LASTEXITCODE -ne 0) {
        throw "Node bundle failed with exit code $LASTEXITCODE"
    }

    $destination = Join-Path $PSScriptRoot "dist"
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $temporaryRoot "mcp") -Destination $destination -Recurse -Force
    Copy-Item -LiteralPath (Join-Path $temporaryRoot "mock-bridge") -Destination $destination -Recurse -Force
}
finally {
    $resolvedTemporaryRoot = [IO.Path]::GetFullPath($temporaryRoot)
    if ($resolvedTemporaryRoot.StartsWith($resolvedSystemTemp, [StringComparison]::OrdinalIgnoreCase) -and
        (Split-Path -Leaf $resolvedTemporaryRoot).StartsWith("nx-codex-build-", [StringComparison]::Ordinal)) {
        Remove-Item -LiteralPath $resolvedTemporaryRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

