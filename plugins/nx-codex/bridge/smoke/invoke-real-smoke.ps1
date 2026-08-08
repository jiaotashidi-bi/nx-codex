param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Container })]
    [string]$NXBin,

    [string]$BridgeDll,

    [switch]$ConnectivityOnly,

    [switch]$ModuleCapabilitiesOnly,

    [switch]$FileLifecycle,

    [string]$FileRoot,

    [ValidateRange(15, 180)]
    [int]$TimeoutSeconds = 60
)

$ErrorActionPreference = "Stop"

if ($FileLifecycle) {
    if ([string]::IsNullOrWhiteSpace($FileRoot) -or
        -not (Test-Path -LiteralPath $FileRoot -PathType Container)) {
        throw "FileLifecycle requires an explicit existing FileRoot."
    }
    $FileRoot = (Resolve-Path -LiteralPath $FileRoot).Path
}

if ([string]::IsNullOrWhiteSpace($BridgeDll)) {
    $BridgeDll = Join-Path $PSScriptRoot "..\NXCodexBridge\bin\Release\NXCodexBridge.dll"
}

function Quote-ProcessArgument([string]$Value) {
    if ($Value.Contains('"')) {
        throw "A process argument contains an unsupported quote character."
    }
    return '"' + $Value + '"'
}

function Invoke-BridgeRequest(
    [object]$Descriptor,
    [string]$Operation,
    [hashtable]$OperationArguments
) {
    $client = New-Object System.IO.Pipes.NamedPipeClientStream(
        ".",
        [string]$Descriptor.pipeName,
        [System.IO.Pipes.PipeDirection]::InOut,
        [System.IO.Pipes.PipeOptions]::None
    )
    try {
        $client.Connect(5000)
        $utf8 = New-Object System.Text.UTF8Encoding($false)
        $writer = New-Object System.IO.StreamWriter($client, $utf8, 4096, $true)
        $reader = New-Object System.IO.StreamReader($client, $utf8, $false, 4096, $true)
        try {
            $request = @{
                protocolVersion = "1.0"
                requestId = [Guid]::NewGuid().ToString()
                operation = $Operation
                token = [string]$Descriptor.token
                deadlineUtc = [DateTimeOffset]::UtcNow.AddSeconds(15).ToString("o")
                arguments = $OperationArguments
            }
            $writer.WriteLine(($request | ConvertTo-Json -Depth 6 -Compress))
            $writer.Flush()
            $line = $reader.ReadLine()
            if ([string]::IsNullOrWhiteSpace($line)) {
                throw "NX bridge closed the pipe without a response for $Operation."
            }
            $response = $line | ConvertFrom-Json
            if (-not $response.ok) {
                throw "$Operation failed: $($response.error.code): $($response.error.message)"
            }
            return $response.result
        }
        finally {
            try {
                $reader.Dispose()
            }
            catch {
            }
            try {
                $writer.Dispose()
            }
            catch {
            }
        }
    }
    finally {
        try {
            $client.Dispose()
        }
        catch {
        }
    }
}

function Get-BridgeDescriptorFromDiscoveryPipe([int]$ProcessId) {
    $pipeName = "nx-codex-discovery-$ProcessId"
    $client = New-Object System.IO.Pipes.NamedPipeClientStream(
        ".",
        $pipeName,
        [System.IO.Pipes.PipeDirection]::InOut,
        [System.IO.Pipes.PipeOptions]::None
    )
    try {
        $client.Connect(5000)
        $utf8 = New-Object System.Text.UTF8Encoding($false)
        $writer = New-Object System.IO.StreamWriter($client, $utf8, 4096, $true)
        $reader = New-Object System.IO.StreamReader($client, $utf8, $false, 4096, $true)
        try {
            $writer.WriteLine("NX_CODEX_DISCOVER 1")
            $writer.Flush()
            $line = $reader.ReadLine()
            if ([string]::IsNullOrWhiteSpace($line)) {
                throw "NX session discovery pipe returned no descriptor."
            }
            $descriptor = $line | ConvertFrom-Json
            if ([int]$descriptor.processId -ne $ProcessId) {
                throw "NX session discovery returned a mismatched process ID."
            }
            return $descriptor
        }
        finally {
            try {
                $reader.Dispose()
            }
            catch {
            }
            try {
                $writer.Dispose()
            }
            catch {
            }
        }
    }
    finally {
        try {
            $client.Dispose()
        }
        catch {
        }
    }
}

$runJournal = Join-Path $NXBin "run_journal.exe"
$journal = Join-Path $PSScriptRoot "NXBridgeHostJournal.cs"
$resolvedBridgeDll = (Resolve-Path -LiteralPath $BridgeDll).Path
$resolvedJournal = (Resolve-Path -LiteralPath $journal).Path
if (-not (Test-Path -LiteralPath $runJournal -PathType Leaf)) {
    throw "run_journal.exe was not found in $NXBin"
}

$runId = [Guid]::NewGuid().ToString("N")
$artifactDirectory = Join-Path $env:TEMP "nx-codex-real-smoke-$runId"
$null = New-Item -ItemType Directory -Path $artifactDirectory
$stopFile = Join-Path $artifactDirectory "stop.signal"
$statusFile = Join-Path $artifactDirectory "journal.status.txt"
$stdoutFile = Join-Path $artifactDirectory "run-journal.stdout.txt"
$stderrFile = Join-Path $artifactDirectory "run-journal.stderr.txt"
$sessionDirectory = Join-Path $env:LOCALAPPDATA "NXCodex\sessions"
$knownDescriptors = @{}
if (Test-Path -LiteralPath $sessionDirectory -PathType Container) {
    Get-ChildItem -LiteralPath $sessionDirectory -File | ForEach-Object {
        $knownDescriptors[$_.FullName] = $true
    }
}

$argumentLine = @(
    (Quote-ProcessArgument $resolvedJournal),
    "-args",
    (Quote-ProcessArgument $resolvedBridgeDll),
    (Quote-ProcessArgument $stopFile),
    (Quote-ProcessArgument $statusFile),
    (Quote-ProcessArgument $(if ($ModuleCapabilitiesOnly) { "ReadOnly" } else { "CreatePart" }))
) -join " "

$process = Start-Process `
    -FilePath $runJournal `
    -ArgumentList $argumentLine `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutFile `
    -RedirectStandardError $stderrFile `
    -PassThru

try {
    $descriptorPath = $null
    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    while ([DateTime]::UtcNow -lt $deadline) {
        $process.Refresh()
        if ($process.HasExited) {
            $stderr = Get-Content -LiteralPath $stderrFile -Raw -ErrorAction SilentlyContinue
            $status = Get-Content -LiteralPath $statusFile -Raw -ErrorAction SilentlyContinue
            throw "NX journal exited before publishing a bridge session. Status: $status Error: $stderr"
        }
        if (Test-Path -LiteralPath $statusFile -PathType Leaf) {
            $status = Get-Content -LiteralPath $statusFile -Raw
            if ($status.StartsWith("error")) {
                throw "NX host journal failed: $status"
            }
        }
        if (Test-Path -LiteralPath $sessionDirectory -PathType Container) {
            $candidate = Get-ChildItem -LiteralPath $sessionDirectory -File |
                Where-Object { -not $knownDescriptors.ContainsKey($_.FullName) } |
                Sort-Object LastWriteTimeUtc -Descending |
                Select-Object -First 1
            if ($candidate) {
                $descriptorPath = $candidate.FullName
                break
            }
        }
        Start-Sleep -Milliseconds 200
    }
    if ([string]::IsNullOrWhiteSpace($descriptorPath)) {
        throw "Timed out waiting for the NX bridge session descriptor."
    }

    $descriptorProcessId = [int][IO.Path]::GetFileNameWithoutExtension($descriptorPath)
    $descriptor = Get-BridgeDescriptorFromDiscoveryPipe $descriptorProcessId
    $health = Invoke-BridgeRequest $descriptor "health" @{}
    $capabilities = Invoke-BridgeRequest $descriptor "get_capabilities" @{}
    $before = Invoke-BridgeRequest $descriptor "get_session_state" @{}
    if ($ModuleCapabilitiesOnly) {
        $assembly = Invoke-BridgeRequest $descriptor "get_assembly_capability" @{}
        $drafting = Invoke-BridgeRequest $descriptor "get_drafting_capability" @{}
        $cae = Invoke-BridgeRequest $descriptor "get_cae_capability" @{}
        $cam = Invoke-BridgeRequest $descriptor "get_cam_capability" @{}
        [pscustomobject]@{
            artifactDirectory = $artifactDirectory
            status = "module_capabilities_readonly_passed"
            nxVersion = $health.nxVersion
            nxOpenAssemblyVersion = $health.nxOpenAssemblyVersion
            bridgeVersion = $health.bridgeVersion
            dispatcher = $health.dispatcher
            workPart = $before.workPart
            assembly = [pscustomobject]@{
                available = $assembly.available
                licensed = $assembly.licensed
                adapterId = $assembly.adapterId
                unsupportedReason = $assembly.unsupportedReason
            }
            drafting = [pscustomobject]@{
                available = $drafting.available
                licensed = $drafting.licensed
                adapterId = $drafting.adapterId
                unsupportedReason = $drafting.unsupportedReason
            }
            cae = [pscustomobject]@{
                available = $cae.available
                licensed = $cae.licensed
                adapterId = $cae.adapterId
                unsupportedReason = $cae.unsupportedReason
            }
            cam = [pscustomobject]@{
                available = $cam.available
                licensed = $cam.licensed
                adapterId = $cam.adapterId
                unsupportedReason = $cam.unsupportedReason
            }
        } | ConvertTo-Json -Depth 5
    }
    elseif ($ConnectivityOnly) {
        [pscustomobject]@{
            artifactDirectory = $artifactDirectory
            status = "connectivity_passed"
            nxVersion = $health.nxVersion
            bridgeVersion = $health.bridgeVersion
            dispatcher = $health.dispatcher
            capabilities = $capabilities.capabilities
            workPart = $before.workPart
            units = $before.units
            featureCount = $before.featureCount
            bodyCount = $before.bodyCount
        } | ConvertTo-Json -Depth 4
    }
    elseif ($FileLifecycle) {
        $stamp = [DateTime]::UtcNow.ToString("yyyyMMddHHmmss")
        $baselinePath = Join-Path $FileRoot "nx-codex-real-baseline-$stamp.prt"
        $modeledPath = Join-Path $FileRoot "nx-codex-real-block-$stamp.prt"

        $baseline = Invoke-BridgeRequest $descriptor "save_as" @{
            filePath = $baselinePath
        }
        if (-not (Test-Path -LiteralPath $baselinePath -PathType Leaf)) {
            throw "The baseline part was not written: $baselinePath"
        }

        $newPart = Invoke-BridgeRequest $descriptor "new_part" @{
            filePath = $modeledPath
            partUnits = "Millimeters"
        }
        $created = $null
        $modelingLicenseUnavailable = $false
        try {
            $created = Invoke-BridgeRequest $descriptor "create_block" @{
                length = 80.0
                width = 50.0
                height = 12.0
                originX = -40.0
                originY = -25.0
                originZ = 0.0
                name = "NX_CODEX_REAL_PHASE2_BLOCK"
            }
        }
        catch {
            if ($_.Exception.Message.Contains("-10005")) {
                $modelingLicenseUnavailable = $true
            }
            else {
                throw
            }
        }
        $saved = Invoke-BridgeRequest $descriptor "save_as" @{
            filePath = $modeledPath
        }
        if (-not (Test-Path -LiteralPath $modeledPath -PathType Leaf)) {
            throw "The modeled part was not written: $modeledPath"
        }

        $overwriteRejected = $false
        try {
            $null = Invoke-BridgeRequest $descriptor "save_as" @{
                filePath = $modeledPath
            }
        }
        catch {
            $overwriteRejected = $_.Exception.Message.Contains("TARGET_EXISTS")
        }
        if (-not $overwriteRejected) {
            throw "The bridge did not reject an existing save-as target."
        }

        $closed = Invoke-BridgeRequest $descriptor "close_part" @{}
        $reopened = Invoke-BridgeRequest $descriptor "open_part" @{
            filePath = $modeledPath
        }
        $afterReopen = Invoke-BridgeRequest $descriptor "get_session_state" @{}
        if (-not $modelingLicenseUnavailable -and
            [int]$afterReopen.bodyCount -lt 1) {
            throw "The reopened part did not contain the modeled body."
        }
        if ([bool]$afterReopen.modified) {
            throw "The reopened part unexpectedly reports unsaved changes."
        }

        [pscustomobject]@{
            artifactDirectory = $artifactDirectory
            status = "file_lifecycle_passed"
            nxVersion = $health.nxVersion
            bridgeVersion = $health.bridgeVersion
            dispatcher = $health.dispatcher
            capabilities = $capabilities.capabilities
            allowedRoots = $capabilities.allowedRoots
            baselinePath = $baseline.filePath
            modeledPath = $saved.filePath
            newPartOpened = $newPart.opened
            saveVerified = $saved.saved
            overwriteRejected = $overwriteRejected
            closeVerified = $closed.closed
            reopenVerified = $reopened.opened
            featureCount = $afterReopen.featureCount
            bodyCount = $afterReopen.bodyCount
            modified = $afterReopen.modified
            modelingLicenseUnavailable = $modelingLicenseUnavailable
            transactionIdInvalidated = if ($null -eq $created) {
                $null
            } else {
                $created.transactionId
            }
        } | ConvertTo-Json -Depth 5
    }
    else {
        $created = Invoke-BridgeRequest $descriptor "create_block" @{
            length = 100.0
            width = 60.0
            height = 20.0
            originX = 0.0
            originY = 0.0
            originZ = 0.0
            name = "NX_CODEX_REAL_SMOKE_BLOCK"
        }
        $afterCreate = Invoke-BridgeRequest $descriptor "get_session_state" @{}
        $undone = Invoke-BridgeRequest $descriptor "undo_transaction" @{
            transactionId = [string]$created.transactionId
        }
        $afterUndo = Invoke-BridgeRequest $descriptor "get_session_state" @{}

        [pscustomobject]@{
            artifactDirectory = $artifactDirectory
            status = "modeling_and_undo_passed"
            nxVersion = $health.nxVersion
            bridgeVersion = $health.bridgeVersion
            dispatcher = $health.dispatcher
            capabilities = $capabilities.capabilities
            transactionId = $created.transactionId
            featureName = $created.featureName
            beforeFeatureCount = $before.featureCount
            afterCreateFeatureCount = $afterCreate.featureCount
            afterUndoFeatureCount = $afterUndo.featureCount
            beforeBodyCount = $before.bodyCount
            afterCreateBodyCount = $afterCreate.bodyCount
            afterUndoBodyCount = $afterUndo.bodyCount
            undoStatus = $undone.status
        } | ConvertTo-Json -Depth 4
    }
}
finally {
    $null = New-Item -ItemType File -Path $stopFile -Force
    if (-not $process.WaitForExit(15000)) {
        Stop-Process -Id $process.Id -Force
    }
}
