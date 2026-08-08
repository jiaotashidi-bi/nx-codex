param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Container })]
    [string]$NXOpenDir,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

$ErrorActionPreference = "Stop"
$assemblyFiles = @("NXOpen.dll", "NXOpen.UF.dll", "NXOpen.Utilities.dll")

function Get-TypeName {
    param([Type]$Type)

    if ($Type.IsByRef) {
        return "$(Get-TypeName ($Type.GetElementType()))&"
    }
    if ($Type.IsPointer) {
        return "$(Get-TypeName ($Type.GetElementType()))*"
    }
    if ($Type.IsArray) {
        $commas = "," * ($Type.GetArrayRank() - 1)
        return "$(Get-TypeName ($Type.GetElementType()))[$commas]"
    }
    if ($Type.IsGenericParameter) {
        return $Type.Name
    }
    if ($Type.IsGenericType) {
        $definitionName = $Type.GetGenericTypeDefinition().FullName
        $tick = $definitionName.IndexOf('`')
        if ($tick -ge 0) {
            $definitionName = $definitionName.Substring(0, $tick)
        }
        $arguments = @($Type.GetGenericArguments() | ForEach-Object {
            Get-TypeName $_
        })
        return "$definitionName[$($arguments -join ',')]"
    }
    if ([string]::IsNullOrWhiteSpace($Type.FullName)) {
        return $Type.Name
    }
    return $Type.FullName
}

function Get-ParameterKey {
    param([Reflection.ParameterInfo[]]$Parameters)

    return (@($Parameters | ForEach-Object {
        $direction = if ($_.IsOut) {
            "out "
        } elseif ($_.ParameterType.IsByRef) {
            "ref "
        } else {
            ""
        }
        "$direction$(Get-TypeName $_.ParameterType)"
    }) -join ",")
}

function Get-TypeKind {
    param([Type]$Type)

    if ($Type.IsEnum) { return "enum" }
    if ($Type.IsInterface) { return "interface" }
    if ($Type.IsValueType) { return "struct" }
    if ($Type.IsSubclassOf([MulticastDelegate])) { return "delegate" }
    return "class"
}

function Get-PublicTypes {
    param([Reflection.Assembly]$Assembly)

    try {
        return @($Assembly.GetExportedTypes())
    } catch [Reflection.ReflectionTypeLoadException] {
        $messages = @($_.Exception.LoaderExceptions | ForEach-Object Message)
        throw "Could not load all exported types from $($Assembly.FullName): $($messages -join '; ')"
    }
}

$resolvedDirectory = (Resolve-Path -LiteralPath $NXOpenDir).Path
$outputFullPath = [IO.Path]::GetFullPath($OutputPath)
$outputDirectory = [IO.Path]::GetDirectoryName($outputFullPath)
if (-not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
    New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

$loadedAssemblies = @()
foreach ($fileName in $assemblyFiles) {
    $assemblyPath = Join-Path $resolvedDirectory $fileName
    if (-not (Test-Path -LiteralPath $assemblyPath -PathType Leaf)) {
        throw "$fileName was not found in $resolvedDirectory"
    }
    $loadedAssemblies += [Reflection.Assembly]::LoadFrom($assemblyPath)
}

$assemblyRecords = @()
$typeRecords = @()
$bindingFlags = [Reflection.BindingFlags]::Public -bor
    [Reflection.BindingFlags]::Instance -bor
    [Reflection.BindingFlags]::Static -bor
    [Reflection.BindingFlags]::DeclaredOnly

foreach ($assembly in ($loadedAssemblies | Sort-Object { $_.GetName().Name })) {
    $location = $assembly.Location
    $assemblyRecords += [ordered]@{
        name = $assembly.GetName().Name
        fileName = [IO.Path]::GetFileName($location)
        assemblyVersion = $assembly.GetName().Version.ToString()
        fileVersion = [Diagnostics.FileVersionInfo]::GetVersionInfo($location).FileVersion
        sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $location).Hash
    }

    foreach ($type in (Get-PublicTypes $assembly | Sort-Object FullName)) {
        $typeName = Get-TypeName $type
        $members = @()

        foreach ($constructor in @($type.GetConstructors($bindingFlags) | Sort-Object ToString)) {
            $parameters = @($constructor.GetParameters())
            $members += "constructor|$typeName($(Get-ParameterKey $parameters))"
        }
        foreach ($method in @($type.GetMethods($bindingFlags) |
            Where-Object { -not $_.IsSpecialName } |
            Sort-Object Name, ToString)) {
            $parameters = @($method.GetParameters())
            $methodName = $method.Name
            if ($method.IsGenericMethodDefinition) {
                $methodName += "``$($method.GetGenericArguments().Length)"
            }
            $returnType = Get-TypeName $method.ReturnType
            $members += "method|$typeName|$methodName($(Get-ParameterKey $parameters))->$returnType"
        }
        foreach ($property in @($type.GetProperties($bindingFlags) | Sort-Object Name, ToString)) {
            $indexParameters = @($property.GetIndexParameters())
            $propertyType = Get-TypeName $property.PropertyType
            $members += "property|$typeName|$($property.Name)($(Get-ParameterKey $indexParameters)):$propertyType"
        }
        foreach ($field in @($type.GetFields($bindingFlags) | Sort-Object Name)) {
            $fieldType = Get-TypeName $field.FieldType
            $members += "field|$typeName|$($field.Name):$fieldType"
        }
        foreach ($event in @($type.GetEvents($bindingFlags) | Sort-Object Name)) {
            $eventType = Get-TypeName $event.EventHandlerType
            $members += "event|$typeName|$($event.Name):$eventType"
        }

        $typeRecords += [ordered]@{
            assembly = $assembly.GetName().Name
            namespace = $type.Namespace
            name = $type.Name
            fullName = $typeName
            kind = Get-TypeKind $type
            baseType = if ($null -eq $type.BaseType) {
                $null
            } else {
                Get-TypeName $type.BaseType
            }
            interfaces = @($type.GetInterfaces() | ForEach-Object {
                Get-TypeName $_
            } | Sort-Object)
            members = @($members | Sort-Object -Unique)
        }
    }
}

$index = [ordered]@{
    schemaVersion = "1.0"
    generator = "nx-codex/generate-nxopen-api-index.ps1"
    memberFormat = "canonical-key"
    assemblies = $assemblyRecords
    statistics = [ordered]@{
        assemblyCount = $assemblyRecords.Count
        typeCount = $typeRecords.Count
        memberCount = (@($typeRecords | ForEach-Object { $_.members }).Count)
    }
    types = $typeRecords
}

$json = $index | ConvertTo-Json -Depth 8 -Compress
[IO.File]::WriteAllText(
    $outputFullPath,
    $json + [Environment]::NewLine,
    (New-Object Text.UTF8Encoding($false)))
Write-Host "Generated NXOpen API index: $outputFullPath"
Write-Host "  Assemblies: $($index.statistics.assemblyCount)"
Write-Host "  Public types: $($index.statistics.typeCount)"
Write-Host "  Declared public members: $($index.statistics.memberCount)"
