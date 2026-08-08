param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Container })]
    [string]$NXOpenDir
)

$ErrorActionPreference = "Stop"

foreach ($fileName in @("NXOpen.dll", "NXOpen.UF.dll", "NXOpen.Utilities.dll")) {
    $path = Join-Path $NXOpenDir $fileName
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Missing NXOpen assembly: $fileName"
    }
    $assembly = [Reflection.Assembly]::LoadFrom($path)
    if ($assembly.GetName().Version.ToString() -ne "12.0.2.9") {
        throw "The CAE read-only contract requires NXOpen version 12.0.2.9, actual $($assembly.GetName().Version)."
    }
}

$nxOpen = [Reflection.Assembly]::LoadFrom((Join-Path $NXOpenDir "NXOpen.dll"))
$session = $nxOpen.GetType("NXOpen.Session", $true)
$licenseManager = $nxOpen.GetType("NXOpen.LicenseManager", $true)
if ($null -eq $session -or $null -eq $licenseManager) {
    throw "The CAE read-only contract requires NXOpen.Session and NXOpen.LicenseManager."
}

function Find-ExactMethod {
    param(
        [Type]$Type,
        [string]$Name,
        [Type[]]$ParameterTypes
    )

    foreach ($method in $Type.GetMethods()) {
        if ($method.Name -ne $Name) {
            continue
        }
        $parameters = @($method.GetParameters())
        if ($parameters.Count -ne $ParameterTypes.Count) {
            continue
        }
        $matches = $true
        for ($index = 0; $index -lt $parameters.Count; $index++) {
            if ($parameters[$index].ParameterType -ne $ParameterTypes[$index]) {
                $matches = $false
                break
            }
        }
        if ($matches) {
            return $method
        }
    }
    return $null
}

$applicationName = $session.GetProperty("ApplicationName")
if ($null -eq $applicationName -or $applicationName.PropertyType -ne [string]) {
    throw "NXOpen.Session.ApplicationName must be an exact System.String property."
}

$bundlesUsed = Find-ExactMethod $licenseManager "GetBundlesUsed" @()
if ($null -eq $bundlesUsed -or $bundlesUsed.ReturnType -ne [string[]]) {
    throw "NXOpen.LicenseManager.GetBundlesUsed must return System.String[]."
}

$activeLicenses = Find-ExactMethod $licenseManager "GetActiveLicensesInABundle" @([string])
if ($null -eq $activeLicenses -or $activeLicenses.ReturnType -ne [string[]]) {
    throw "NXOpen.LicenseManager.GetActiveLicensesInABundle must return System.String[]."
}

$executorPath = Join-Path $PSScriptRoot "..\NXCodexBridge\NxOperationExecutor.cs"
$executorSource = Get-Content -Raw -LiteralPath $executorPath
$caeMethod = [regex]::Match(
    $executorSource,
    '(?s)private BridgeResult GetCaeCapability\(\).*?(?=\r?\n\s*private BridgeResult GetAssemblyStructure)'
)
if (-not $caeMethod.Success) {
    throw "The typed GetCaeCapability method was not found."
}
foreach ($forbidden in @(
    "SwitchApplication", "Reserve", "Release", "CreateFem", "CreateSim",
    "CreateMesh", "Solve", "SaveAs", "Save"
)) {
    if ($caeMethod.Value -cmatch $forbidden) {
        throw "The typed CAE capability method contains forbidden mutation/probe API text: $forbidden"
    }
}

Write-Host "NXOpen CAE read-only reflection contract passed:"
Write-Host "  NXOpen version 12.0.2.9"
Write-Host "  Session.ApplicationName + LicenseManager active-license inventory only"
