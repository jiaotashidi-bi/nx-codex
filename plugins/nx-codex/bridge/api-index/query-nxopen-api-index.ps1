param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$IndexPath,

    [string]$Assembly = "*",
    [string]$TypePattern = "*",
    [string]$MemberPattern = "*",
    [ValidateSet("any", "constructor", "method", "property", "field", "event")]
    [string]$Kind = "any",
    [ValidateRange(1, 10000)]
    [int]$Limit = 200,
    [switch]$AsJson
)

$ErrorActionPreference = "Stop"
$index = Get-Content -Raw -LiteralPath $IndexPath | ConvertFrom-Json
if ($index.schemaVersion -ne "1.0") {
    throw "Unsupported API index schemaVersion: $($index.schemaVersion)"
}

$matches = @()
foreach ($type in $index.types) {
    if ($type.assembly -notlike $Assembly -or
        $type.fullName -notlike $TypePattern) {
        continue
    }
    if ($MemberPattern -eq "*" -and $Kind -eq "any") {
        $matches += [PSCustomObject]@{
            assembly = $type.assembly
            type = $type.fullName
            kind = $type.kind
            memberKind = $null
            member = $null
            key = "type|$($type.fullName)"
        }
        continue
    }
    foreach ($member in $type.members) {
        $key = [string]$member
        $parts = $key -split '\|'
        $memberKind = $parts[0]
        $memberName = if ($memberKind -eq "constructor") {
            ".ctor"
        } else {
            (($parts[2] -split '[(:]')[0])
        }
        if (($Kind -eq "any" -or $memberKind -eq $Kind) -and
            ($memberName -like $MemberPattern -or
             $key -like $MemberPattern)) {
            $matches += [PSCustomObject]@{
                assembly = $type.assembly
                type = $type.fullName
                kind = $type.kind
                memberKind = $memberKind
                member = $memberName
                key = $key
            }
        }
    }
}

$limited = @($matches | Sort-Object assembly, type, key | Select-Object -First $Limit)
if ($AsJson) {
    $limited | ConvertTo-Json -Depth 5
} else {
    $limited
}
if ($matches.Count -gt $Limit) {
    Write-Warning "Returned the first $Limit of $($matches.Count) matches."
}
