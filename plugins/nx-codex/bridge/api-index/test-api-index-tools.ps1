param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$IndexPath,

    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$ContractPath,

    [string]$NXOpenDir
)

$ErrorActionPreference = "Stop"
$scriptRoot = $PSScriptRoot
& (Join-Path $scriptRoot "validate-api-contract.ps1") `
    -IndexPath $IndexPath `
    -ContractPath $ContractPath

$query = & (Join-Path $scriptRoot "query-nxopen-api-index.ps1") `
    -IndexPath $IndexPath `
    -TypePattern "NXOpen.UF.UFModl" `
    -MemberPattern "CreateBlend" `
    -Kind method
if (@($query).Count -ne 1 -or
    $query[0].key -notlike "method|NXOpen.UF.UFModl|CreateBlend(*") {
    throw "API index query did not return the exact CreateBlend member."
}

$temporaryDirectory = Join-Path (
    [IO.Path]::GetTempPath()) (
    "nx-codex-contract-test-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $temporaryDirectory | Out-Null
$invalidContractPath = Join-Path $temporaryDirectory "invalid-contract.json"
try {
    $invalidContract = Get-Content -Raw -LiteralPath $ContractPath |
        ConvertFrom-Json
    $invalidContract.requiredMembers +=
        "method|NXOpen.DoesNotExist|Missing()->System.Void"
    [IO.File]::WriteAllText(
        $invalidContractPath,
        ($invalidContract | ConvertTo-Json -Depth 8),
        (New-Object Text.UTF8Encoding($false)))
    $rejected = $false
    try {
        & (Join-Path $scriptRoot "validate-api-contract.ps1") `
            -IndexPath $IndexPath `
            -ContractPath $invalidContractPath
    } catch {
        $rejected = $_.Exception.Message -like "*Missing member:*"
    }
    if (-not $rejected) {
        throw "The strict validator accepted a missing API member."
    }
    if (-not [string]::IsNullOrWhiteSpace($NXOpenDir)) {
        if (-not (Test-Path -LiteralPath $NXOpenDir -PathType Container)) {
            throw "NXOpenDir does not exist: $NXOpenDir"
        }
        $regeneratedIndexPath = Join-Path $temporaryDirectory "regenerated.json"
        & (Join-Path $scriptRoot "generate-nxopen-api-index.ps1") `
            -NXOpenDir $NXOpenDir `
            -OutputPath $regeneratedIndexPath
        $expectedHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $IndexPath).Hash
        $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $regeneratedIndexPath).Hash
        if ($actualHash -ne $expectedHash) {
            throw "API index generation is not deterministic: expected $expectedHash, actual $actualHash."
        }
    }
} finally {
    $resolvedTemporary = [IO.Path]::GetFullPath($temporaryDirectory)
    $resolvedSystemTemporary = [IO.Path]::GetFullPath(
        [IO.Path]::GetTempPath())
    if (-not $resolvedTemporary.StartsWith(
        $resolvedSystemTemporary,
        [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove a temporary directory outside the system temp root."
    }
    Remove-Item -LiteralPath $resolvedTemporary -Recurse -Force
}

Write-Host "NXOpen API index tooling passed strict positive, negative, query, and deterministic-generation tests."
