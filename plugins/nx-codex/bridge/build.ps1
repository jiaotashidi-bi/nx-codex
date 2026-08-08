param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Container })]
    [string]$NXOpenDir,

    [string]$MSBuildPath,

    [string]$OutputPath,

    [string]$IntermediateOutputPath,

    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Release"
)

$ErrorActionPreference = "Stop"
$project = Join-Path $PSScriptRoot "NXCodexBridge\NXCodexBridge.csproj"
$nxOpenDll = Join-Path $NXOpenDir "NXOpen.dll"
$nxOpenUfDll = Join-Path $NXOpenDir "NXOpen.UF.dll"
$nxOpenUtilitiesDll = Join-Path $NXOpenDir "NXOpen.Utilities.dll"

if (-not (Test-Path -LiteralPath $nxOpenDll -PathType Leaf)) {
    throw "NXOpen.dll was not found in $NXOpenDir"
}
if (-not (Test-Path -LiteralPath $nxOpenUfDll -PathType Leaf)) {
    throw "NXOpen.UF.dll was not found in $NXOpenDir"
}
if (-not (Test-Path -LiteralPath $nxOpenUtilitiesDll -PathType Leaf)) {
    throw "NXOpen.Utilities.dll was not found in $NXOpenDir"
}

if ([string]::IsNullOrWhiteSpace($MSBuildPath)) {
    $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (Test-Path -LiteralPath $vswhere -PathType Leaf) {
        $install = & $vswhere -latest -products * -requires Microsoft.Component.MSBuild -property installationPath
        if ($install) {
            $candidate = Join-Path $install "MSBuild\Current\Bin\MSBuild.exe"
            if (Test-Path -LiteralPath $candidate -PathType Leaf) {
                $MSBuildPath = $candidate
            }
        }
    }
}

if ([string]::IsNullOrWhiteSpace($MSBuildPath)) {
    $command = Get-Command MSBuild.exe -ErrorAction SilentlyContinue
    if ($command) {
        $MSBuildPath = $command.Source
    }
}

if ([string]::IsNullOrWhiteSpace($MSBuildPath)) {
    $frameworkCandidates = @(
        (Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe"),
        (Join-Path $env:WINDIR "Microsoft.NET\Framework\v4.0.30319\MSBuild.exe")
    )
    foreach ($candidate in $frameworkCandidates) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            $MSBuildPath = $candidate
            break
        }
    }
}

if ([string]::IsNullOrWhiteSpace($MSBuildPath) -or
    -not (Test-Path -LiteralPath $MSBuildPath -PathType Leaf)) {
    throw "MSBuild.exe was not found. Install a .NET Framework 4.x SDK or Visual Studio Build Tools."
}

$buildArguments = @(
    $project,
    "/t:Rebuild",
    "/p:Configuration=$Configuration",
    "/p:Platform=AnyCPU",
    "/p:NXOpenDir=$NXOpenDir",
    "/m"
)

if (-not [string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = [IO.Path]::GetFullPath($OutputPath)
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    $buildArguments += "/p:OutputPath=$OutputPath\"
}
if (-not [string]::IsNullOrWhiteSpace($IntermediateOutputPath)) {
    $IntermediateOutputPath = [IO.Path]::GetFullPath($IntermediateOutputPath)
    New-Item -ItemType Directory -Path $IntermediateOutputPath -Force | Out-Null
    $buildArguments += "/p:IntermediateOutputPath=$IntermediateOutputPath\"
}

$referenceAssemblies = "${env:ProgramFiles(x86)}\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.0"
$frameworkPath = Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319"
if (-not (Test-Path -LiteralPath $referenceAssemblies -PathType Container) -and
    (Test-Path -LiteralPath $frameworkPath -PathType Container)) {
    $buildArguments += "/p:FrameworkPathOverride=$frameworkPath"
}

& $MSBuildPath @buildArguments

if ($LASTEXITCODE -ne 0) {
    throw "NX bridge build failed with exit code $LASTEXITCODE"
}

$outputDirectory = if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    Join-Path $PSScriptRoot "NXCodexBridge\bin\$Configuration"
} else {
    $OutputPath
}
$output = Join-Path $outputDirectory "NXCodexBridge.dll"
Write-Host "Built: $output"
