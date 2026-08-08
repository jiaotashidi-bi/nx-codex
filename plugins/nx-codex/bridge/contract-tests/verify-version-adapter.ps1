param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Container })]
    [string]$NXOpenDir,

    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$BridgeAssemblyPath
)

$ErrorActionPreference = "Stop"
foreach ($fileName in @("NXOpen.dll", "NXOpen.UF.dll", "NXOpen.Utilities.dll")) {
    [Reflection.Assembly]::LoadFrom((Join-Path $NXOpenDir $fileName)) | Out-Null
}
$bridge = [Reflection.Assembly]::LoadFrom(
    (Resolve-Path -LiteralPath $BridgeAssemblyPath).Path)
$registry = $bridge.GetType(
    "NXCodexBridge.NxVersionAdapterRegistry",
    $true)
$select = $registry.GetMethod(
    "Select",
    [Reflection.BindingFlags]::Static -bor
    [Reflection.BindingFlags]::Public -bor
    [Reflection.BindingFlags]::NonPublic)
if ($null -eq $select) {
    throw "Missing NxVersionAdapterRegistry.Select."
}

function Read-Profile {
    param([string]$Version)

    $adapter = $select.Invoke($null, @([Version]$Version))
    return [PSCustomObject]@{
        Id = $adapter.Id
        ContractId = $adapter.ContractId
        CompatibilityStatus = $adapter.CompatibilityStatus
        NxOpenAssemblyVersion = $adapter.NxOpenAssemblyVersion
        Capabilities = @($adapter.SupportedCapabilities)
        SupportsBlock = $adapter.Supports("create_block")
        SupportsHealth = $adapter.Supports("health")
        SupportsAssemblyDetection = $adapter.Supports("get_assembly_capability")
        SupportsAssemblyStructure = $adapter.Supports("get_assembly_structure")
        SupportsDraftingDetection = $adapter.Supports("get_drafting_capability")
        SupportsDraftingStructure = $adapter.Supports("get_drafting_structure")
        SupportsCaeDetection = $adapter.Supports("get_cae_capability")
        SupportsCamDetection = $adapter.Supports("get_cam_capability")
    }
}

$baseline = Read-Profile "12.0.2.9"
if ($baseline.Id -ne "nx12.0.2.9" -or
    $baseline.ContractId -ne "nx12.0.2.9-required-api-v1" -or
    $baseline.CompatibilityStatus -ne "verified" -or
    -not $baseline.SupportsBlock -or
    -not $baseline.SupportsHealth -or
    -not $baseline.SupportsAssemblyDetection -or
    -not $baseline.SupportsAssemblyStructure -or
    -not $baseline.SupportsDraftingDetection -or
    -not $baseline.SupportsDraftingStructure -or
    -not $baseline.SupportsCaeDetection -or
    -not $baseline.SupportsCamDetection -or
    $baseline.Capabilities -notcontains "fillet_vertical_edges" -or
    $baseline.Capabilities -notcontains "preflight_modeling" -or
    $baseline.Capabilities -notcontains "get_feature_tree" -or
    $baseline.Capabilities -notcontains "capture_screenshot") {
    throw "The exact NX 12.0.2.9 adapter selection contract failed."
}

foreach ($version in @("12.0.2.10", "23.6.0.0", "23.12.0.0", "24.12.0.0", "25.12.0.0")) {
    $candidate = Read-Profile $version
    if ($candidate.Id -ne "unsupported:$version" -or
        $candidate.ContractId -ne "none" -or
        $candidate.CompatibilityStatus -ne "unsupported" -or
        $candidate.SupportsBlock -or
        -not $candidate.SupportsHealth -or
        -not $candidate.SupportsAssemblyDetection -or
        $candidate.SupportsAssemblyStructure -or
        -not $candidate.SupportsDraftingDetection -or
        $candidate.SupportsDraftingStructure -or
        -not $candidate.SupportsCaeDetection -or
        -not $candidate.SupportsCamDetection -or
        $candidate.Capabilities.Count -ne 7) {
        throw "Unverified version $version did not fail closed."
    }
}

$detector = $bridge.GetType(
    "NXCodexBridge.Nx12ReadOnlyModuleCapabilityDetector",
    $true)
$isLicensed = $detector.GetMethod(
    "IsModuleLicensed",
    [Reflection.BindingFlags]::Static -bor
    [Reflection.BindingFlags]::Public -bor
    [Reflection.BindingFlags]::NonPublic)
if ($null -eq $isLicensed) {
    throw "Missing pure NX 12 module-license matcher."
}

foreach ($probe in @(
    @{ Module = "assembly"; Application = "UG_APP_ASSEMBLY"; Licenses = @(); Expected = $true },
    @{ Module = "drafting"; Application = "UG_APP_GATEWAY"; Licenses = @("drafting"); Expected = $true },
    @{ Module = "cae"; Application = "UG_APP_GATEWAY"; Licenses = @("advanced_simulation"); Expected = $true },
    @{ Module = "cam"; Application = "UG_APP_GATEWAY"; Licenses = @("cam_base"); Expected = $true },
    @{ Module = "cam"; Application = "UG_APP_GATEWAY"; Licenses = @("solid_modeling"); Expected = $false }
)) {
    $actual = [bool]$isLicensed.Invoke(
        $null,
        @([string]$probe.Module, [string]$probe.Application, [string[]]$probe.Licenses))
    if ($actual -ne [bool]$probe.Expected) {
        throw "Module-license matcher failed for $($probe.Module)."
    }
}

Write-Host "NX version-adapter selection passed:"
Write-Host "  Verified baseline: 12.0.2.9 -> nx12.0.2.9"
Write-Host "  Unverified versions: read-only handshake and structured module detection only"
