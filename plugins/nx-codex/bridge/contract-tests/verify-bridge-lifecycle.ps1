$ErrorActionPreference = "Stop"
$bridgeRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$frameworkRoot = Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319"
$compiler = Join-Path $frameworkRoot "csc.exe"
if (-not (Test-Path -LiteralPath $compiler -PathType Leaf)) {
    throw "The .NET Framework C# compiler was not found: $compiler"
}

$tempDirectory = Join-Path (
    [IO.Path]::GetTempPath()
) ("nx-codex-bridge-lifecycle-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDirectory | Out-Null
try {
    $output = Join-Path $tempDirectory "BridgeLifecycleContractTests.exe"
    $sources = @(
        (Join-Path $bridgeRoot "NXCodexBridge\BridgeProtocol.cs"),
        (Join-Path $bridgeRoot "NXCodexBridge\JsonCodec.cs"),
        (Join-Path $bridgeRoot "NXCodexBridge\SessionDescriptorStore.cs"),
        (Join-Path $bridgeRoot "NXCodexBridge\SessionDiscoveryPipeServer.cs"),
        (Join-Path $PSScriptRoot "BridgeLifecycleContractTests.cs")
    )
    & $compiler `
        /nologo `
        /target:exe `
        "/out:$output" `
        /reference:System.Runtime.Serialization.dll `
        /reference:System.Web.Extensions.dll `
        @sources
    if ($LASTEXITCODE -ne 0) {
        throw "Bridge lifecycle contract compilation failed with exit code $LASTEXITCODE"
    }

    & $output
    if ($LASTEXITCODE -ne 0) {
        throw "Bridge lifecycle contract failed with exit code $LASTEXITCODE"
    }
}
finally {
    if (Test-Path -LiteralPath $tempDirectory) {
        Remove-Item -LiteralPath $tempDirectory -Recurse -Force
    }
}
