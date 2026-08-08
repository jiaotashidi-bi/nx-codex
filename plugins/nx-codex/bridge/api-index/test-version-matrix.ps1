param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$MatrixPath
)

$ErrorActionPreference = "Stop"
$matrixFullPath = (Resolve-Path -LiteralPath $MatrixPath).Path
$matrixDirectory = [IO.Path]::GetDirectoryName($matrixFullPath)
$matrix = Get-Content -Raw -LiteralPath $matrixFullPath | ConvertFrom-Json
if ($matrix.schemaVersion -ne "1.0") {
    throw "Unsupported version-matrix schemaVersion: $($matrix.schemaVersion)"
}
$rootProperties = @($matrix.PSObject.Properties.Name | Sort-Object)
if (($rootProperties -join "|") -ne "entries|schemaVersion") {
    throw "Version matrix contains unknown or missing root properties."
}

$temporaryRoot = Join-Path (
    [IO.Path]::GetTempPath()) (
    "nx-codex-version-matrix-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $temporaryRoot | Out-Null
$results = @()
try {
    foreach ($entry in $matrix.entries) {
        $allowedProperties = @(
            "id", "required", "nxOpenDir", "nxOpenDirEnv",
            "expectedAssemblyVersion", "adapterExpectation", "contractPath",
            "verificationStatus", "evidence"
        )
        $unknown = @($entry.PSObject.Properties.Name | Where-Object {
            $allowedProperties -notcontains $_
        })
        if ($unknown.Count -gt 0) {
            throw "Matrix entry '$($entry.id)' contains unknown fields: $($unknown -join ', ')"
        }
        if ([string]::IsNullOrWhiteSpace($entry.id) -or
            @("verified", "unsupported") -notcontains
                $entry.adapterExpectation -or
            @("verified", "unverified") -notcontains
                $entry.verificationStatus) {
            throw "Matrix entry has an invalid id or adapterExpectation."
        }
        $evidenceProperties = @(
            $entry.evidence.PSObject.Properties.Name | Sort-Object
        )
        $expectedEvidenceProperties = @(
            "apiIndex", "liveReadOnlyHandshake", "requiredApiContract",
            "strictFakeProtocol", "typedRuntimeAdapter", "versionSpecificSmoke"
        )
        if (($evidenceProperties -join "|") -ne
            (($expectedEvidenceProperties | Sort-Object) -join "|")) {
            throw "Matrix entry '$($entry.id)' has an invalid evidence property set."
        }
        if ($entry.verificationStatus -eq "verified") {
            if ($entry.adapterExpectation -ne "verified" -or
                @($entry.evidence.PSObject.Properties | Where-Object {
                    -not [bool]$_.Value
                }).Count -gt 0) {
                throw "Verified matrix entry '$($entry.id)' is missing required evidence."
            }
        } else {
            if ($entry.adapterExpectation -ne "unsupported" -or
                [bool]$entry.evidence.requiredApiContract -or
                [bool]$entry.evidence.typedRuntimeAdapter -or
                [bool]$entry.evidence.liveReadOnlyHandshake -or
                [bool]$entry.evidence.versionSpecificSmoke -or
                -not [string]::IsNullOrWhiteSpace($entry.contractPath)) {
                throw "Unverified matrix entry '$($entry.id)' must remain unsupported and cannot claim contract or smoke evidence."
            }
        }

        $nxOpenDir = $entry.nxOpenDir
        if ([string]::IsNullOrWhiteSpace($nxOpenDir) -and
            -not [string]::IsNullOrWhiteSpace($entry.nxOpenDirEnv)) {
            $nxOpenDir = [Environment]::GetEnvironmentVariable(
                $entry.nxOpenDirEnv)
        }
        if ([string]::IsNullOrWhiteSpace($nxOpenDir) -or
            -not (Test-Path -LiteralPath $nxOpenDir -PathType Container)) {
            if ([bool]$entry.required) {
                throw "Required matrix entry '$($entry.id)' has no available NXOpen directory."
            }
            $results += [PSCustomObject]@{
                id = $entry.id
                status = $entry.verificationStatus
                assemblyVersion = $null
                adapterExpectation = $entry.adapterExpectation
                detail = "No real-installation evidence. Set $($entry.nxOpenDirEnv) only to collect an API index; runtime remains unsupported/unverified."
            }
            continue
        }

        $entryOutput = Join-Path $temporaryRoot "$($entry.id).json"
        $generator = Join-Path $matrixDirectory "generate-nxopen-api-index.ps1"
        & $generator -NXOpenDir $nxOpenDir -OutputPath $entryOutput
        $index = Get-Content -Raw -LiteralPath $entryOutput | ConvertFrom-Json
        $nxOpenAssembly = @($index.assemblies | Where-Object name -eq "NXOpen")
        if ($nxOpenAssembly.Count -ne 1) {
            throw "Matrix entry '$($entry.id)' did not produce one NXOpen assembly record."
        }
        $actualVersion = $nxOpenAssembly[0].assemblyVersion
        if (-not [string]::IsNullOrWhiteSpace(
                $entry.expectedAssemblyVersion) -and
            $actualVersion -ne $entry.expectedAssemblyVersion) {
            throw "Matrix entry '$($entry.id)' expected assembly version $($entry.expectedAssemblyVersion), actual $actualVersion."
        }

        if ($entry.adapterExpectation -eq "verified") {
            if ([string]::IsNullOrWhiteSpace($entry.contractPath)) {
                throw "Verified matrix entry '$($entry.id)' requires contractPath."
            }
            $contractPath = [IO.Path]::GetFullPath(
                (Join-Path $matrixDirectory $entry.contractPath))
            & (Join-Path $matrixDirectory "validate-api-contract.ps1") `
                -IndexPath $entryOutput `
                -ContractPath $contractPath
        } elseif (-not [string]::IsNullOrWhiteSpace($entry.contractPath)) {
            throw "Unsupported matrix entry '$($entry.id)' must not claim a verified contract."
        }

        $results += [PSCustomObject]@{
            id = $entry.id
            status = $entry.verificationStatus
            assemblyVersion = $actualVersion
            adapterExpectation = $entry.adapterExpectation
            detail = if ($entry.adapterExpectation -eq "verified") {
                "Strict API contract passed."
            } else {
                "Indexed only; runtime remains unsupported/unverified until a contract, adapter, and version-specific smoke pass are added."
            }
        }
    }
} finally {
    $resolvedTemporary = [IO.Path]::GetFullPath($temporaryRoot)
    $resolvedSystemTemporary = [IO.Path]::GetFullPath(
        [IO.Path]::GetTempPath())
    if (-not $resolvedTemporary.StartsWith(
        $resolvedSystemTemporary,
        [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove a matrix directory outside the system temp root."
    }
    Remove-Item -LiteralPath $resolvedTemporary -Recurse -Force
}

$results | Format-Table id, status, assemblyVersion, adapterExpectation, detail -AutoSize
if (@($results | Where-Object status -eq "verified").Count -eq 0) {
    throw "The version matrix did not execute any real installation lane."
}
Write-Host "NXOpen real-installation version matrix passed."
