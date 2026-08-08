param(
    [string]$PluginRoot = (Join-Path $PSScriptRoot "..")
)

$ErrorActionPreference = "Stop"
$resolvedPluginRoot = (Resolve-Path -LiteralPath $PluginRoot).Path
$entryPoint = Join-Path $resolvedPluginRoot "mcp\dist\mcp\index.mjs"
$configPath = Join-Path $resolvedPluginRoot ".mcp.json"

if (-not (Test-Path -LiteralPath $entryPoint -PathType Leaf)) {
    throw "Bundled MCP entry point does not exist: $entryPoint"
}

$payload = [ordered]@{
    mcpServers = [ordered]@{
        "nx-codex" = [ordered]@{
            command = "node"
            args = @($entryPoint)
        }
    }
}

$json = $payload | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText(
    $configPath,
    $json + [Environment]::NewLine,
    (New-Object Text.UTF8Encoding($false))
)

Write-Host "Configured MCP entry point: $entryPoint"
