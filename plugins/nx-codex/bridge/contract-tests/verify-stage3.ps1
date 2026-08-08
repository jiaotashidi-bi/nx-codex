param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Container })]
    [string]$NXOpenDir,

    [string]$MatrixPath,

    [string]$BridgeBuildRoot
)

$ErrorActionPreference = "Stop"
$bridgeRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$apiIndexRoot = Join-Path $bridgeRoot "api-index"
$generatedIndex = Join-Path $apiIndexRoot "generated\nxopen-12.0.2.9.json"
$contract = Join-Path $apiIndexRoot "contracts\nx12.0.2.9-required-api.json"
if ([string]::IsNullOrWhiteSpace($MatrixPath)) {
    $MatrixPath = Join-Path $apiIndexRoot "version-matrix.json"
}

& (Join-Path $PSScriptRoot "verify-json-codec.ps1")
& (Join-Path $PSScriptRoot "verify-bridge-lifecycle.ps1")
& (Join-Path $PSScriptRoot "verify-nxopen-contract.ps1") `
    -NXOpenDir $NXOpenDir
& (Join-Path $PSScriptRoot "verify-cae-readonly-contract.ps1") `
    -NXOpenDir $NXOpenDir
& (Join-Path $apiIndexRoot "generate-nxopen-api-index.ps1") `
    -NXOpenDir $NXOpenDir `
    -OutputPath $generatedIndex
& (Join-Path $apiIndexRoot "test-api-index-tools.ps1") `
    -IndexPath $generatedIndex `
    -ContractPath $contract `
    -NXOpenDir $NXOpenDir
if ([string]::IsNullOrWhiteSpace($BridgeBuildRoot)) {
    $bridgeOutputPath = $null
    $bridgeIntermediatePath = $null
    $bridgeAssemblyPath = Join-Path $bridgeRoot "NXCodexBridge\bin\Debug\NXCodexBridge.dll"
} else {
    $BridgeBuildRoot = [IO.Path]::GetFullPath($BridgeBuildRoot)
    $bridgeOutputPath = Join-Path $BridgeBuildRoot "bin"
    $bridgeIntermediatePath = Join-Path $BridgeBuildRoot "obj"
    $bridgeAssemblyPath = Join-Path $bridgeOutputPath "NXCodexBridge.dll"
}
& (Join-Path $bridgeRoot "build.ps1") `
    -NXOpenDir $NXOpenDir `
    -Configuration Debug `
    -OutputPath $bridgeOutputPath `
    -IntermediateOutputPath $bridgeIntermediatePath
& (Join-Path $PSScriptRoot "verify-version-adapter.ps1") `
    -NXOpenDir $NXOpenDir `
    -BridgeAssemblyPath $bridgeAssemblyPath
& (Join-Path $apiIndexRoot "test-version-matrix.ps1") `
    -MatrixPath $MatrixPath

Write-Host "NX Codex stage-three verification passed."
