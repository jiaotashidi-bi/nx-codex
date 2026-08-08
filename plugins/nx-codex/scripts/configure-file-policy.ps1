param(
    [Parameter(Mandatory = $true)]
    [string[]]$AllowedRoot
)

$ErrorActionPreference = "Stop"

if ($AllowedRoot.Count -lt 1 -or $AllowedRoot.Count -gt 8) {
    throw "Specify between one and eight allowed roots."
}

$resolvedRoots = @()
foreach ($root in $AllowedRoot) {
    if (-not [IO.Path]::IsPathRooted($root) -or $root.StartsWith("\\")) {
        throw "Allowed roots must be absolute local-drive paths: $root"
    }

    if (-not (Test-Path -LiteralPath $root -PathType Container)) {
        New-Item -ItemType Directory -Path $root -Force | Out-Null
    }

    $resolved = [IO.Path]::GetFullPath((Resolve-Path -LiteralPath $root).Path)
    $attributes = [IO.File]::GetAttributes($resolved)
    if (($attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
        throw "Allowed roots cannot be symbolic links or junctions: $resolved"
    }
    $resolvedRoots += $resolved.TrimEnd('\')
}

$policyDirectory = Join-Path $env:LOCALAPPDATA "NXCodex"
$policyFile = Join-Path $policyDirectory "policy.json"
New-Item -ItemType Directory -Path $policyDirectory -Force | Out-Null

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$userSid = $identity.User
$directorySecurity = New-Object Security.AccessControl.DirectorySecurity
$directorySecurity.SetOwner($userSid)
$directorySecurity.SetAccessRuleProtection($true, $false)
$directoryRule = New-Object Security.AccessControl.FileSystemAccessRule(
    $userSid,
    [Security.AccessControl.FileSystemRights]::FullControl,
    [Security.AccessControl.InheritanceFlags]"ContainerInherit, ObjectInherit",
    [Security.AccessControl.PropagationFlags]::None,
    [Security.AccessControl.AccessControlType]::Allow
)
$directorySecurity.AddAccessRule($directoryRule)
Set-Acl -LiteralPath $policyDirectory -AclObject $directorySecurity

$policy = [ordered]@{
    version = 1
    allowedRoots = @($resolvedRoots | Select-Object -Unique)
}
$json = $policy | ConvertTo-Json -Depth 3
$temporaryFile = Join-Path $policyDirectory ("policy-" + [Guid]::NewGuid().ToString("N") + ".tmp")
[IO.File]::WriteAllText(
    $temporaryFile,
    $json,
    (New-Object Text.UTF8Encoding($false))
)

$fileSecurity = New-Object Security.AccessControl.FileSecurity
$fileSecurity.SetOwner($userSid)
$fileSecurity.SetAccessRuleProtection($true, $false)
$fileRule = New-Object Security.AccessControl.FileSystemAccessRule(
    $userSid,
    [Security.AccessControl.FileSystemRights]::FullControl,
    [Security.AccessControl.AccessControlType]::Allow
)
$fileSecurity.AddAccessRule($fileRule)
Set-Acl -LiteralPath $temporaryFile -AclObject $fileSecurity
Move-Item -LiteralPath $temporaryFile -Destination $policyFile -Force
Set-Acl -LiteralPath $policyFile -AclObject $fileSecurity

Write-Host "NX Codex file policy: $policyFile"
Write-Host "Allowed roots:"
$policy.allowedRoots | ForEach-Object { Write-Host "  $_" }
