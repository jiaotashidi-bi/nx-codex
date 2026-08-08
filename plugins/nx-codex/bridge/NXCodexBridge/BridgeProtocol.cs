using System;
using System.Runtime.Serialization;

namespace NXCodexBridge
{
    internal static class Protocol
    {
        public const string Version = "1.0";
        public const string BridgeVersion = "1.0.0-rc.1+codex.rc1";
        public const int MaxRequestBytes = 64 * 1024;
        public const int MaxResponseBytes = 256 * 1024;
    }

    [DataContract]
    internal sealed class BridgeRequest
    {
        [DataMember(Name = "protocolVersion", IsRequired = true)]
        public string ProtocolVersion { get; set; }

        [DataMember(Name = "requestId", IsRequired = true)]
        public string RequestId { get; set; }

        [DataMember(Name = "operation", IsRequired = true)]
        public string Operation { get; set; }

        [DataMember(Name = "token", IsRequired = true)]
        public string Token { get; set; }

        [DataMember(Name = "deadlineUtc", IsRequired = true)]
        public string DeadlineUtc { get; set; }

        [DataMember(Name = "arguments", IsRequired = true)]
        public BridgeArguments Arguments { get; set; }
    }

    [DataContract]
    internal sealed class BridgeArguments
    {
        [DataMember(Name = "length", EmitDefaultValue = false)]
        public double? Length { get; set; }

        [DataMember(Name = "width", EmitDefaultValue = false)]
        public double? Width { get; set; }

        [DataMember(Name = "height", EmitDefaultValue = false)]
        public double? Height { get; set; }

        [DataMember(Name = "originX", EmitDefaultValue = false)]
        public double? OriginX { get; set; }

        [DataMember(Name = "originY", EmitDefaultValue = false)]
        public double? OriginY { get; set; }

        [DataMember(Name = "originZ", EmitDefaultValue = false)]
        public double? OriginZ { get; set; }

        [DataMember(Name = "profileWidth", EmitDefaultValue = false)]
        public double? ProfileWidth { get; set; }

        [DataMember(Name = "profileHeight", EmitDefaultValue = false)]
        public double? ProfileHeight { get; set; }

        [DataMember(Name = "centerX", EmitDefaultValue = false)]
        public double? CenterX { get; set; }

        [DataMember(Name = "centerY", EmitDefaultValue = false)]
        public double? CenterY { get; set; }

        [DataMember(Name = "planeZ", EmitDefaultValue = false)]
        public double? PlaneZ { get; set; }

        [DataMember(
            Name = "sketchFeatureJournalIdentifier",
            EmitDefaultValue = false)]
        public string SketchFeatureJournalIdentifier { get; set; }

        [DataMember(Name = "distance", EmitDefaultValue = false)]
        public double? Distance { get; set; }

        [DataMember(Name = "axisDirection", EmitDefaultValue = false)]
        public string AxisDirection { get; set; }

        [DataMember(Name = "axisOriginX", EmitDefaultValue = false)]
        public double? AxisOriginX { get; set; }

        [DataMember(Name = "axisOriginY", EmitDefaultValue = false)]
        public double? AxisOriginY { get; set; }

        [DataMember(Name = "axisOriginZ", EmitDefaultValue = false)]
        public double? AxisOriginZ { get; set; }

        [DataMember(Name = "holeCenterX", EmitDefaultValue = false)]
        public double? HoleCenterX { get; set; }

        [DataMember(Name = "holeCenterY", EmitDefaultValue = false)]
        public double? HoleCenterY { get; set; }

        [DataMember(Name = "holeDiameter", EmitDefaultValue = false)]
        public double? HoleDiameter { get; set; }

        [DataMember(Name = "booleanOperation", EmitDefaultValue = false)]
        public string BooleanOperation { get; set; }

        [DataMember(
            Name = "targetFeatureJournalIdentifier",
            EmitDefaultValue = false)]
        public string TargetFeatureJournalIdentifier { get; set; }

        [DataMember(
            Name = "toolFeatureJournalIdentifier",
            EmitDefaultValue = false)]
        public string ToolFeatureJournalIdentifier { get; set; }

        [DataMember(
            Name = "bodyFeatureJournalIdentifier",
            EmitDefaultValue = false)]
        public string BodyFeatureJournalIdentifier { get; set; }

        [DataMember(Name = "filletRadius", EmitDefaultValue = false)]
        public double? FilletRadius { get; set; }

        [DataMember(Name = "name", EmitDefaultValue = false)]
        public string Name { get; set; }

        [DataMember(Name = "transactionId", EmitDefaultValue = false)]
        public string TransactionId { get; set; }

        [DataMember(Name = "filePath", EmitDefaultValue = false)]
        public string FilePath { get; set; }

        [DataMember(Name = "partUnits", EmitDefaultValue = false)]
        public string PartUnits { get; set; }

        [DataMember(Name = "stepFormat", EmitDefaultValue = false)]
        public string StepFormat { get; set; }

        [DataMember(Name = "plannedOperation", EmitDefaultValue = false)]
        public string PlannedOperation { get; set; }

        [DataMember(Name = "maxDepth", EmitDefaultValue = false)]
        public int? MaxDepth { get; set; }

        [DataMember(Name = "maxComponents", EmitDefaultValue = false)]
        public int? MaxComponents { get; set; }

        [DataMember(Name = "maxSheets", EmitDefaultValue = false)]
        public int? MaxSheets { get; set; }

        [DataMember(Name = "maxViews", EmitDefaultValue = false)]
        public int? MaxViews { get; set; }
    }

    [DataContract]
    internal sealed class FeatureTreeNode
    {
        [DataMember(Name = "index", IsRequired = true)]
        public int Index { get; set; }

        [DataMember(Name = "journalIdentifier", IsRequired = true)]
        public string JournalIdentifier { get; set; }

        [DataMember(Name = "name", IsRequired = true)]
        public string Name { get; set; }

        [DataMember(Name = "featureType", IsRequired = true)]
        public string FeatureType { get; set; }

        [DataMember(Name = "timestamp", IsRequired = true)]
        public int Timestamp { get; set; }

        [DataMember(Name = "suppressed", IsRequired = true)]
        public bool Suppressed { get; set; }

        [DataMember(Name = "parentJournalIdentifiers", IsRequired = true)]
        public string[] ParentJournalIdentifiers { get; set; }

        [DataMember(Name = "parentsTruncated", EmitDefaultValue = false)]
        public bool? ParentsTruncated { get; set; }
    }

    [DataContract]
    internal sealed class AssemblyComponentNode
    {
        [DataMember(Name = "index", IsRequired = true)]
        public int Index { get; set; }

        [DataMember(Name = "parentIndex", EmitDefaultValue = false)]
        public int? ParentIndex { get; set; }

        [DataMember(Name = "depth", IsRequired = true)]
        public int Depth { get; set; }

        [DataMember(Name = "instanceName", IsRequired = true)]
        public string InstanceName { get; set; }

        [DataMember(Name = "displayName", IsRequired = true)]
        public string DisplayName { get; set; }

        [DataMember(Name = "prototypePartIdentifier", IsRequired = true)]
        public string PrototypePartIdentifier { get; set; }

        [DataMember(Name = "suppressed", IsRequired = true)]
        public bool Suppressed { get; set; }

        [DataMember(Name = "loadState", IsRequired = true)]
        public string LoadState { get; set; }

        [DataMember(Name = "representationMode", IsRequired = true)]
        public string RepresentationMode { get; set; }

        [DataMember(Name = "childCount", IsRequired = true)]
        public int ChildCount { get; set; }

        [DataMember(Name = "childrenTruncated", EmitDefaultValue = false)]
        public bool? ChildrenTruncated { get; set; }
    }

    [DataContract]
    internal sealed class DraftingSheetNode
    {
        [DataMember(Name = "index", IsRequired = true)]
        public int Index { get; set; }

        [DataMember(Name = "journalIdentifier", IsRequired = true)]
        public string JournalIdentifier { get; set; }

        [DataMember(Name = "name", IsRequired = true)]
        public string Name { get; set; }

        [DataMember(Name = "length", IsRequired = true)]
        public double Length { get; set; }

        [DataMember(Name = "height", IsRequired = true)]
        public double Height { get; set; }

        [DataMember(Name = "units", IsRequired = true)]
        public string Units { get; set; }

        [DataMember(Name = "projectionAngle", IsRequired = true)]
        public string ProjectionAngle { get; set; }

        [DataMember(Name = "scaleNumerator", IsRequired = true)]
        public double ScaleNumerator { get; set; }

        [DataMember(Name = "scaleDenominator", IsRequired = true)]
        public double ScaleDenominator { get; set; }

        [DataMember(Name = "isOutOfDate", IsRequired = true)]
        public bool IsOutOfDate { get; set; }

        [DataMember(Name = "viewCount", IsRequired = true)]
        public int ViewCount { get; set; }

        [DataMember(Name = "viewsTruncated", EmitDefaultValue = false)]
        public bool? ViewsTruncated { get; set; }
    }

    [DataContract]
    internal sealed class DraftingViewNode
    {
        [DataMember(Name = "index", IsRequired = true)]
        public int Index { get; set; }

        [DataMember(Name = "sheetIndex", IsRequired = true)]
        public int SheetIndex { get; set; }

        [DataMember(Name = "journalIdentifier", IsRequired = true)]
        public string JournalIdentifier { get; set; }

        [DataMember(Name = "name", IsRequired = true)]
        public string Name { get; set; }

        [DataMember(Name = "scale", IsRequired = true)]
        public double Scale { get; set; }

        [DataMember(Name = "originX", IsRequired = true)]
        public double OriginX { get; set; }

        [DataMember(Name = "originY", IsRequired = true)]
        public double OriginY { get; set; }

        [DataMember(Name = "originZ", IsRequired = true)]
        public double OriginZ { get; set; }

        [DataMember(Name = "isOutOfDate", IsRequired = true)]
        public bool IsOutOfDate { get; set; }

        [DataMember(Name = "isBroken", IsRequired = true)]
        public bool IsBroken { get; set; }

        [DataMember(Name = "isDecoration", IsRequired = true)]
        public bool IsDecoration { get; set; }

        [DataMember(Name = "isSlave", IsRequired = true)]
        public bool IsSlave { get; set; }
    }

    [DataContract]
    internal sealed class BridgeResult
    {
        [DataMember(Name = "connected", EmitDefaultValue = false)]
        public bool? Connected { get; set; }

        [DataMember(Name = "status", EmitDefaultValue = false)]
        public string Status { get; set; }

        [DataMember(Name = "bridgeVersion", EmitDefaultValue = false)]
        public string BridgeVersion { get; set; }

        [DataMember(Name = "protocolVersion", EmitDefaultValue = false)]
        public string ProtocolVersion { get; set; }

        [DataMember(Name = "nxVersion", EmitDefaultValue = false)]
        public string NxVersion { get; set; }

        [DataMember(Name = "nxOpenAssemblyVersion", EmitDefaultValue = false)]
        public string NxOpenAssemblyVersion { get; set; }

        [DataMember(Name = "adapterId", EmitDefaultValue = false)]
        public string AdapterId { get; set; }

        [DataMember(Name = "adapterContractId", EmitDefaultValue = false)]
        public string AdapterContractId { get; set; }

        [DataMember(Name = "compatibilityStatus", EmitDefaultValue = false)]
        public string CompatibilityStatus { get; set; }

        [DataMember(Name = "processId", EmitDefaultValue = false)]
        public int? ProcessId { get; set; }

        [DataMember(Name = "capabilities", EmitDefaultValue = false)]
        public string[] Capabilities { get; set; }

        [DataMember(Name = "allowedRoots", EmitDefaultValue = false)]
        public string[] AllowedRoots { get; set; }

        [DataMember(Name = "dispatcher", EmitDefaultValue = false)]
        public string Dispatcher { get; set; }

        [DataMember(Name = "application", EmitDefaultValue = false)]
        public string Application { get; set; }

        [DataMember(Name = "applicationName", EmitDefaultValue = false)]
        public string ApplicationName { get; set; }

        [DataMember(Name = "available", EmitDefaultValue = false)]
        public bool? Available { get; set; }

        [DataMember(Name = "licensed", EmitDefaultValue = false)]
        public bool? Licensed { get; set; }

        [DataMember(Name = "unsupportedReason", EmitDefaultValue = false)]
        public string UnsupportedReason { get; set; }

        [DataMember(Name = "workPart", EmitDefaultValue = false)]
        public string WorkPart { get; set; }

        [DataMember(Name = "displayPart", EmitDefaultValue = false)]
        public string DisplayPart { get; set; }

        [DataMember(Name = "units", EmitDefaultValue = false)]
        public string Units { get; set; }

        [DataMember(Name = "modified", EmitDefaultValue = false)]
        public bool? Modified { get; set; }

        [DataMember(Name = "featureCount", EmitDefaultValue = false)]
        public int? FeatureCount { get; set; }

        [DataMember(Name = "bodyCount", EmitDefaultValue = false)]
        public int? BodyCount { get; set; }

        [DataMember(Name = "solidBodyCount", EmitDefaultValue = false)]
        public int? SolidBodyCount { get; set; }

        [DataMember(Name = "transactionId", EmitDefaultValue = false)]
        public string TransactionId { get; set; }

        [DataMember(Name = "featureJournalIdentifier", EmitDefaultValue = false)]
        public string FeatureJournalIdentifier { get; set; }

        [DataMember(Name = "featureName", EmitDefaultValue = false)]
        public string FeatureName { get; set; }

        [DataMember(Name = "curveCount", EmitDefaultValue = false)]
        public int? CurveCount { get; set; }

        [DataMember(Name = "measuredBodyCount", EmitDefaultValue = false)]
        public int? MeasuredBodyCount { get; set; }

        [DataMember(Name = "measurementUnits", EmitDefaultValue = false)]
        public string MeasurementUnits { get; set; }

        [DataMember(Name = "boundingBoxMinX", EmitDefaultValue = false)]
        public double? BoundingBoxMinX { get; set; }

        [DataMember(Name = "boundingBoxMinY", EmitDefaultValue = false)]
        public double? BoundingBoxMinY { get; set; }

        [DataMember(Name = "boundingBoxMinZ", EmitDefaultValue = false)]
        public double? BoundingBoxMinZ { get; set; }

        [DataMember(Name = "boundingBoxMaxX", EmitDefaultValue = false)]
        public double? BoundingBoxMaxX { get; set; }

        [DataMember(Name = "boundingBoxMaxY", EmitDefaultValue = false)]
        public double? BoundingBoxMaxY { get; set; }

        [DataMember(Name = "boundingBoxMaxZ", EmitDefaultValue = false)]
        public double? BoundingBoxMaxZ { get; set; }

        [DataMember(Name = "boundingBoxSizeX", EmitDefaultValue = false)]
        public double? BoundingBoxSizeX { get; set; }

        [DataMember(Name = "boundingBoxSizeY", EmitDefaultValue = false)]
        public double? BoundingBoxSizeY { get; set; }

        [DataMember(Name = "boundingBoxSizeZ", EmitDefaultValue = false)]
        public double? BoundingBoxSizeZ { get; set; }

        [DataMember(Name = "surfaceArea", EmitDefaultValue = false)]
        public double? SurfaceArea { get; set; }

        [DataMember(Name = "volume", EmitDefaultValue = false)]
        public double? Volume { get; set; }

        [DataMember(Name = "centroidX", EmitDefaultValue = false)]
        public double? CentroidX { get; set; }

        [DataMember(Name = "centroidY", EmitDefaultValue = false)]
        public double? CentroidY { get; set; }

        [DataMember(Name = "centroidZ", EmitDefaultValue = false)]
        public double? CentroidZ { get; set; }

        [DataMember(Name = "filePath", EmitDefaultValue = false)]
        public string FilePath { get; set; }

        [DataMember(Name = "opened", EmitDefaultValue = false)]
        public bool? Opened { get; set; }

        [DataMember(Name = "saved", EmitDefaultValue = false)]
        public bool? Saved { get; set; }

        [DataMember(Name = "closed", EmitDefaultValue = false)]
        public bool? Closed { get; set; }

        [DataMember(Name = "loadWarnings", EmitDefaultValue = false)]
        public string[] LoadWarnings { get; set; }

        [DataMember(Name = "message", EmitDefaultValue = false)]
        public string Message { get; set; }

        [DataMember(Name = "exported", EmitDefaultValue = false)]
        public bool? Exported { get; set; }

        [DataMember(Name = "stepFormat", EmitDefaultValue = false)]
        public string StepFormat { get; set; }

        [DataMember(Name = "preflightPassed", EmitDefaultValue = false)]
        public bool? PreflightPassed { get; set; }

        [DataMember(Name = "preflightId", EmitDefaultValue = false)]
        public string PreflightId { get; set; }

        [DataMember(Name = "preflightUtc", EmitDefaultValue = false)]
        public string PreflightUtc { get; set; }

        [DataMember(Name = "plannedOperation", EmitDefaultValue = false)]
        public string PlannedOperation { get; set; }

        [DataMember(Name = "featureTreeFingerprint", EmitDefaultValue = false)]
        public string FeatureTreeFingerprint { get; set; }

        [DataMember(Name = "featureTreeTotalCount", EmitDefaultValue = false)]
        public int? FeatureTreeTotalCount { get; set; }

        [DataMember(Name = "featureTreeReturnedCount", EmitDefaultValue = false)]
        public int? FeatureTreeReturnedCount { get; set; }

        [DataMember(Name = "featureTreeTruncated", EmitDefaultValue = false)]
        public bool? FeatureTreeTruncated { get; set; }

        [DataMember(Name = "features", EmitDefaultValue = false)]
        public FeatureTreeNode[] Features { get; set; }

        [DataMember(Name = "assemblyReadAvailable", EmitDefaultValue = false)]
        public bool? AssemblyReadAvailable { get; set; }

        [DataMember(Name = "isAssembly", EmitDefaultValue = false)]
        public bool? IsAssembly { get; set; }

        [DataMember(Name = "rootComponent", EmitDefaultValue = false)]
        public AssemblyComponentNode RootComponent { get; set; }

        [DataMember(Name = "components", EmitDefaultValue = false)]
        public AssemblyComponentNode[] Components { get; set; }

        [DataMember(Name = "componentCount", EmitDefaultValue = false)]
        public int? ComponentCount { get; set; }

        [DataMember(Name = "returnedComponentCount", EmitDefaultValue = false)]
        public int? ReturnedComponentCount { get; set; }

        [DataMember(Name = "componentCountComplete", EmitDefaultValue = false)]
        public bool? ComponentCountComplete { get; set; }

        [DataMember(Name = "assemblyStructureTruncated", EmitDefaultValue = false)]
        public bool? AssemblyStructureTruncated { get; set; }

        [DataMember(Name = "depthTruncated", EmitDefaultValue = false)]
        public bool? DepthTruncated { get; set; }

        [DataMember(Name = "componentLimitTruncated", EmitDefaultValue = false)]
        public bool? ComponentLimitTruncated { get; set; }

        [DataMember(Name = "maxDepth", EmitDefaultValue = false)]
        public int? MaxDepth { get; set; }

        [DataMember(Name = "maxComponents", EmitDefaultValue = false)]
        public int? MaxComponents { get; set; }

        [DataMember(Name = "assemblyStructureFingerprint", EmitDefaultValue = false)]
        public string AssemblyStructureFingerprint { get; set; }

        [DataMember(Name = "draftingReadAvailable", EmitDefaultValue = false)]
        public bool? DraftingReadAvailable { get; set; }

        [DataMember(Name = "hasDrawingSheets", EmitDefaultValue = false)]
        public bool? HasDrawingSheets { get; set; }

        [DataMember(Name = "sheets", EmitDefaultValue = false)]
        public DraftingSheetNode[] Sheets { get; set; }

        [DataMember(Name = "views", EmitDefaultValue = false)]
        public DraftingViewNode[] Views { get; set; }

        [DataMember(Name = "sheetCount", EmitDefaultValue = false)]
        public int? SheetCount { get; set; }

        [DataMember(Name = "returnedSheetCount", EmitDefaultValue = false)]
        public int? ReturnedSheetCount { get; set; }

        [DataMember(Name = "sheetCountComplete", EmitDefaultValue = false)]
        public bool? SheetCountComplete { get; set; }

        [DataMember(Name = "viewCount", EmitDefaultValue = false)]
        public int? ViewCount { get; set; }

        [DataMember(Name = "returnedViewCount", EmitDefaultValue = false)]
        public int? ReturnedViewCount { get; set; }

        [DataMember(Name = "viewCountComplete", EmitDefaultValue = false)]
        public bool? ViewCountComplete { get; set; }

        [DataMember(Name = "draftingStructureTruncated", EmitDefaultValue = false)]
        public bool? DraftingStructureTruncated { get; set; }

        [DataMember(Name = "sheetLimitTruncated", EmitDefaultValue = false)]
        public bool? SheetLimitTruncated { get; set; }

        [DataMember(Name = "viewLimitTruncated", EmitDefaultValue = false)]
        public bool? ViewLimitTruncated { get; set; }

        [DataMember(Name = "maxSheets", EmitDefaultValue = false)]
        public int? MaxSheets { get; set; }

        [DataMember(Name = "maxViews", EmitDefaultValue = false)]
        public int? MaxViews { get; set; }

        [DataMember(Name = "draftingStructureFingerprint", EmitDefaultValue = false)]
        public string DraftingStructureFingerprint { get; set; }

        [DataMember(Name = "captured", EmitDefaultValue = false)]
        public bool? Captured { get; set; }

        [DataMember(Name = "screenshotBytes", EmitDefaultValue = false)]
        public int? ScreenshotBytes { get; set; }

        [DataMember(Name = "screenshotSha256", EmitDefaultValue = false)]
        public string ScreenshotSha256 { get; set; }
    }

    [DataContract]
    internal sealed class BridgeError
    {
        [DataMember(Name = "code", IsRequired = true)]
        public string Code { get; set; }

        [DataMember(Name = "message", IsRequired = true)]
        public string Message { get; set; }

        [DataMember(Name = "retryable", IsRequired = true)]
        public bool Retryable { get; set; }
    }

    [DataContract]
    internal sealed class BridgeResponse
    {
        [DataMember(Name = "protocolVersion", IsRequired = true)]
        public string ProtocolVersion { get; set; }

        [DataMember(Name = "requestId", IsRequired = true)]
        public string RequestId { get; set; }

        [DataMember(Name = "ok", IsRequired = true)]
        public bool Ok { get; set; }

        [DataMember(Name = "result", IsRequired = true)]
        public BridgeResult Result { get; set; }

        [DataMember(Name = "error", IsRequired = true)]
        public BridgeError Error { get; set; }

        [DataMember(Name = "durationMs", IsRequired = true)]
        public int DurationMs { get; set; }
    }

    [DataContract]
    internal sealed class BridgeSessionDescriptor
    {
        [DataMember(Name = "protocolVersion", IsRequired = true)]
        public string ProtocolVersion { get; set; }

        [DataMember(Name = "pipeName", IsRequired = true)]
        public string PipeName { get; set; }

        [DataMember(Name = "token", IsRequired = true)]
        public string Token { get; set; }

        [DataMember(Name = "processId", IsRequired = true)]
        public int ProcessId { get; set; }

        [DataMember(Name = "createdUtc", IsRequired = true)]
        public string CreatedUtc { get; set; }

        [DataMember(Name = "expiresUtc", IsRequired = true)]
        public string ExpiresUtc { get; set; }
    }

    internal sealed class BridgeFaultException : Exception
    {
        public BridgeFaultException(string code, string message, bool retryable)
            : base(message)
        {
            Code = code;
            Retryable = retryable;
        }

        public string Code { get; private set; }
        public bool Retryable { get; private set; }
    }
}
