param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Container })]
    [string]$NXOpenDir
)

$ErrorActionPreference = "Stop"

function Require-Method {
    param(
        [Type]$Type,
        [string]$Name,
        [Type[]]$Parameters,
        [Type]$ReturnType
    )

    $method = $Type.GetMethod($Name, $Parameters)
    if ($null -eq $method) {
        throw "Missing exact NXOpen API: $($Type.FullName).$Name"
    }
    if ($method.ReturnType -ne $ReturnType) {
        throw "Unexpected return type for $($Type.FullName).$Name"
    }
}

function Require-Property {
    param(
        [Type]$Type,
        [string]$Name,
        [Type]$PropertyType
    )

    $property = $Type.GetProperty($Name)
    if ($null -eq $property) {
        throw "Missing exact NXOpen property: $($Type.FullName).$Name"
    }
    if ($property.PropertyType -ne $PropertyType) {
        throw "Unexpected property type for $($Type.FullName).$Name"
    }
}

$nxOpen = [Reflection.Assembly]::LoadFrom((Join-Path $NXOpenDir "NXOpen.dll"))
$nxOpenUf = [Reflection.Assembly]::LoadFrom((Join-Path $NXOpenDir "NXOpen.UF.dll"))
$nxOpenUtilities = [Reflection.Assembly]::LoadFrom(
    (Join-Path $NXOpenDir "NXOpen.Utilities.dll")
)

foreach ($assembly in @($nxOpen, $nxOpenUf, $nxOpenUtilities)) {
    if ($assembly.GetName().Version.ToString() -ne "12.0.2.9") {
        throw "The nx12.0.2.9 adapter contract cannot be used with $($assembly.GetName().Name) version $($assembly.GetName().Version)."
    }
}

$partCollection = $nxOpen.GetType("NXOpen.PartCollection", $true)
$part = $nxOpen.GetType("NXOpen.Part", $true)
$basePart = $nxOpen.GetType("NXOpen.BasePart", $true)
$partLoadStatus = $nxOpen.GetType("NXOpen.PartLoadStatus", $true)
$partSaveStatus = $nxOpen.GetType("NXOpen.PartSaveStatus", $true)
$closeWholeTree = $basePart.GetNestedType("CloseWholeTree")
$closeModified = $basePart.GetNestedType("CloseModified")
$partCloseResponses = $nxOpen.GetType("NXOpen.PartCloseResponses", $true)
$partUnits = $part.GetNestedType("Units")
$ufPart = $nxOpenUf.GetType("NXOpen.UF.UFPart", $true)
$tag = $nxOpenUtilities.GetType("NXOpen.Tag", $true)
$point3d = $nxOpen.GetType("NXOpen.Point3d", $true)
$vector3d = $nxOpen.GetType("NXOpen.Vector3d", $true)
$matrix3x3 = $nxOpen.GetType("NXOpen.Matrix3x3", $true)
$cartesianCoordinateSystem = $nxOpen.GetType(
    "NXOpen.CartesianCoordinateSystem",
    $true
)
$coordinateSystemCollection = $nxOpen.GetType(
    "NXOpen.CoordinateSystemCollection",
    $true
)
$sketch = $nxOpen.GetType("NXOpen.Sketch", $true)
$sketchCollection = $nxOpen.GetType("NXOpen.SketchCollection", $true)
$sketchBuilder = $nxOpen.GetType("NXOpen.SketchInPlaceBuilder", $true)
$plane = $nxOpen.GetType("NXOpen.Plane", $true)
$planeCollection = $nxOpen.GetType("NXOpen.PlaneCollection", $true)
$updateOption = $nxOpen.GetType(
    "NXOpen.SmartObject+UpdateOption",
    $true
)
$curveCollection = $nxOpen.GetType("NXOpen.CurveCollection", $true)
$line = $nxOpen.GetType("NXOpen.Line", $true)
$feature = $nxOpen.GetType("NXOpen.Features.Feature", $true)
$featureCollection = $nxOpen.GetType(
    "NXOpen.Features.FeatureCollection",
    $true
)
$extrudeBuilder = $nxOpen.GetType(
    "NXOpen.Features.ExtrudeBuilder",
    $true
)
$sectionCollection = $nxOpen.GetType("NXOpen.SectionCollection", $true)
$section = $nxOpen.GetType("NXOpen.Section", $true)
$ufModl = $nxOpenUf.GetType("NXOpen.UF.UFModl", $true)
$ufSession = $nxOpenUf.GetType("NXOpen.UF.UFSession", $true)
$ufDisp = $nxOpenUf.GetType("NXOpen.UF.UFDisp", $true)
$imageFormat = $ufDisp.GetNestedType("ImageFormat")
$backgroundColor = $ufDisp.GetNestedType("BackgroundColor")
$body = $nxOpen.GetType("NXOpen.Body", $true)
$edge = $nxOpen.GetType("NXOpen.Edge", $true)
$edgeType = $edge.GetNestedType("EdgeType")
$face = $nxOpen.GetType("NXOpen.Face", $true)
$featureSigns = $nxOpenUf.GetType("NXOpen.UF.FeatureSigns", $true)
$ufCsys = $nxOpenUf.GetType("NXOpen.UF.UFCsys", $true)
$dexManager = $nxOpen.GetType("NXOpen.DexManager", $true)
$stepCreator = $nxOpen.GetType("NXOpen.StepCreator", $true)
$stepExportAs = $stepCreator.GetNestedType("ExportAsOption")
$stepExportFrom = $stepCreator.GetNestedType("ExportFromOption")
$stepSolidsAs = $stepCreator.GetNestedType("ExportSolidsAndSurfacesAsOption")
$session = $nxOpen.GetType("NXOpen.Session", $true)
$licenseManager = $nxOpen.GetType("NXOpen.LicenseManager", $true)
$component = $nxOpen.GetType("NXOpen.Assemblies.Component", $true)
$componentAssembly = $nxOpen.GetType(
    "NXOpen.Assemblies.ComponentAssembly",
    $true
)
$representationMode = $component.GetNestedType("RepresentationMode")
$ufAssem = $nxOpenUf.GetType("NXOpen.UF.UFAssem", $true)
$drawingSheet = $nxOpen.GetType("NXOpen.Drawings.DrawingSheet", $true)
$drawingSheetCollection = $nxOpen.GetType(
    "NXOpen.Drawings.DrawingSheetCollection",
    $true
)
$draftingView = $nxOpen.GetType("NXOpen.Drawings.DraftingView", $true)
$view = $nxOpen.GetType("NXOpen.View", $true)
$drawingSheetUnit = $drawingSheet.GetNestedType("Unit")
$projectionAngleType = $drawingSheet.GetNestedType("ProjectionAngleType")

Require-Method $partCollection "NewDisplay" @([string], $partUnits) $part
Require-Method $partCollection "OpenDisplay" @(
    [string],
    $partLoadStatus.MakeByRefType()
) $part
Require-Method $basePart "SaveAs" @([string]) $partSaveStatus
Require-Method $basePart "Close" @(
    $closeWholeTree,
    $closeModified,
    $partCloseResponses
) ([void])
Require-Method $ufPart "IsModified" @($tag) ([bool])
Require-Method $coordinateSystemCollection "CreateCoordinateSystem" @(
    $point3d,
    $matrix3x3,
    [bool]
) $cartesianCoordinateSystem
Require-Method $planeCollection "CreatePlane" @(
    $point3d,
    $vector3d,
    $updateOption
) $plane
Require-Method $sketchCollection "CreateSketchInPlaceBuilder2" @(
    $sketch
) $sketchBuilder
Require-Method $curveCollection "CreateLine" @(
    $point3d,
    $point3d
) $line
Require-Method $featureCollection "CreateExtrudeBuilder" @(
    $feature
) $extrudeBuilder
Require-Method $feature "GetParents" @() $feature.MakeArrayType()
Require-Method $sectionCollection "CreateSection" @(
    [double],
    [double],
    [double]
) $section
Require-Method $ufModl "CreateRevolved" @(
    $tag.MakeArrayType(),
    [string[]],
    [double[]],
    [double[]],
    $featureSigns,
    $tag.MakeArrayType().MakeByRefType()
) ([void])
Require-Method $body "GetFaces" @() $face.MakeArrayType()
Require-Method $body "GetFeatures" @() $feature.MakeArrayType()
Require-Method $body "GetEdges" @() $edge.MakeArrayType()
Require-Method $edge "GetVertices" @(
    $point3d.MakeByRefType(),
    $point3d.MakeByRefType()
) ([void])
Require-Method $ufModl "CreateSimpleHole" @(
    [double[]],
    [double[]],
    [string],
    [string],
    [string],
    $tag,
    $tag,
    $tag.MakeByRefType()
) ([void])
Require-Method $ufModl "AskFaceData" @(
    $tag,
    [int].MakeByRefType(),
    [double[]],
    [double[]],
    [double[]],
    [double].MakeByRefType(),
    [double].MakeByRefType(),
    [int].MakeByRefType()
) ([void])
Require-Method $ufModl "AskPointContainment" @(
    [double[]],
    $tag,
    [int].MakeByRefType()
) ([void])
Require-Method $ufModl "UniteBodies" @(
    $tag,
    $tag
) ([void])
Require-Method $ufModl "SubtractBodies" @(
    $tag,
    $tag,
    [int].MakeByRefType(),
    $tag.MakeArrayType().MakeByRefType()
) ([void])
Require-Method $ufModl "IntersectBodies" @(
    $tag,
    $tag,
    [int].MakeByRefType(),
    $tag.MakeArrayType().MakeByRefType()
) ([void])
Require-Method $ufModl "CreateBlend" @(
    [string],
    $tag.MakeArrayType(),
    [int],
    [int],
    [int],
    [double],
    $tag.MakeByRefType()
) ([void])
Require-Method $ufDisp "CreateImage" @(
    [string],
    $imageFormat,
    $backgroundColor
) ([void])
Require-Method $ufModl "AskMassProps3d" @(
    $tag.MakeArrayType(),
    [int],
    [int],
    [int],
    [double],
    [int],
    [double[]],
    [double[]],
    [double[]]
) ([void])
Require-Method $ufModl "AskBoundingBoxExact" @(
    $tag,
    $tag,
    [double[]],
    [double[,]],
    [double[]]
) ([void])
Require-Method $ufCsys "MapPoint" @(
    [int],
    [double[]],
    [int],
    [double[]]
) ([void])
Require-Method $dexManager "CreateStepCreator" @() $stepCreator
Require-Method $stepCreator "Commit" @() $nxOpen.GetType("NXOpen.NXObject", $true)
Require-Method $licenseManager "GetBundlesUsed" @() ([string[]])
Require-Method $licenseManager "GetActiveLicensesInABundle" @([string]) ([string[]])
Require-Method $component "GetChildren" @() $component.MakeArrayType()
Require-Method $component "GetComponentRepresentationMode" @() $representationMode
Require-Method $ufAssem "AskComponentData" @(
    $tag,
    [string].MakeByRefType(),
    [string].MakeByRefType(),
    [string].MakeByRefType(),
    [double[]],
    [double[]],
    [double[,]]
) ([void])
Require-Method $ufPart "IsLoaded" @([string]) ([int])
Require-Method $drawingSheetCollection "ToArray" @() $drawingSheet.MakeArrayType()
Require-Method $drawingSheet "GetDraftingViews" @() $draftingView.MakeArrayType()
Require-Method $drawingSheet "GetScale" @(
    [double].MakeByRefType(),
    [double].MakeByRefType()
) ([void])

Require-Property $sketchBuilder "Csystem" $cartesianCoordinateSystem
Require-Property $sketchBuilder "PlaneReference" $plane
Require-Property $line "StartPoint" $point3d
Require-Property $line "EndPoint" $point3d
Require-Property $edge "SolidEdgeType" $edgeType
Require-Property $extrudeBuilder "Section" $section
Require-Property $feature "JournalIdentifier" ([string])
Require-Property $feature "Name" ([string])
Require-Property $feature "FeatureType" ([string])
Require-Property $feature "Suppressed" ([bool])
Require-Property $feature "Timestamp" ([int])
Require-Property $ufSession "Disp" $ufDisp
Require-Property $stepCreator "OutputFile" ([string])
Require-Property $session "ApplicationName" ([string])
Require-Property $session "LicenseManager" $licenseManager
Require-Property $stepCreator "FileSaveFlag" ([bool])
Require-Property $stepCreator "ExportAs" $stepExportAs
Require-Property $stepCreator "ExportFrom" $stepExportFrom
Require-Property $stepCreator "ExportSolidsAndSurfacesAs" $stepSolidsAs
Require-Property $basePart "ComponentAssembly" $componentAssembly
Require-Property $basePart "FullPath" ([string])
Require-Property $basePart "Leaf" ([string])
Require-Property $componentAssembly "RootComponent" $component
Require-Property $component "DisplayName" ([string])
Require-Property $component "IsSuppressed" ([bool])
Require-Property $ufSession "Assem" $ufAssem
Require-Property $ufSession "Part" $ufPart
Require-Property $part "DrawingSheets" $drawingSheetCollection
Require-Property $drawingSheet "Length" ([double])
Require-Property $drawingSheet "Height" ([double])
Require-Property $drawingSheet "Units" $drawingSheetUnit
Require-Property $drawingSheet "ProjectionAngle" $projectionAngleType
Require-Property $drawingSheet "IsOutOfDate" ([bool])
Require-Property $view "Origin" $point3d
Require-Property $view "Scale" ([double])
Require-Property $draftingView "IsOutOfDate" ([bool])
Require-Property $draftingView "IsBroken" ([bool])
Require-Property $draftingView "IsDecoration" ([bool])
Require-Property $draftingView "IsSlave" ([bool])

foreach ($propertyName in @(
    "NumberUnloadedParts",
    "NumberUnsavedObjects",
    "NumberUnsavedParts"
)) {
    $owner = if ($propertyName -eq "NumberUnloadedParts") {
        $partLoadStatus
    } else {
        $partSaveStatus
    }
    if ($null -eq $owner.GetProperty($propertyName)) {
        throw "Missing exact NXOpen property: $($owner.FullName).$propertyName"
    }
}

Write-Host "NXOpen strict contract passed:"
Write-Host "  NXOpen version $($nxOpen.GetName().Version)"
Write-Host "  File lifecycle / sketch / extrude / NX 12 UF full revolve, semantic simple hole, strict Boolean, four-edge blend / feature tree / bounded assembly hierarchy and drafting sheets/views / PNG capture / exact box / mass properties / STEP creator / read-only active-license snapshot"
