param(
    [string]$PluginRoot = (Join-Path $PSScriptRoot "..")
)

$ErrorActionPreference = "Stop"
$PluginRoot = [IO.Path]::GetFullPath($PluginRoot)

function Read-JsonFile {
    param([string]$Path)
    return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
}

function Require-Equal {
    param(
        [string]$Label,
        [string]$Actual,
        [string]$Expected
    )
    if ($Actual -cne $Expected) {
        throw "$Label mismatch: expected '$Expected', actual '$Actual'."
    }
}

$release = Read-JsonFile (Join-Path $PluginRoot "release.json")
$expectedPackageVersion = [string]$release.packageVersion
$expectedNxVersion = [string]$release.supportedNxOpenAssemblyVersion
$expectedAdapterId = [string]$release.supportedAdapterId
$expectedContractId = [string]$release.supportedAdapterContractId

$plugin = Read-JsonFile (Join-Path $PluginRoot ".codex-plugin\plugin.json")
$mcpPackage = Read-JsonFile (Join-Path $PluginRoot "mcp\package.json")
$mcpLockSource = Get-Content -Raw -LiteralPath (Join-Path $PluginRoot "mcp\package-lock.json")
Require-Equal "plugin.json version" ([string]$plugin.version) $expectedPackageVersion
Require-Equal "mcp/package.json version" ([string]$mcpPackage.version) $expectedPackageVersion
if ($mcpLockSource -notmatch ('"version":\s*"' + [regex]::Escape($expectedPackageVersion) + '"')) {
    throw "mcp/package-lock.json top-level version is inconsistent."
}
if ($mcpLockSource -notmatch ('"packages":\s*\{\s*"":\s*\{(?s).*?"version":\s*"' + [regex]::Escape($expectedPackageVersion) + '"')) {
    throw "mcp/package-lock.json root package version is inconsistent."
}

$serverSource = Get-Content -Raw -LiteralPath (Join-Path $PluginRoot "mcp\src\server.ts")
$mockSource = Get-Content -Raw -LiteralPath (Join-Path $PluginRoot "mcp\src\mock-bridge.ts")
$protocolSource = Get-Content -Raw -LiteralPath (Join-Path $PluginRoot "bridge\NXCodexBridge\BridgeProtocol.cs")
$assemblyInfo = Get-Content -Raw -LiteralPath (Join-Path $PluginRoot "bridge\NXCodexBridge\Properties\AssemblyInfo.cs")
foreach ($item in @(
    @{ Label = "MCP server version"; Source = $serverSource; Pattern = 'version:\s*"([^"]+)"' },
    @{ Label = "Mock bridge version"; Source = $mockSource; Pattern = 'bridgeVersion:\s*"([^"]+)"' },
    @{ Label = "Bridge protocol version"; Source = $protocolSource; Pattern = 'BridgeVersion\s*=\s*"([^"]+)"' },
    @{ Label = "Bridge informational version"; Source = $assemblyInfo; Pattern = 'AssemblyInformationalVersion\("([^"]+)"\)' }
)) {
    $match = [regex]::Match($item.Source, $item.Pattern)
    if (-not $match.Success) {
        throw "Could not find $($item.Label)."
    }
    Require-Equal $item.Label $match.Groups[1].Value $expectedPackageVersion
}

$numericVersion = ($release.releaseVersion -replace '-.*$', '') + ".0"
if ($assemblyInfo -notmatch ('AssemblyVersion\("' + [regex]::Escape($numericVersion) + '"\)')) {
    throw "Bridge AssemblyVersion must be $numericVersion."
}
if ($assemblyInfo -notmatch ('AssemblyFileVersion\("' + [regex]::Escape($numericVersion) + '"\)')) {
    throw "Bridge AssemblyFileVersion must be $numericVersion."
}

$adapterSource = Get-Content -Raw -LiteralPath (Join-Path $PluginRoot "mcp\src\version-adapter.ts")
$adapterCsSource = Get-Content -Raw -LiteralPath (Join-Path $PluginRoot "bridge\NXCodexBridge\NxVersionAdapters.cs")
Require-Equal "MCP verified assembly selector" ([regex]::Match($adapterSource, 'nxOpenAssemblyVersion === "([^"]+)"').Groups[1].Value) $expectedNxVersion
Require-Equal "MCP adapter ID" ([regex]::Match($adapterSource, 'adapterId: "([^"]+)"').Groups[1].Value) $expectedAdapterId
Require-Equal "MCP adapter contract" ([regex]::Match($adapterSource, 'adapterContractId: "([^"]+)"').Groups[1].Value) $expectedContractId
if ($adapterCsSource -notmatch [regex]::Escape($expectedNxVersion) -or
    $adapterCsSource -notmatch [regex]::Escape($expectedAdapterId) -or
    $adapterCsSource -notmatch [regex]::Escape($expectedContractId)) {
    throw "C# adapter identity is inconsistent with release.json."
}

$matrix = Read-JsonFile (Join-Path $PluginRoot "bridge\api-index\version-matrix.json")
$verified = @($matrix.entries | Where-Object { $_.id -eq "nx12.0.2.9" })
if ($verified.Count -ne 1) {
    throw "Version matrix must contain exactly one NX 12.0.2.9 entry."
}
Require-Equal "Version matrix verified status" ([string]$verified[0].verificationStatus) "verified"
Require-Equal "Version matrix adapter expectation" ([string]$verified[0].adapterExpectation) "verified"
foreach ($releaseId in @($release.unsupportedUnverifiedReleases)) {
    $entry = @($matrix.entries | Where-Object { $_.id -eq ("nx" + $releaseId) })
    if ($entry.Count -ne 1) {
        throw "Version matrix is missing nx$releaseId."
    }
    Require-Equal "nx$releaseId adapter expectation" ([string]$entry[0].adapterExpectation) "unsupported"
    Require-Equal "nx$releaseId verification status" ([string]$entry[0].verificationStatus) "unverified"
    if ($null -ne $entry[0].contractPath) {
        throw "nx$releaseId must not have a required API contract."
    }
    foreach ($evidenceName in @("apiIndex", "requiredApiContract", "typedRuntimeAdapter", "liveReadOnlyHandshake", "versionSpecificSmoke")) {
        if ([bool]$entry[0].evidence.$evidenceName) {
            throw "nx$releaseId evidence.$evidenceName must remain false."
        }
    }
}

$contract = Read-JsonFile (Join-Path $PluginRoot "bridge\api-index\contracts\nx12.0.2.9-required-api.json")
Require-Equal "API contract adapter ID" ([string]$contract.adapterId) $expectedAdapterId
Require-Equal "API contract ID" ([string]$contract.contractId) $expectedContractId
foreach ($assembly in @($contract.assemblies)) {
    Require-Equal "API contract $($assembly.name) version" ([string]$assembly.assemblyVersion) $expectedNxVersion
}

$index = Read-JsonFile (Join-Path $PluginRoot "bridge\api-index\generated\nxopen-12.0.2.9.json")
foreach ($assembly in @($index.assemblies)) {
    Require-Equal "API index $($assembly.name) assembly version" ([string]$assembly.assemblyVersion) $expectedNxVersion
}

Write-Host "Release consistency passed: $($release.releaseVersion) ($expectedPackageVersion)"
Write-Host "  NXOpen: $expectedNxVersion"
Write-Host "  Adapter: $expectedAdapterId"
Write-Host "  Contract: $expectedContractId"
Write-Host "  Unsupported/unverified: $($release.unsupportedUnverifiedReleases -join ', ')"
