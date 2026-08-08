param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Container })]
    [string]$NxStartupDirectory,

    [string]$BridgeDll = (Join-Path $PSScriptRoot "NXCodexBridge\bin\Release\NXCodexBridge.dll"),

    [switch]$Force
)

$ErrorActionPreference = "Stop"
$resolvedDestination = (Resolve-Path -LiteralPath $NxStartupDirectory).Path
$resolvedBridge = (Resolve-Path -LiteralPath $BridgeDll -ErrorAction Stop).Path

if (-not $resolvedBridge.EndsWith(".dll", [StringComparison]::OrdinalIgnoreCase)) {
    throw "BridgeDll must point to a .dll file."
}

$destination = Join-Path $resolvedDestination "NXCodexBridge.dll"
if ((Test-Path -LiteralPath $destination -PathType Leaf) -and -not $Force) {
    throw "Destination already exists: $destination. Re-run with -Force only after reviewing the replacement."
}
Copy-Item -LiteralPath $resolvedBridge -Destination $destination -Force:$Force
Write-Host "Installed NX bridge: $destination"
Write-Host "Review the file, then load it from NX using File > Execute > NX Open or your approved startup configuration."
