param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$IndexPath,

    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$ContractPath
)

$ErrorActionPreference = "Stop"

function Assert-ExactProperties {
    param(
        [object]$Value,
        [string[]]$Expected,
        [string]$Context
    )

    $actual = @($Value.PSObject.Properties.Name | Sort-Object)
    $wanted = @($Expected | Sort-Object)
    if (($actual -join "|") -ne ($wanted -join "|")) {
        throw "$Context has an invalid property set. Expected [$($wanted -join ', ')], actual [$($actual -join ', ')]."
    }
}

$index = Get-Content -Raw -LiteralPath $IndexPath | ConvertFrom-Json
$contract = Get-Content -Raw -LiteralPath $ContractPath | ConvertFrom-Json
Assert-ExactProperties $index @(
    "schemaVersion", "generator", "memberFormat", "assemblies",
    "statistics", "types"
) "API index"
Assert-ExactProperties $contract @(
    "schemaVersion", "contractId", "adapterId", "assemblies",
    "requiredTypes", "requiredMembers", "forbiddenMembers"
) "API contract"
if ($index.schemaVersion -ne "1.0") {
    throw "Unsupported API index schemaVersion: $($index.schemaVersion)"
}
if ($contract.schemaVersion -ne "1.0") {
    throw "Unsupported API contract schemaVersion: $($contract.schemaVersion)"
}
if ($index.memberFormat -ne "canonical-key") {
    throw "Unsupported API index memberFormat: $($index.memberFormat)"
}

$assemblyVersions = @{}
foreach ($assembly in $index.assemblies) {
    Assert-ExactProperties $assembly @(
        "name", "fileName", "assemblyVersion", "fileVersion", "sha256"
    ) "API index assembly '$($assembly.name)'"
    if ([string]$assembly.sha256 -notmatch '^[A-F0-9]{64}$') {
        throw "API index assembly '$($assembly.name)' has an invalid SHA-256."
    }
    $assemblyVersions[$assembly.name] = $assembly.assemblyVersion
}
$typeKeys = @{}
$memberKeys = @{}
foreach ($type in $index.types) {
    Assert-ExactProperties $type @(
        "assembly", "namespace", "name", "fullName", "kind", "baseType",
        "interfaces", "members"
    ) "API index type '$($type.fullName)'"
    if ($typeKeys.ContainsKey([string]$type.fullName)) {
        throw "API index contains a duplicate type: $($type.fullName)"
    }
    $typeKeys[$type.fullName] = $true
    foreach ($member in $type.members) {
        $memberKey = [string]$member
        if ($memberKey -notmatch '^(constructor|method|property|field|event)\|') {
            throw "API index contains an invalid canonical member key: $memberKey"
        }
        if ($memberKeys.ContainsKey($memberKey)) {
            throw "API index contains a duplicate member key: $memberKey"
        }
        $memberKeys[$memberKey] = $true
    }
}

if ([int]$index.statistics.assemblyCount -ne @($index.assemblies).Count -or
    [int]$index.statistics.typeCount -ne @($index.types).Count -or
    [int]$index.statistics.memberCount -ne $memberKeys.Count) {
    throw "API index statistics do not match the indexed content."
}

$failures = @()
foreach ($requiredAssembly in $contract.assemblies) {
    Assert-ExactProperties $requiredAssembly @(
        "name", "assemblyVersion"
    ) "API contract assembly '$($requiredAssembly.name)'"
    if (-not $assemblyVersions.ContainsKey($requiredAssembly.name)) {
        $failures += "Missing assembly: $($requiredAssembly.name)"
    } elseif ($assemblyVersions[$requiredAssembly.name] -ne
        $requiredAssembly.assemblyVersion) {
        $failures += "Assembly version mismatch for $($requiredAssembly.name): expected $($requiredAssembly.assemblyVersion), actual $($assemblyVersions[$requiredAssembly.name])"
    }
}
foreach ($requiredType in $contract.requiredTypes) {
    if (-not $typeKeys.ContainsKey([string]$requiredType)) {
        $failures += "Missing type: $requiredType"
    }
}
foreach ($requiredMember in $contract.requiredMembers) {
    if (-not $memberKeys.ContainsKey([string]$requiredMember)) {
        $failures += "Missing member: $requiredMember"
    }
}
foreach ($forbiddenMember in $contract.forbiddenMembers) {
    if ($memberKeys.ContainsKey([string]$forbiddenMember)) {
        $failures += "Forbidden member is present: $forbiddenMember"
    }
}

if ($failures.Count -gt 0) {
    throw "NXOpen API contract '$($contract.contractId)' failed:`n - $($failures -join "`n - ")"
}
Write-Host "NXOpen API contract passed: $($contract.contractId)"
Write-Host "  Adapter: $($contract.adapterId)"
Write-Host "  Required types: $(@($contract.requiredTypes).Count)"
Write-Host "  Required members: $(@($contract.requiredMembers).Count)"
