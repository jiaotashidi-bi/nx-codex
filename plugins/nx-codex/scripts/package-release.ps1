param(
    [string]$OutputRoot,
    [string]$NXOpenDir = "D:\Program Files\Siemens\NX 12.0\NXBIN\managed",
    [string]$BridgeAssemblyPath
)

$ErrorActionPreference = "Stop"
$pluginRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$release = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot "release.json") | ConvertFrom-Json
$releaseVersion = [string]$release.releaseVersion
$packageVersion = [string]$release.packageVersion
if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    $OutputRoot = Join-Path (Join-Path $pluginRoot "..\..") ("releases\nx-codex-" + $releaseVersion)
}
$OutputRoot = [IO.Path]::GetFullPath($OutputRoot)
if (Test-Path -LiteralPath $OutputRoot) {
    throw "Refusing to overwrite an existing release output: $OutputRoot"
}
if (-not (Test-Path -LiteralPath $NXOpenDir -PathType Container)) {
    throw "NXOpen directory does not exist: $NXOpenDir"
}

& (Join-Path $pluginRoot "scripts\verify-release-consistency.ps1") -PluginRoot $pluginRoot

$temporaryRoot = Join-Path ([IO.Path]::GetTempPath()) ("nx-codex-release-" + [Guid]::NewGuid().ToString("N"))
$mcpBuildRoot = Join-Path $temporaryRoot "mcp-build"
$bridgeBuildRoot = Join-Path $temporaryRoot "bridge-build"
$bridgeObjRoot = Join-Path $temporaryRoot "bridge-obj"
$stagingRoot = Join-Path $OutputRoot "plugin"
$fixedUtc = [DateTime]::new(2000, 1, 1, 0, 0, 0, [DateTimeKind]::Utc)

function Find-MsBuild {
    $candidates = @(
        (Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"),
        (Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe"),
        (Join-Path $env:WINDIR "Microsoft.NET\Framework\v4.0.30319\MSBuild.exe")
    )
    $vswhere = $candidates[0]
    if (Test-Path -LiteralPath $vswhere -PathType Leaf) {
        $install = & $vswhere -latest -products * -requires Microsoft.Component.MSBuild -property installationPath
        if ($install) {
            $candidate = Join-Path $install "MSBuild\Current\Bin\MSBuild.exe"
            if (Test-Path -LiteralPath $candidate -PathType Leaf) {
                return $candidate
            }
        }
    }
    foreach ($candidate in $candidates[1..2]) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            return $candidate
        }
    }
    throw "MSBuild.exe was not found."
}

function Write-Utf8NoBom {
    param([string]$Path, [string]$Text)
    [IO.File]::WriteAllText($Path, $Text, (New-Object Text.UTF8Encoding($false)))
}

function Copy-Directory {
    param([string]$Source, [string]$Destination)
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    Get-ChildItem -LiteralPath $Source -Force | Copy-Item -Destination $Destination -Recurse -Force
}

try {
    New-Item -ItemType Directory -Path $temporaryRoot -Force | Out-Null
    New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null
    New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null

    $node = (Get-Command node.exe -ErrorAction Stop).Source
    & $node (Join-Path $pluginRoot "mcp\build.mjs") $mcpBuildRoot
    if ($LASTEXITCODE -ne 0) {
        throw "MCP clean bundle failed with exit code $LASTEXITCODE"
    }

    if ([string]::IsNullOrWhiteSpace($BridgeAssemblyPath)) {
        $msbuild = Find-MsBuild
        $bridgeProject = Join-Path $pluginRoot "bridge\NXCodexBridge\NXCodexBridge.csproj"
        New-Item -ItemType Directory -Path $bridgeBuildRoot,$bridgeObjRoot -Force | Out-Null
        & $msbuild $bridgeProject `
            "/t:Rebuild" `
            "/p:Configuration=Release" `
            "/p:Platform=AnyCPU" `
            "/p:NXOpenDir=$NXOpenDir" `
            "/p:OutputPath=$bridgeBuildRoot\" `
            "/p:IntermediateOutputPath=$bridgeObjRoot\" `
            "/m"
        if ($LASTEXITCODE -ne 0) {
            throw "NX bridge clean bundle failed with exit code $LASTEXITCODE"
        }
        $BridgeAssemblyPath = Join-Path $bridgeBuildRoot "NXCodexBridge.dll"
    } else {
        $BridgeAssemblyPath = [IO.Path]::GetFullPath($BridgeAssemblyPath)
        if (-not (Test-Path -LiteralPath $BridgeAssemblyPath -PathType Leaf)) {
            throw "BridgeAssemblyPath does not exist: $BridgeAssemblyPath"
        }
    }

    Copy-Item -LiteralPath (Join-Path $pluginRoot ".codex-plugin") -Destination $stagingRoot -Recurse -Force
    Copy-Directory (Join-Path $pluginRoot "skills") (Join-Path $stagingRoot "skills")
    Copy-Directory (Join-Path $pluginRoot "schemas") (Join-Path $stagingRoot "schemas")
    Copy-Directory (Join-Path $mcpBuildRoot "mcp") (Join-Path $stagingRoot "mcp\dist\mcp")
    Copy-Directory (Join-Path $mcpBuildRoot "mock-bridge") (Join-Path $stagingRoot "mcp\dist\mock-bridge")
    Copy-Directory (Join-Path $pluginRoot "bridge\api-index") (Join-Path $stagingRoot "bridge\api-index")
    New-Item -ItemType Directory -Path (Join-Path $stagingRoot "bridge\NXCodexBridge\bin\Release") -Force | Out-Null
    Copy-Item -LiteralPath $BridgeAssemblyPath -Destination (Join-Path $stagingRoot "bridge\NXCodexBridge\bin\Release\NXCodexBridge.dll")
    Copy-Item -LiteralPath (Join-Path $pluginRoot "bridge\install.ps1") -Destination (Join-Path $stagingRoot "bridge\install.ps1")
    Copy-Directory (Join-Path $pluginRoot "scripts") (Join-Path $stagingRoot "scripts")
    Copy-Item -LiteralPath (Join-Path $pluginRoot "release.json") -Destination $stagingRoot
    $portableMcp = [ordered]@{
        mcpServers = [ordered]@{
            "nx-codex" = [ordered]@{
                command = "node"
                args = @("__NX_CODEX_PLUGIN_ROOT__\mcp\dist\mcp\index.mjs")
            }
        }
    }
    Write-Utf8NoBom (Join-Path $stagingRoot ".mcp.json") ($portableMcp | ConvertTo-Json -Depth 8)

    $pluginFiles = @(Get-ChildItem -LiteralPath $stagingRoot -Recurse -File | Where-Object { $_.Name -ne "package-manifest.json" } | Sort-Object FullName)
    $manifestEntries = @()
    foreach ($file in $pluginFiles) {
        $relative = $file.FullName.Substring($stagingRoot.Length).TrimStart('\').Replace('\','/')
        $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $file.FullName).Hash.ToLowerInvariant()
        $manifestEntries += [ordered]@{ path = $relative; size = $file.Length; sha256 = $hash }
        [IO.File]::SetCreationTimeUtc($file.FullName, $fixedUtc)
        [IO.File]::SetLastWriteTimeUtc($file.FullName, $fixedUtc)
        [IO.File]::SetLastAccessTimeUtc($file.FullName, $fixedUtc)
    }
    $manifest = [ordered]@{
        schemaVersion = "1.0"
        releaseVersion = $releaseVersion
        packageVersion = $packageVersion
        pluginName = [string]$release.pluginName
        generatedUtc = "2000-01-01T00:00:00Z"
        files = $manifestEntries
    }
    Write-Utf8NoBom (Join-Path $stagingRoot "package-manifest.json") ($manifest | ConvertTo-Json -Depth 8)
    [IO.File]::SetCreationTimeUtc((Join-Path $stagingRoot "package-manifest.json"), $fixedUtc)
    [IO.File]::SetLastWriteTimeUtc((Join-Path $stagingRoot "package-manifest.json"), $fixedUtc)
    [IO.File]::SetLastAccessTimeUtc((Join-Path $stagingRoot "package-manifest.json"), $fixedUtc)

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zipName = "nx-codex-$releaseVersion.zip"
    $zipPath = Join-Path $OutputRoot $zipName
    $zipStream = [IO.File]::Open($zipPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
    try {
        $archive = New-Object IO.Compression.ZipArchive($zipStream, ([IO.Compression.ZipArchiveMode]::Create), $false)
        try {
            $allFiles = @(Get-ChildItem -LiteralPath $stagingRoot -Recurse -File | Sort-Object FullName)
            foreach ($file in $allFiles) {
                $relative = $file.FullName.Substring($stagingRoot.Length).TrimStart('\').Replace('\','/')
                $entry = $archive.CreateEntry($relative, [IO.Compression.CompressionLevel]::Optimal)
                $entry.LastWriteTime = [DateTimeOffset]::new($fixedUtc)
                $input = [IO.File]::OpenRead($file.FullName)
                try {
                    $output = $entry.Open()
                    try { $input.CopyTo($output) } finally { $output.Dispose() }
                } finally { $input.Dispose() }
            }
        } finally { $archive.Dispose() }
    } finally { $zipStream.Dispose() }
    $zipHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath).Hash.ToLowerInvariant()
    Write-Utf8NoBom (Join-Path $OutputRoot ($zipName + ".sha256")) ("$zipHash *$zipName`n")
    Write-Utf8NoBom (Join-Path $OutputRoot "RELEASE-METADATA.json") (($release | ConvertTo-Json -Depth 8) + "`n")
    Write-Host "Created reproducible release package: $zipPath"
    Write-Host "SHA-256: $zipHash"
} finally {
    if (Test-Path -LiteralPath $temporaryRoot) {
        Remove-Item -LiteralPath $temporaryRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
