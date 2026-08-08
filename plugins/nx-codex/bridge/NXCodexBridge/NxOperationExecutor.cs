using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Globalization;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;

using NXOpen;
using NXOpen.Drawings;
using NXOpen.Features;
using NXOpen.UF;

namespace NXCodexBridge
{
    internal sealed class NxOperationExecutor
    {
        private readonly Session session;
        private readonly string dispatcherStatus;
        private readonly INxVersionAdapter adapter;
        private readonly List<TransactionRecord> transactions =
            new List<TransactionRecord>();

        public NxOperationExecutor(Session session, string dispatcherStatus)
        {
            this.session = session;
            this.dispatcherStatus = dispatcherStatus;
            this.adapter = NxVersionAdapterRegistry.Select(
                typeof(Session).Assembly.GetName().Version);
        }

        public BridgeResult Execute(BridgeRequest request)
        {
            if (!adapter.Supports(request.Operation))
            {
                throw new BridgeFaultException(
                    "NX_VERSION_NOT_SUPPORTED",
                    "Operation '" + request.Operation +
                    "' is unavailable because NXOpen assembly version " +
                    adapter.NxOpenAssemblyVersion +
                    " has no verified typed adapter.",
                    false);
            }
            switch (request.Operation)
            {
                case "health":
                    return BaseResult();
                case "get_capabilities":
                    BridgeResult capabilities = BaseResult();
                    capabilities.Capabilities = adapter.SupportedCapabilities;
                    try
                    {
                        capabilities.AllowedRoots =
                            FileAccessPolicy.Load().AllowedRoots;
                    }
                    catch (BridgeFaultException ex)
                    {
                        capabilities.Message =
                            ex.Code + ": " + ex.Message;
                    }
                    return capabilities;
                case "get_session_state":
                    return GetSessionState();
                case "get_assembly_capability":
                    return GetModuleCapability("assembly");
                case "get_drafting_capability":
                    return GetModuleCapability("drafting");
                case "get_cae_capability":
                    return GetCaeCapability();
                case "get_cam_capability":
                    return GetModuleCapability("cam");
                case "get_assembly_structure":
                    return GetAssemblyStructure(request.Arguments);
                case "get_drafting_structure":
                    return GetDraftingStructure(request.Arguments);
                case "create_test_drawing":
                    return CreateTestDrawing(request.Arguments);
                case "preflight_modeling":
                    return PreflightModeling(request.Arguments);
                case "get_feature_tree":
                    return GetFeatureTree();
                case "capture_screenshot":
                    return CaptureScreenshot(request.Arguments);
                case "new_part":
                    return NewPart(request.Arguments);
                case "open_part":
                    return OpenPart(request.Arguments);
                case "save_as":
                    return SaveAs(request.Arguments);
                case "close_part":
                    return ClosePart();
                case "create_block":
                    return CreateBlock(request.Arguments);
                case "create_rectangle_sketch":
                    return CreateRectangleSketch(request.Arguments);
                case "extrude_sketch":
                    return ExtrudeSketch(request.Arguments);
                case "revolve_sketch":
                    return RevolveSketch(request.Arguments);
                case "create_simple_through_hole":
                    return CreateSimpleThroughHole(request.Arguments);
                case "boolean_bodies":
                    return BooleanBodies(request.Arguments);
                case "fillet_vertical_edges":
                    return FilletVerticalEdges(request.Arguments);
                case "measure_work_part":
                    return MeasureWorkPart();
                case "export_step":
                    return ExportStep(request.Arguments);
                case "undo_transaction":
                    return UndoTransaction(request.Arguments);
                default:
                    throw new BridgeFaultException(
                        "UNSUPPORTED_OPERATION",
                        "The bridge does not support operation: " + request.Operation,
                        false);
            }
        }

        private BridgeResult BaseResult()
        {
            string environmentVersion =
                Environment.GetEnvironmentVariable("UGII_VERSION");
            string assemblyVersion =
                typeof(Session).Assembly.GetName().Version == null
                    ? "unknown"
                    : typeof(Session).Assembly.GetName().Version.ToString();

            return new BridgeResult
            {
                Connected = true,
                Status = string.Equals(
                    adapter.CompatibilityStatus,
                    "verified",
                    StringComparison.Ordinal)
                        ? "ready"
                        : "compatibility-blocked",
                BridgeVersion = Protocol.BridgeVersion,
                ProtocolVersion = Protocol.Version,
                NxVersion = string.IsNullOrWhiteSpace(environmentVersion)
                    ? assemblyVersion
                    : environmentVersion + " / NXOpen " + assemblyVersion,
                ProcessId = Process.GetCurrentProcess().Id,
                Dispatcher = dispatcherStatus,
                AdapterId = adapter.Id,
                AdapterContractId = adapter.ContractId,
                CompatibilityStatus = adapter.CompatibilityStatus,
                NxOpenAssemblyVersion = adapter.NxOpenAssemblyVersion
            };
        }

        private BridgeResult GetSessionState()
        {
            BridgeResult result = BaseResult();
            Part workPart = session.Parts.Work;
            Part displayPart = session.Parts.Display;

            result.Application = ReadStringProperty(session, "ApplicationName");
            result.WorkPart = DescribePart(workPart);
            result.DisplayPart = DescribePart(displayPart);

            if (workPart != null)
            {
                result.Units =
                    ReadStringProperty(workPart, "PartUnits")
                    ?? ReadStringProperty(workPart, "Units")
                    ?? "unknown";
                result.Modified =
                    UFSession.GetUFSession().Part.IsModified(workPart.Tag);
                result.FeatureCount = workPart.Features.ToArray().Length;
                result.BodyCount = workPart.Bodies.ToArray().Length;
                result.SolidBodyCount = GetSolidBodies(workPart).Count;
            }
            else
            {
                result.Units = "unknown";
                result.Modified = false;
                result.FeatureCount = 0;
                result.BodyCount = 0;
                result.SolidBodyCount = 0;
            }

            return result;
        }

        private BridgeResult GetModuleCapability(string moduleName)
        {
            ModuleCapabilityDetection detection =
                adapter.DetectModuleCapability(session, moduleName);
            BridgeResult result = BaseResult();
            result.Available = detection.Available;
            result.Licensed = detection.Licensed;
            result.UnsupportedReason = detection.UnsupportedReason ?? string.Empty;
            return result;
        }

        private BridgeResult GetCaeCapability()
        {
            ModuleCapabilityDetection detection =
                adapter.DetectModuleCapability(session, "cae");

            // CAE capability is intentionally a narrow, six-field read-only
            // result. Do not start an application, initialize a CAE module,
            // reserve/release a license, create FEM/SIM data, mesh, solve, or
            // save the current part while assembling this response.
            return new BridgeResult
            {
                Available = detection.Available,
                Licensed = detection.Licensed,
                ApplicationName = ReadStringProperty(
                    session,
                    "ApplicationName") ?? string.Empty,
                AdapterId = adapter.Id,
                CompatibilityStatus = adapter.CompatibilityStatus,
                UnsupportedReason = detection.UnsupportedReason ?? string.Empty
            };
        }

        private BridgeResult GetAssemblyStructure(BridgeArguments arguments)
        {
            int maxDepth = arguments == null || !arguments.MaxDepth.HasValue
                ? 8
                : arguments.MaxDepth.Value;
            int maxComponents =
                arguments == null || !arguments.MaxComponents.HasValue
                    ? 128
                    : arguments.MaxComponents.Value;
            if (maxDepth < 0 || maxDepth > 32)
            {
                throw InvalidArgument("maxDepth must be between 0 and 32.");
            }
            if (maxComponents < 1 || maxComponents > 128)
            {
                throw InvalidArgument(
                    "maxComponents must be between 1 and 128.");
            }

            BridgeResult before = GetSessionState();
            ModuleCapabilityDetection detection =
                adapter.DetectModuleCapability(session, "assembly");
            before.Available = detection.Available;
            before.Licensed = detection.Licensed;
            before.AssemblyReadAvailable = false;
            before.MaxDepth = maxDepth;
            before.MaxComponents = maxComponents;
            before.Components = new AssemblyComponentNode[0];
            before.ComponentCount = 0;
            before.ReturnedComponentCount = 0;
            before.ComponentCountComplete = false;
            before.AssemblyStructureTruncated = false;
            before.DepthTruncated = false;
            before.ComponentLimitTruncated = false;

            if (!detection.Available)
            {
                before.UnsupportedReason = string.IsNullOrWhiteSpace(
                    detection.UnsupportedReason)
                        ? "The exact NX adapter does not expose assembly read-only capability."
                        : detection.UnsupportedReason;
                before.Message =
                    "Assembly structure was not inspected because the exact adapter capability is unavailable.";
                return before;
            }
            if (!detection.Licensed)
            {
                before.UnsupportedReason =
                    "No assembly license is active in the current NX session. No license was reserved or released, and the NX application was not changed.";
                before.Message =
                    "Assembly structure read failed closed before any component-tree API was called. This does not imply that the installation has no assembly entitlement.";
                return before;
            }

            Part workPart = session.Parts.Work;
            if (workPart == null)
            {
                before.UnsupportedReason =
                    "No work part is loaded in the current NX session.";
                before.Message =
                    "Assembly structure was not inspected because there is no work part.";
                return before;
            }

            try
            {
                AssemblyStructureSnapshot snapshot =
                    adapter.ReadAssemblyStructure(
                        workPart,
                        maxDepth,
                        maxComponents);
                BridgeResult after = GetSessionState();
                if (before.Modified != after.Modified ||
                    before.FeatureCount != after.FeatureCount ||
                    before.BodyCount != after.BodyCount)
                {
                    throw new BridgeFaultException(
                        "ASSEMBLY_READ_CHANGED_PART_STATE",
                        "The assembly read unexpectedly changed modified, featureCount, or bodyCount.",
                        false);
                }

                after.Available = true;
                after.Licensed = true;
                after.AssemblyReadAvailable = true;
                after.UnsupportedReason = string.Empty;
                after.IsAssembly = snapshot.IsAssembly;
                after.RootComponent = snapshot.RootComponent;
                after.Components = snapshot.Components ??
                    new AssemblyComponentNode[0];
                after.ComponentCount = snapshot.ComponentCount;
                after.ReturnedComponentCount = after.Components.Length;
                after.ComponentCountComplete = snapshot.ComponentCountComplete;
                after.DepthTruncated = snapshot.DepthTruncated;
                after.ComponentLimitTruncated =
                    snapshot.ComponentLimitTruncated;
                after.AssemblyStructureTruncated =
                    snapshot.DepthTruncated ||
                    snapshot.ComponentLimitTruncated;
                after.MaxDepth = maxDepth;
                after.MaxComponents = maxComponents;
                after.AssemblyStructureFingerprint =
                    FingerprintAssemblyStructure(snapshot);
                after.Message = snapshot.IsAssembly
                    ? (after.AssemblyStructureTruncated == true
                        ? "Read a bounded assembly component tree without modifying NX; componentCount is the returned lower bound because the configured limits truncated the structure."
                        : "Read the complete assembly component tree within the configured limits without modifying NX.")
                    : "The current work part is not an assembly; no root component or component occurrences were returned.";
                return after;
            }
            catch (BridgeFaultException)
            {
                throw;
            }
            catch (Exception ex)
            {
                before.UnsupportedReason =
                    "NX 12.0.2.9 assembly read failed closed: " +
                    ex.GetType().Name +
                    ".";
                before.Message =
                    "No partial component tree was returned and no NX change was requested.";
                return before;
            }
        }

        private static string FingerprintAssemblyStructure(
            AssemblyStructureSnapshot snapshot)
        {
            StringBuilder canonical = new StringBuilder();
            canonical.Append(snapshot.IsAssembly ? '1' : '0');
            canonical.Append('|');
            AppendAssemblyNodeFingerprint(canonical, snapshot.RootComponent);
            foreach (AssemblyComponentNode component in
                snapshot.Components ?? new AssemblyComponentNode[0])
            {
                AppendAssemblyNodeFingerprint(canonical, component);
            }
            canonical.Append(snapshot.DepthTruncated ? '1' : '0');
            canonical.Append('|');
            canonical.Append(snapshot.ComponentLimitTruncated ? '1' : '0');
            canonical.Append('|');
            return Sha256Hex(Encoding.UTF8.GetBytes(canonical.ToString()));
        }

        private static void AppendAssemblyNodeFingerprint(
            StringBuilder canonical,
            AssemblyComponentNode node)
        {
            if (node == null)
            {
                canonical.Append("null|");
                return;
            }
            canonical.Append(node.Index.ToString(CultureInfo.InvariantCulture));
            canonical.Append('|');
            canonical.Append(node.ParentIndex.HasValue
                ? node.ParentIndex.Value.ToString(CultureInfo.InvariantCulture)
                : "root");
            canonical.Append('|');
            canonical.Append(node.Depth.ToString(CultureInfo.InvariantCulture));
            canonical.Append('|');
            AppendFingerprintValue(canonical, node.InstanceName);
            AppendFingerprintValue(canonical, node.DisplayName);
            AppendFingerprintValue(canonical, node.PrototypePartIdentifier);
            canonical.Append(node.Suppressed ? '1' : '0');
            canonical.Append('|');
            AppendFingerprintValue(canonical, node.LoadState);
            AppendFingerprintValue(canonical, node.RepresentationMode);
            canonical.Append(node.ChildCount.ToString(CultureInfo.InvariantCulture));
            canonical.Append('|');
            canonical.Append(node.ChildrenTruncated == true ? '1' : '0');
            canonical.Append('|');
        }

        private BridgeResult GetDraftingStructure(BridgeArguments arguments)
        {
            int maxSheets = arguments == null || !arguments.MaxSheets.HasValue
                ? 32
                : arguments.MaxSheets.Value;
            int maxViews = arguments == null || !arguments.MaxViews.HasValue
                ? 128
                : arguments.MaxViews.Value;
            if (maxSheets < 1 || maxSheets > 64)
            {
                throw InvalidArgument("maxSheets must be between 1 and 64.");
            }
            if (maxViews < 1 || maxViews > 128)
            {
                throw InvalidArgument("maxViews must be between 1 and 128.");
            }

            BridgeResult before = GetSessionState();
            ModuleCapabilityDetection detection =
                adapter.DetectModuleCapability(session, "drafting");
            before.Available = detection.Available;
            before.Licensed = detection.Licensed;
            before.DraftingReadAvailable = false;
            before.MaxSheets = maxSheets;
            before.MaxViews = maxViews;
            before.Sheets = new DraftingSheetNode[0];
            before.Views = new DraftingViewNode[0];
            before.SheetCount = 0;
            before.ReturnedSheetCount = 0;
            before.SheetCountComplete = false;
            before.ViewCount = 0;
            before.ReturnedViewCount = 0;
            before.ViewCountComplete = false;
            before.DraftingStructureTruncated = false;
            before.SheetLimitTruncated = false;
            before.ViewLimitTruncated = false;

            if (!detection.Available)
            {
                before.UnsupportedReason = string.IsNullOrWhiteSpace(
                    detection.UnsupportedReason)
                        ? "The exact NX adapter does not expose drafting read-only capability."
                        : detection.UnsupportedReason;
                before.Message =
                    "Drafting sheets and views were not inspected because the exact adapter capability is unavailable.";
                return before;
            }
            if (!detection.Licensed)
            {
                before.UnsupportedReason =
                    "No drafting license is active in the current NX session. No license was reserved or released, and the NX application was not changed.";
                before.Message =
                    "Drafting structure read failed closed before any drawing-sheet or drafting-view API was called. This does not imply that the installation has no drafting entitlement.";
                return before;
            }

            Part workPart = session.Parts.Work;
            if (workPart == null)
            {
                before.UnsupportedReason =
                    "No work part is loaded in the current NX session.";
                before.Message =
                    "Drafting sheets and views were not inspected because there is no work part.";
                return before;
            }

            try
            {
                DraftingStructureSnapshot snapshot =
                    adapter.ReadDraftingStructure(
                        workPart,
                        maxSheets,
                        maxViews);
                BridgeResult after = GetSessionState();
                if (before.Modified != after.Modified ||
                    before.FeatureCount != after.FeatureCount ||
                    before.BodyCount != after.BodyCount ||
                    before.SolidBodyCount != after.SolidBodyCount)
                {
                    throw new BridgeFaultException(
                        "DRAFTING_READ_CHANGED_PART_STATE",
                        "The drafting read unexpectedly changed modified, featureCount, bodyCount, or solidBodyCount.",
                        false);
                }

                after.Available = true;
                after.Licensed = true;
                after.DraftingReadAvailable = true;
                after.UnsupportedReason = string.Empty;
                after.HasDrawingSheets = snapshot.HasDrawingSheets;
                after.Sheets = snapshot.Sheets ?? new DraftingSheetNode[0];
                after.Views = snapshot.Views ?? new DraftingViewNode[0];
                after.SheetCount = snapshot.SheetCount;
                after.ReturnedSheetCount = after.Sheets.Length;
                after.SheetCountComplete = snapshot.SheetCountComplete;
                after.ViewCount = snapshot.ViewCount;
                after.ReturnedViewCount = after.Views.Length;
                after.ViewCountComplete = snapshot.ViewCountComplete;
                after.SheetLimitTruncated = snapshot.SheetLimitTruncated;
                after.ViewLimitTruncated = snapshot.ViewLimitTruncated;
                after.DraftingStructureTruncated =
                    snapshot.SheetLimitTruncated ||
                    snapshot.ViewLimitTruncated;
                after.MaxSheets = maxSheets;
                after.MaxViews = maxViews;
                after.DraftingStructureFingerprint =
                    FingerprintDraftingStructure(snapshot);
                after.Message = snapshot.HasDrawingSheets
                    ? (after.DraftingStructureTruncated == true
                        ? "Read bounded drawing sheets and drafting views without modifying NX; returned counts are limited by the requested bounds."
                        : "Read all drawing sheets and drafting views within the configured limits without modifying NX.")
                    : "The current work part has no drawing sheets; no drafting views were returned.";
                return after;
            }
            catch (BridgeFaultException)
            {
                throw;
            }
            catch (Exception ex)
            {
                before.UnsupportedReason =
                    "NX 12.0.2.9 drafting read failed closed: " +
                    ex.GetType().Name +
                    ".";
                before.Message =
                    "No partial drawing-sheet or drafting-view result was returned and no NX change was requested.";
                return before;
            }
        }

        private static string FingerprintDraftingStructure(
            DraftingStructureSnapshot snapshot)
        {
            StringBuilder canonical = new StringBuilder();
            canonical.Append(snapshot.HasDrawingSheets ? '1' : '0');
            canonical.Append('|');
            canonical.Append(snapshot.SheetCount.ToString(
                CultureInfo.InvariantCulture));
            canonical.Append('|');
            canonical.Append(snapshot.SheetCountComplete ? '1' : '0');
            canonical.Append('|');
            canonical.Append(snapshot.ViewCount.ToString(
                CultureInfo.InvariantCulture));
            canonical.Append('|');
            canonical.Append(snapshot.ViewCountComplete ? '1' : '0');
            canonical.Append('|');
            canonical.Append(snapshot.SheetLimitTruncated ? '1' : '0');
            canonical.Append('|');
            canonical.Append(snapshot.ViewLimitTruncated ? '1' : '0');
            canonical.Append('|');
            foreach (DraftingSheetNode sheet in
                snapshot.Sheets ?? new DraftingSheetNode[0])
            {
                canonical.Append(sheet.Index.ToString(
                    CultureInfo.InvariantCulture));
                canonical.Append('|');
                AppendFingerprintValue(canonical, sheet.JournalIdentifier);
                AppendFingerprintValue(canonical, sheet.Name);
                AppendFingerprintDouble(canonical, sheet.Length);
                AppendFingerprintDouble(canonical, sheet.Height);
                AppendFingerprintValue(canonical, sheet.Units);
                AppendFingerprintValue(canonical, sheet.ProjectionAngle);
                AppendFingerprintDouble(canonical, sheet.ScaleNumerator);
                AppendFingerprintDouble(canonical, sheet.ScaleDenominator);
                canonical.Append(sheet.IsOutOfDate ? '1' : '0');
                canonical.Append('|');
                canonical.Append(sheet.ViewCount.ToString(
                    CultureInfo.InvariantCulture));
                canonical.Append('|');
                canonical.Append(sheet.ViewsTruncated == true ? '1' : '0');
                canonical.Append('|');
            }
            foreach (DraftingViewNode view in
                snapshot.Views ?? new DraftingViewNode[0])
            {
                canonical.Append(view.Index.ToString(
                    CultureInfo.InvariantCulture));
                canonical.Append('|');
                canonical.Append(view.SheetIndex.ToString(
                    CultureInfo.InvariantCulture));
                canonical.Append('|');
                AppendFingerprintValue(canonical, view.JournalIdentifier);
                AppendFingerprintValue(canonical, view.Name);
                AppendFingerprintDouble(canonical, view.Scale);
                AppendFingerprintDouble(canonical, view.OriginX);
                AppendFingerprintDouble(canonical, view.OriginY);
                AppendFingerprintDouble(canonical, view.OriginZ);
                canonical.Append(view.IsOutOfDate ? '1' : '0');
                canonical.Append('|');
                canonical.Append(view.IsBroken ? '1' : '0');
                canonical.Append('|');
                canonical.Append(view.IsDecoration ? '1' : '0');
                canonical.Append('|');
                canonical.Append(view.IsSlave ? '1' : '0');
                canonical.Append('|');
            }
            return Sha256Hex(Encoding.UTF8.GetBytes(canonical.ToString()));
        }

        private static void AppendFingerprintDouble(
            StringBuilder canonical,
            double value)
        {
            canonical.Append(value.ToString("R", CultureInfo.InvariantCulture));
            canonical.Append('|');
        }

        private BridgeResult PreflightModeling(BridgeArguments arguments)
        {
            if (arguments == null ||
                string.IsNullOrWhiteSpace(arguments.PlannedOperation))
            {
                throw InvalidArgument("plannedOperation is required.");
            }
            string operation = arguments.PlannedOperation.Trim();
            if (!IsModelingOperation(operation) || !adapter.Supports(operation))
            {
                throw InvalidArgument(
                    "plannedOperation must name one advertised bounded modeling operation.");
            }

            ValidateModelingPreflight(operation, arguments);
            BridgeResult tree = GetFeatureTree();
            BridgeResult result = GetSessionState();
            result.PreflightPassed = true;
            result.PreflightId = "PF-" + Guid.NewGuid().ToString();
            result.PreflightUtc = DateTime.UtcNow.ToString("o");
            result.PlannedOperation = operation;
            result.FeatureTreeFingerprint = tree.FeatureTreeFingerprint;
            result.FeatureTreeTotalCount = tree.FeatureTreeTotalCount;
            result.FeatureTreeReturnedCount = tree.FeatureTreeReturnedCount;
            result.FeatureTreeTruncated = tree.FeatureTreeTruncated;
            result.Message =
                "Modeling preflight passed against the current work part. The operation was not executed; re-run preflight if NX state changes.";
            return result;
        }

        private void ValidateModelingPreflight(
            string operation,
            BridgeArguments arguments)
        {
            switch (operation)
            {
                case "create_block":
                    RequirePositive(arguments.Length, "length");
                    RequirePositive(arguments.Width, "width");
                    RequirePositive(arguments.Height, "height");
                    RequireCoordinate(arguments.OriginX, "originX");
                    RequireCoordinate(arguments.OriginY, "originY");
                    RequireCoordinate(arguments.OriginZ, "originZ");
                    RequireWorkPart("preflighting block creation");
                    return;
                case "create_rectangle_sketch":
                    RequirePositive(arguments.ProfileWidth, "profileWidth");
                    RequirePositive(arguments.ProfileHeight, "profileHeight");
                    RequireCoordinate(arguments.CenterX, "centerX");
                    RequireCoordinate(arguments.CenterY, "centerY");
                    RequireCoordinate(arguments.PlaneZ, "planeZ");
                    RequireWorkPart("preflighting rectangular sketch creation");
                    return;
                case "extrude_sketch":
                    ValidateExtrudePreflight(arguments);
                    return;
                case "revolve_sketch":
                    ValidateRevolvePreflight(arguments);
                    return;
                case "create_simple_through_hole":
                    ValidateHolePreflight(arguments);
                    return;
                case "boolean_bodies":
                    ValidateBooleanPreflight(arguments);
                    return;
                case "fillet_vertical_edges":
                    ValidateFilletPreflight(arguments);
                    return;
                default:
                    throw InvalidArgument("Unsupported plannedOperation.");
            }
        }

        private void ValidateExtrudePreflight(BridgeArguments arguments)
        {
            string identifier = RequireFeatureJournalIdentifier(
                arguments.SketchFeatureJournalIdentifier,
                "sketchFeatureJournalIdentifier");
            RequirePositive(arguments.Distance, "distance");
            Part workPart = RequireWorkPart("preflighting sketch extrusion");
            Sketch sketch = FindSketch(workPart, identifier);
            NXObject[] geometry = sketch.GetAllGeometry();
            if (geometry == null || geometry.Length == 0)
            {
                throw new BridgeFaultException(
                    "EMPTY_SKETCH",
                    "The selected sketch contains no geometry.",
                    false);
            }
        }

        private void ValidateRevolvePreflight(BridgeArguments arguments)
        {
            string identifier = RequireFeatureJournalIdentifier(
                arguments.SketchFeatureJournalIdentifier,
                "sketchFeatureJournalIdentifier");
            string direction = arguments.AxisDirection;
            if (!string.Equals(direction, "WCS_X", StringComparison.Ordinal) &&
                !string.Equals(direction, "WCS_Y", StringComparison.Ordinal))
            {
                throw InvalidArgument(
                    "axisDirection must be exactly WCS_X or WCS_Y.");
            }
            double originX = RequireCoordinateValue(
                arguments.AxisOriginX,
                "axisOriginX");
            double originY = RequireCoordinateValue(
                arguments.AxisOriginY,
                "axisOriginY");
            double originZ = RequireCoordinateValue(
                arguments.AxisOriginZ,
                "axisOriginZ");
            Part workPart = RequireWorkPart("preflighting sketch revolve");
            Sketch sketch = FindSketch(workPart, identifier);
            if (Math.Abs(sketch.Origin.Z - originZ) > 0.000001)
            {
                throw new BridgeFaultException(
                    "AXIS_NOT_IN_SKETCH_PLANE",
                    "The full-revolution axis origin must lie on the sketch's absolute XY plane.",
                    false);
            }
            NXObject[] geometry = sketch.GetAllGeometry();
            if (geometry == null || geometry.Length == 0)
            {
                throw new BridgeFaultException(
                    "EMPTY_SKETCH",
                    "The selected sketch contains no geometry.",
                    false);
            }
            EnsureRectangleProfileDoesNotCrossAxis(
                geometry,
                direction,
                originX,
                originY,
                originZ);
        }

        private void ValidateHolePreflight(BridgeArguments arguments)
        {
            double centerX = RequireCoordinateValue(
                arguments.HoleCenterX,
                "holeCenterX");
            double centerY = RequireCoordinateValue(
                arguments.HoleCenterY,
                "holeCenterY");
            double diameter = RequirePositive(
                arguments.HoleDiameter,
                "holeDiameter");
            Part workPart = RequireWorkPart("preflighting a through hole");
            List<Body> bodies = GetSolidBodies(workPart);
            if (bodies.Count != 1)
            {
                throw new BridgeFaultException(
                    "HOLE_REQUIRES_ONE_SOLID_BODY",
                    "A simple through hole requires exactly one solid body in the work part.",
                    false);
            }
            AbsoluteBounds bounds = ReadExactAbsoluteBounds(
                workPart,
                bodies[0],
                "through-hole preflight",
                "NX_HOLE_PREFLIGHT_FAILED");
            if (bounds.MaximumZ - bounds.MinimumZ <= 0.000001)
            {
                throw new BridgeFaultException(
                    "HOLE_BODY_HEIGHT_INVALID",
                    "The target body's absolute Z height is too small for a through hole.",
                    false);
            }
            SelectThroughHoleFaces(
                bodies[0],
                bounds,
                centerX,
                centerY,
                diameter);
        }

        private void ValidateBooleanPreflight(BridgeArguments arguments)
        {
            string operation = arguments.BooleanOperation;
            if (!string.Equals(operation, "UNITE", StringComparison.Ordinal) &&
                !string.Equals(operation, "SUBTRACT", StringComparison.Ordinal) &&
                !string.Equals(operation, "INTERSECT", StringComparison.Ordinal))
            {
                throw InvalidArgument(
                    "booleanOperation must be exactly UNITE, SUBTRACT, or INTERSECT.");
            }
            string targetIdentifier = RequireFeatureJournalIdentifier(
                arguments.TargetFeatureJournalIdentifier,
                "targetFeatureJournalIdentifier");
            string toolIdentifier = RequireFeatureJournalIdentifier(
                arguments.ToolFeatureJournalIdentifier,
                "toolFeatureJournalIdentifier");
            if (string.Equals(
                targetIdentifier,
                toolIdentifier,
                StringComparison.Ordinal))
            {
                throw new BridgeFaultException(
                    "BOOLEAN_REQUIRES_DISTINCT_FEATURES",
                    "Boolean target and tool feature identifiers must be different.",
                    false);
            }
            Part workPart = RequireWorkPart("preflighting a Boolean operation");
            Feature targetFeature = FindFeature(
                workPart,
                targetIdentifier,
                "BOOLEAN_TARGET_FEATURE_NOT_FOUND",
                "BOOLEAN_FEATURE_IDENTIFIER_AMBIGUOUS");
            Feature toolFeature = FindFeature(
                workPart,
                toolIdentifier,
                "BOOLEAN_TOOL_FEATURE_NOT_FOUND",
                "BOOLEAN_FEATURE_IDENTIFIER_AMBIGUOUS");
            Body targetBody = FindCurrentSolidBodyForFeature(
                workPart,
                targetFeature,
                "target",
                "BOOLEAN");
            Body toolBody = FindCurrentSolidBodyForFeature(
                workPart,
                toolFeature,
                "tool",
                "BOOLEAN");
            if (targetBody.Tag.Equals(toolBody.Tag))
            {
                throw new BridgeFaultException(
                    "BOOLEAN_REQUIRES_DISTINCT_BODIES",
                    "Boolean target and tool features resolve to the same current solid body.",
                    false);
            }
            AbsoluteBounds targetBounds = ReadExactAbsoluteBounds(
                workPart,
                targetBody,
                "Boolean target preflight",
                "NX_BOOLEAN_PREFLIGHT_FAILED");
            AbsoluteBounds toolBounds = ReadExactAbsoluteBounds(
                workPart,
                toolBody,
                "Boolean tool preflight",
                "NX_BOOLEAN_PREFLIGHT_FAILED");
            if (!BoundsHavePositiveOverlap(targetBounds, toolBounds))
            {
                throw new BridgeFaultException(
                    "BOOLEAN_BODIES_DO_NOT_OVERLAP",
                    "The selected target and tool bodies do not have a positive-volume overlap.",
                    false);
            }
        }

        private void ValidateFilletPreflight(BridgeArguments arguments)
        {
            string identifier = RequireFeatureJournalIdentifier(
                arguments.BodyFeatureJournalIdentifier,
                "bodyFeatureJournalIdentifier");
            double radius = RequirePositive(
                arguments.FilletRadius,
                "filletRadius");
            Part workPart = RequireWorkPart(
                "preflighting a vertical-edge fillet");
            Feature feature = FindFeature(
                workPart,
                identifier,
                "FILLET_BODY_FEATURE_NOT_FOUND",
                "FILLET_FEATURE_IDENTIFIER_AMBIGUOUS");
            Body body = FindCurrentSolidBodyForFeature(
                workPart,
                feature,
                "body",
                "FILLET");
            AbsoluteBounds bounds = ReadExactAbsoluteBounds(
                workPart,
                body,
                "vertical-edge fillet preflight",
                "NX_FILLET_PREFLIGHT_FAILED");
            const double tolerance = 0.000001;
            double sizeX = bounds.MaximumX - bounds.MinimumX;
            double sizeY = bounds.MaximumY - bounds.MinimumY;
            if (sizeX <= tolerance || sizeY <= tolerance)
            {
                throw new BridgeFaultException(
                    "FILLET_TRANSVERSE_BOUNDS_INVALID",
                    "The selected body has no positive absolute WCS X/Y transverse size.",
                    false);
            }
            if (radius >= Math.Min(sizeX, sizeY) / 2.0 - tolerance)
            {
                throw new BridgeFaultException(
                    "FILLET_RADIUS_TOO_LARGE",
                    "filletRadius must be strictly less than half the smaller exact absolute WCS X/Y body size.",
                    false);
            }
            int edgeCount = 0;
            foreach (Edge edge in body.GetEdges())
            {
                if (edge == null || edge.SolidEdgeType != Edge.EdgeType.Linear)
                {
                    continue;
                }
                Point3d first;
                Point3d second;
                edge.GetVertices(out first, out second);
                bool parallelToZ =
                    Math.Abs(first.X - second.X) <= tolerance &&
                    Math.Abs(first.Y - second.Y) <= tolerance;
                bool spansBounds =
                    (Math.Abs(first.Z - bounds.MinimumZ) <= tolerance &&
                     Math.Abs(second.Z - bounds.MaximumZ) <= tolerance) ||
                    (Math.Abs(second.Z - bounds.MinimumZ) <= tolerance &&
                     Math.Abs(first.Z - bounds.MaximumZ) <= tolerance);
                if (parallelToZ && spansBounds)
                {
                    edgeCount++;
                }
            }
            if (edgeCount != 4)
            {
                throw new BridgeFaultException(
                    "FILLET_REQUIRES_FOUR_VERTICAL_EDGES",
                    "The selected current solid body must expose exactly four full-height absolute-WCS Z edges.",
                    false);
            }
        }

        private BridgeResult GetFeatureTree()
        {
            Part workPart = RequireWorkPart("reading the feature tree");
            Feature[] all = workPart.Features.ToArray();
            StringBuilder canonical = new StringBuilder();
            List<FeatureTreeNode> returned = new List<FeatureTreeNode>();
            int start = Math.Max(0, all.Length - 128);
            for (int index = 0; index < all.Length; index++)
            {
                Feature feature = all[index];
                Feature[] parents = feature.GetParents() ?? new Feature[0];
                AppendFingerprintValue(canonical, feature.JournalIdentifier);
                AppendFingerprintValue(canonical, FeatureDisplayName(feature));
                AppendFingerprintValue(canonical, feature.FeatureType);
                canonical.Append(feature.Timestamp.ToString(CultureInfo.InvariantCulture));
                canonical.Append('|');
                canonical.Append(feature.Suppressed ? '1' : '0');
                canonical.Append('|');
                foreach (Feature parent in parents)
                {
                    AppendFingerprintValue(canonical, parent.JournalIdentifier);
                }

                if (index < start)
                {
                    continue;
                }
                int parentCount = Math.Min(parents.Length, 16);
                string[] parentIds = new string[parentCount];
                for (int parentIndex = 0;
                     parentIndex < parentCount;
                     parentIndex++)
                {
                    parentIds[parentIndex] =
                        parents[parentIndex].JournalIdentifier;
                }
                returned.Add(new FeatureTreeNode
                {
                    Index = index,
                    JournalIdentifier = feature.JournalIdentifier,
                    Name = FeatureDisplayName(feature),
                    FeatureType = feature.FeatureType ?? "unknown",
                    Timestamp = feature.Timestamp,
                    Suppressed = feature.Suppressed,
                    ParentJournalIdentifiers = parentIds,
                    ParentsTruncated = parents.Length > parentCount
                        ? (bool?)true
                        : null
                });
            }

            BridgeResult result = GetSessionState();
            result.FeatureTreeFingerprint = Sha256Hex(
                Encoding.UTF8.GetBytes(canonical.ToString()));
            result.FeatureTreeTotalCount = all.Length;
            result.FeatureTreeReturnedCount = returned.Count;
            result.FeatureTreeTruncated = all.Length > returned.Count;
            result.Features = returned.ToArray();
            result.Message =
                all.Length > returned.Count
                    ? "Read the feature tree without modifying NX; the response contains the latest 128 features and a fingerprint of the complete tree."
                    : "Read the complete feature tree without modifying NX.";
            return result;
        }

        private BridgeResult CaptureScreenshot(BridgeArguments arguments)
        {
            if (arguments == null ||
                string.IsNullOrWhiteSpace(arguments.FilePath))
            {
                throw InvalidArgument("filePath is required.");
            }
            Part workPart = RequireWorkPart("capturing screenshot evidence");
            Part displayPart = session.Parts.Display;
            if (displayPart == null || !displayPart.Tag.Equals(workPart.Tag))
            {
                throw new BridgeFaultException(
                    "WORK_DISPLAY_PART_MISMATCH",
                    "Screenshot evidence requires the work part to also be the displayed part.",
                    false);
            }

            bool modifiedBefore =
                UFSession.GetUFSession().Part.IsModified(workPart.Tag);
            FileAccessPolicy policy = FileAccessPolicy.Load();
            string target = policy.ValidatePngPath(
                arguments.FilePath,
                FilePathIntent.Create);
            string staging = Path.Combine(
                Path.GetDirectoryName(target),
                ".nx-codex-screenshot-staging-" +
                Guid.NewGuid().ToString("N") +
                ".png");
            staging = policy.ValidatePngPath(staging, FilePathIntent.Create);
            try
            {
                adapter.CapturePng(staging);
                if (!File.Exists(staging) || new FileInfo(staging).Length <= 0)
                {
                    throw new BridgeFaultException(
                        "NX_SCREENSHOT_FAILED",
                        "NX completed image capture without creating a non-empty PNG staging file.",
                        false);
                }
                FileInfo stagingInfo = new FileInfo(staging);
                if (!HasPngSignature(staging))
                {
                    throw new BridgeFaultException(
                        "NX_SCREENSHOT_INVALID",
                        "NX image capture did not produce a valid PNG signature.",
                        false);
                }
                if (stagingInfo.Length > int.MaxValue)
                {
                    throw new BridgeFaultException(
                        "SCREENSHOT_TOO_LARGE",
                        "The captured PNG exceeds the supported evidence size.",
                        false);
                }
                int screenshotBytes = (int)stagingInfo.Length;
                string screenshotSha256 = Sha256FileHex(staging);
                bool modifiedAfter =
                    UFSession.GetUFSession().Part.IsModified(workPart.Tag);
                if (modifiedAfter != modifiedBefore)
                {
                    throw new BridgeFaultException(
                        "SCREENSHOT_CHANGED_PART_STATE",
                        "Screenshot capture unexpectedly changed the work-part modified state.",
                        false);
                }
                if (File.Exists(target))
                {
                    throw new BridgeFaultException(
                        "TARGET_EXISTS",
                        "The screenshot destination appeared during capture; no overwrite was performed.",
                        false);
                }
                File.Move(staging, target);
                BridgeResult result = GetSessionState();
                result.FilePath = target;
                result.Captured = true;
                result.ScreenshotBytes = screenshotBytes;
                result.ScreenshotSha256 = screenshotSha256;
                result.Message =
                    "Captured the current NX graphics area as no-overwrite PNG evidence without changing the work part.";
                return result;
            }
            catch (BridgeFaultException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    "NX_SCREENSHOT_FAILED",
                    "NX failed to capture screenshot evidence: " + ex.Message,
                    false);
            }
            finally
            {
                try
                {
                    if (File.Exists(staging))
                    {
                        File.Delete(staging);
                    }
                }
                catch
                {
                }
            }
        }

        private static bool IsModelingOperation(string operation)
        {
            return string.Equals(operation, "create_block", StringComparison.Ordinal) ||
                string.Equals(operation, "create_rectangle_sketch", StringComparison.Ordinal) ||
                string.Equals(operation, "extrude_sketch", StringComparison.Ordinal) ||
                string.Equals(operation, "revolve_sketch", StringComparison.Ordinal) ||
                string.Equals(operation, "create_simple_through_hole", StringComparison.Ordinal) ||
                string.Equals(operation, "boolean_bodies", StringComparison.Ordinal) ||
                string.Equals(operation, "fillet_vertical_edges", StringComparison.Ordinal);
        }

        private static void AppendFingerprintValue(
            StringBuilder builder,
            string value)
        {
            string safe = value ?? string.Empty;
            builder.Append(safe.Length.ToString(CultureInfo.InvariantCulture));
            builder.Append(':');
            builder.Append(safe);
            builder.Append('|');
        }

        private static string Sha256FileHex(string filePath)
        {
            using (FileStream stream = File.OpenRead(filePath))
            using (SHA256 hash = SHA256.Create())
            {
                return Hex(hash.ComputeHash(stream));
            }
        }

        private static bool HasPngSignature(string filePath)
        {
            byte[] expected = { 137, 80, 78, 71, 13, 10, 26, 10 };
            using (FileStream stream = File.OpenRead(filePath))
            {
                if (stream.Length < expected.Length)
                {
                    return false;
                }
                for (int index = 0; index < expected.Length; index++)
                {
                    if (stream.ReadByte() != expected[index])
                    {
                        return false;
                    }
                }
            }
            return true;
        }

        private static string Sha256Hex(byte[] data)
        {
            using (SHA256 hash = SHA256.Create())
            {
                return Hex(hash.ComputeHash(data));
            }
        }

        private static string Hex(byte[] bytes)
        {
            StringBuilder text = new StringBuilder(bytes.Length * 2);
            foreach (byte value in bytes)
            {
                text.Append(value.ToString("x2", CultureInfo.InvariantCulture));
            }
            return text.ToString();
        }

        private BridgeResult NewPart(BridgeArguments arguments)
        {
            EnsureNoPendingTransactions("creating a new part");
            string path = RequirePartPath(arguments, FilePathIntent.Create);
            string units = arguments == null ? null : arguments.PartUnits;
            Part.Units partUnits;
            if (string.Equals(
                units,
                "Millimeters",
                StringComparison.Ordinal))
            {
                partUnits = Part.Units.Millimeters;
            }
            else if (string.Equals(
                units,
                "Inches",
                StringComparison.Ordinal))
            {
                partUnits = Part.Units.Inches;
            }
            else
            {
                throw InvalidArgument(
                    "partUnits must be Millimeters or Inches.");
            }

            try
            {
                FileAccessPolicy.Load().ValidatePartPath(
                    path,
                    FilePathIntent.Create);
                session.Parts.NewDisplay(path, partUnits);
                BridgeResult result = GetSessionState();
                result.FilePath = path;
                result.Opened = true;
                result.Saved = false;
                result.Message =
                    "Created a new unsaved part. No file was written.";
                return result;
            }
            catch (BridgeFaultException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    "NX_NEW_PART_FAILED",
                    "NX failed to create the part: " + ex.Message,
                    false);
            }
        }

        private BridgeResult OpenPart(BridgeArguments arguments)
        {
            EnsureNoPendingTransactions("opening another part");
            string path = RequirePartPath(arguments, FilePathIntent.Open);
            PartLoadStatus loadStatus = null;
            try
            {
                path = FileAccessPolicy.Load().ValidatePartPath(
                    path,
                    FilePathIntent.Open);
                session.Parts.OpenDisplay(path, out loadStatus);
                BridgeResult result = GetSessionState();
                result.FilePath = path;
                result.Opened = true;
                result.LoadWarnings = ReadLoadWarnings(loadStatus);
                result.Message =
                    result.LoadWarnings.Length == 0
                        ? "Opened the NX part."
                        : "Opened the NX part with load warnings.";
                return result;
            }
            catch (BridgeFaultException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    "NX_OPEN_PART_FAILED",
                    "NX failed to open the part: " + ex.Message,
                    false);
            }
            finally
            {
                FreeLoadStatus(loadStatus);
            }
        }

        private BridgeResult SaveAs(BridgeArguments arguments)
        {
            string target = RequirePartPath(
                arguments,
                FilePathIntent.Create);
            Part workPart = session.Parts.Work;
            if (workPart == null)
            {
                throw new BridgeFaultException(
                    "NO_WORK_PART",
                    "Open or create an NX work part before saving.",
                    false);
            }

            FileAccessPolicy policy = FileAccessPolicy.Load();
            target = policy.ValidatePartPath(
                target,
                FilePathIntent.Create);
            string staging = Path.Combine(
                Path.GetDirectoryName(target),
                ".nx-codex-staging-" +
                Guid.NewGuid().ToString("N") +
                ".prt");
            staging = policy.ValidatePartPath(
                staging,
                FilePathIntent.Create);

            PartSaveStatus saveStatus = null;
            try
            {
                target = policy.ValidatePartPath(
                    target,
                    FilePathIntent.Create);
                saveStatus = workPart.SaveAs(staging);
                if (saveStatus != null &&
                    (saveStatus.NumberUnsavedParts > 0 ||
                     saveStatus.NumberUnsavedObjects > 0))
                {
                    throw new BridgeFaultException(
                        "NX_SAVE_INCOMPLETE",
                        "NX reported unsaved parts or objects. A recovery copy may remain at " +
                        staging,
                        false);
                }
            }
            catch (BridgeFaultException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    "NX_SAVE_AS_FAILED",
                    "NX failed to write the staging part. A recovery file may remain at " +
                    staging + ". " + ex.Message,
                    false);
            }
            finally
            {
                FreeSaveStatus(saveStatus);
            }

            if (!File.Exists(staging))
            {
                throw new BridgeFaultException(
                    "NX_SAVE_AS_FAILED",
                    "NX did not create the expected staging file.",
                    false);
            }

            try
            {
                workPart.Close(
                    BasePart.CloseWholeTree.False,
                    BasePart.CloseModified.DontCloseModified,
                    null);
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    "NX_SAVE_CLOSE_FAILED",
                    "The staging file was saved but NX could not close the work part. Recovery file: " +
                    staging + ". " + ex.Message,
                    false);
            }

            try
            {
                target = policy.ValidatePartPath(
                    target,
                    FilePathIntent.Create);
                File.Move(staging, target);
            }
            catch (Exception ex)
            {
                TryOpenRecovery(staging);
                string code = File.Exists(target)
                    ? "TARGET_EXISTS"
                    : "ATOMIC_MOVE_FAILED";
                throw new BridgeFaultException(
                    code,
                    "The no-overwrite atomic move failed. The saved recovery part is at " +
                    staging + ". " + ex.Message,
                    false);
            }

            PartLoadStatus loadStatus = null;
            try
            {
                session.Parts.OpenDisplay(target, out loadStatus);
                transactions.Clear();
                BridgeResult result = GetSessionState();
                result.FilePath = target;
                result.Saved = true;
                result.Opened = true;
                result.LoadWarnings = ReadLoadWarnings(loadStatus);
                result.Message =
                    "Saved without overwrite and reopened the part. Prior transaction IDs were invalidated.";
                return result;
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    "SAVE_AS_REOPEN_FAILED",
                    "The part was safely saved at " + target +
                    " but NX could not reopen it: " + ex.Message,
                    false);
            }
            finally
            {
                FreeLoadStatus(loadStatus);
            }
        }

        private BridgeResult ClosePart()
        {
            EnsureNoPendingTransactions("closing the work part");
            Part workPart = session.Parts.Work;
            if (workPart == null)
            {
                throw new BridgeFaultException(
                    "NO_WORK_PART",
                    "There is no NX work part to close.",
                    false);
            }
            bool modified;
            try
            {
                modified =
                    UFSession.GetUFSession().Part.IsModified(workPart.Tag);
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    "MODIFIED_STATE_UNKNOWN",
                    "NX could not verify whether the work part is modified: " +
                    ex.Message,
                    false);
            }
            if (modified)
            {
                throw new BridgeFaultException(
                    "UNSAVED_CHANGES",
                    "The work part has unsaved changes and cannot be closed. No force-discard option is exposed.",
                    false);
            }

            string closedPath = DescribePart(workPart);
            try
            {
                workPart.Close(
                    BasePart.CloseWholeTree.False,
                    BasePart.CloseModified.DontCloseModified,
                    null);
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    "NX_CLOSE_PART_FAILED",
                    "NX failed to close the work part: " + ex.Message,
                    false);
            }
            BridgeResult result = GetSessionState();
            result.FilePath = closedPath;
            result.Closed = true;
            result.Message =
                "Closed the unmodified work part without discarding changes.";
            return result;
        }

        private BridgeResult CreateBlock(BridgeArguments arguments)
        {
            if (arguments == null)
            {
                throw InvalidArgument("Arguments are required.");
            }

            double length = RequirePositive(arguments.Length, "length");
            double width = RequirePositive(arguments.Width, "width");
            double height = RequirePositive(arguments.Height, "height");
            double originX = RequireCoordinate(arguments.OriginX, "originX");
            double originY = RequireCoordinate(arguments.OriginY, "originY");
            double originZ = RequireCoordinate(arguments.OriginZ, "originZ");

            Part workPart = session.Parts.Work;
            if (workPart == null)
            {
                throw new BridgeFaultException(
                    "NO_WORK_PART",
                    "Open or create an NX work part before creating geometry.",
                    false);
            }

            Session.UndoMarkId undoMark = session.SetUndoMark(
                Session.MarkVisibility.Visible,
                "NX Codex: create block");
            BlockFeatureBuilder builder = null;

            try
            {
                builder = workPart.Features.CreateBlockFeatureBuilder(null);
                builder.SetBooleanOperationAndTarget(
                    Feature.BooleanType.Create,
                    null);
                builder.SetOriginAndLengths(
                    new Point3d(originX, originY, originZ),
                    Expression(length),
                    Expression(width),
                    Expression(height));

                Feature feature = builder.CommitFeature();
                if (!string.IsNullOrWhiteSpace(arguments.Name))
                {
                    feature.SetName(arguments.Name.Trim());
                }

                string transactionId = "TX-" + Guid.NewGuid().ToString();
                session.SetUndoMarkName(
                    undoMark,
                    "NX Codex: " + transactionId);
                transactions.Add(
                    new TransactionRecord(transactionId, undoMark));

                BridgeResult result = GetSessionState();
                result.TransactionId = transactionId;
                result.FeatureJournalIdentifier = feature.JournalIdentifier;
                result.FeatureName =
                    string.IsNullOrWhiteSpace(feature.Name)
                        ? feature.JournalIdentifier
                        : feature.Name;
                result.Message =
                    "Created block. The work part was not saved.";
                return result;
            }
            catch (BridgeFaultException)
            {
                TryRollback(undoMark);
                throw;
            }
            catch (Exception ex)
            {
                TryRollback(undoMark);
                throw new BridgeFaultException(
                    "NX_OPERATION_FAILED",
                    "NX failed to create the block: " + ex.Message,
                    false);
            }
            finally
            {
                if (builder != null)
                {
                    try
                    {
                        builder.Destroy();
                    }
                    catch
                    {
                    }
                }
            }
        }

        private BridgeResult CreateTestDrawing(BridgeArguments arguments)
        {
            EnsureNoPendingTransactions("creating the test drawing");
            Part workPart = RequireWorkPart("creating the test drawing");
            Part displayPart = session.Parts.Display;
            if (displayPart == null || displayPart.Tag != workPart.Tag)
            {
                throw new BridgeFaultException(
                    "WORK_PART_NOT_DISPLAYED",
                    "The test drawing can only be created when the expected work part is also the displayed part.",
                    false);
            }

            string expectedPath = RequirePartPath(
                arguments,
                FilePathIntent.Open);
            if (string.IsNullOrWhiteSpace(workPart.FullPath))
            {
                throw new BridgeFaultException(
                    "UNSAVED_WORK_PART",
                    "Save the protected test copy before creating its drawing sheet.",
                    false);
            }
            string actualPath = FileAccessPolicy.Load().ValidatePartPath(
                workPart.FullPath,
                FilePathIntent.Open);
            if (!string.Equals(
                actualPath,
                expectedPath,
                StringComparison.OrdinalIgnoreCase))
            {
                throw new BridgeFaultException(
                    "WORK_PART_MISMATCH",
                    "The displayed work part does not exactly match expectedWorkPartPath.",
                    false);
            }

            if (UFSession.GetUFSession().Part.IsModified(workPart.Tag))
            {
                throw new BridgeFaultException(
                    "WORK_PART_ALREADY_MODIFIED",
                    "The protected test copy must be saved and unmodified before creating the test drawing.",
                    false);
            }
            if (workPart.PartUnits != BasePart.Units.Millimeters)
            {
                throw new BridgeFaultException(
                    "UNSUPPORTED_PART_UNITS",
                    "The bounded test drawing operation supports only millimeter work parts.",
                    false);
            }

            string applicationName = session.ApplicationName ?? string.Empty;
            if (applicationName.IndexOf(
                "DRAFT",
                StringComparison.OrdinalIgnoreCase) < 0)
            {
                throw new BridgeFaultException(
                    "DRAFTING_APPLICATION_NOT_ACTIVE",
                    "Switch NX to Drafting before creating the test drawing. The bridge will not switch applications.",
                    false);
            }
            ModuleCapabilityDetection capability =
                adapter.DetectModuleCapability(session, "drafting");
            if (!capability.Available || !capability.Licensed)
            {
                throw new BridgeFaultException(
                    "DRAFTING_LICENSE_NOT_ACTIVE",
                    "An already-active drafting license is required. The bridge did not reserve or release a license.",
                    false);
            }

            DrawingSheet[] existingSheets =
                workPart.DrawingSheets.ToArray() ?? new DrawingSheet[0];
            DraftingDrawingSheet[] existingDraftingSheets =
                workPart.DraftingDrawingSheets.ToArray() ??
                new DraftingDrawingSheet[0];
            DraftingView[] existingViews =
                workPart.DraftingViews.ToArray() ?? new DraftingView[0];
            if (existingSheets.Length != 0 ||
                existingDraftingSheets.Length != 0 ||
                existingViews.Length != 0)
            {
                throw new BridgeFaultException(
                    "EXISTING_DRAFTING_CONTENT",
                    "The bounded test operation only accepts a protected copy with zero drawing sheets and zero drafting views.",
                    false);
            }

            ModelingView sourceView = workPart.ModelingViews.WorkView;
            if (sourceView == null)
            {
                ModelingView[] modelViews =
                    workPart.ModelingViews.ToArray() ?? new ModelingView[0];
                if (modelViews.Length > 0)
                {
                    sourceView = modelViews[0];
                }
            }
            if (sourceView == null)
            {
                throw new BridgeFaultException(
                    "MODEL_VIEW_NOT_AVAILABLE",
                    "The work part has no model view that can be imported as a base drafting view.",
                    false);
            }

            BridgeResult before = GetSessionState();
            Session.UndoMarkId undoMark = session.SetUndoMark(
                Session.MarkVisibility.Visible,
                "NX Codex: create protected test drawing");
            BaseViewBuilder builder = null;
            try
            {
                DraftingDrawingSheet sheet =
                    workPart.DraftingDrawingSheets.InsertSheet(
                        "NX_CODEX_TEST_A4",
                        DrawingSheet.Unit.Millimeters,
                        297.0,
                        210.0,
                        1.0,
                        1.0,
                        DrawingSheet.ProjectionAngleType.ThirdAngle);
                if (sheet == null)
                {
                    throw new BridgeFaultException(
                        "DRAFTING_POSTCONDITION_FAILED",
                        "NX did not return the created drawing sheet.",
                        false);
                }

                builder = workPart.DraftingViews.CreateBaseViewBuilder(null);
                builder.SelectModelView.SelectedView = sourceView;
                builder.Scale.ScaleType = ViewScaleBuilder.Type.Ratio;
                builder.Scale.Numerator = 1.0;
                builder.Scale.Denominator = 1.0;
                builder.Placement.Placement.SetValue(
                    null,
                    sourceView,
                    new Point3d(148.5, 105.0, 0.0));

                NXObject committed = builder.Commit();
                BaseView createdView = committed as BaseView;
                if (createdView == null)
                {
                    throw new BridgeFaultException(
                        "DRAFTING_POSTCONDITION_FAILED",
                        "NX did not return the created base drafting view.",
                        false);
                }

                BridgeResult result = GetDraftingStructure(
                    new BridgeArguments
                    {
                        MaxSheets = 1,
                        MaxViews = 1
                    });
                if (result.DraftingReadAvailable != true ||
                    result.SheetCount != 1 ||
                    result.ReturnedSheetCount != 1 ||
                    result.ViewCount != 1 ||
                    result.ReturnedViewCount != 1 ||
                    result.Sheets == null ||
                    result.Sheets.Length != 1 ||
                    result.Views == null ||
                    result.Views.Length != 1 ||
                    !string.Equals(
                        result.Sheets[0].Name,
                        "NX_CODEX_TEST_A4",
                        StringComparison.Ordinal) ||
                    result.BodyCount != before.BodyCount ||
                    result.SolidBodyCount != before.SolidBodyCount)
                {
                    throw new BridgeFaultException(
                        "DRAFTING_POSTCONDITION_FAILED",
                        "The created drawing did not satisfy the exact one-sheet/one-view and unchanged-body postconditions.",
                        false);
                }

                result.TransactionId = RecordTransaction(
                    undoMark,
                    "create protected test drawing");
                result.Message =
                    "Created one A4 millimeter test sheet and one base view in the exact protected copy using fixed ratio and placement requests. Reported sheet/view metadata contains the actual values accepted by NX. The work part was not saved or explicitly updated.";
                return result;
            }
            catch (BridgeFaultException)
            {
                TryRollback(undoMark);
                throw;
            }
            catch (Exception ex)
            {
                TryRollback(undoMark);
                throw new BridgeFaultException(
                    "NX_DRAFTING_CREATE_FAILED",
                    "NX failed to create the protected test drawing: " +
                    ex.Message,
                    false);
            }
            finally
            {
                DestroyBuilder(builder);
            }
        }

        private BridgeResult CreateRectangleSketch(BridgeArguments arguments)
        {
            if (arguments == null)
            {
                throw InvalidArgument("Arguments are required.");
            }

            double width = RequirePositive(
                arguments.ProfileWidth,
                "profileWidth");
            double height = RequirePositive(
                arguments.ProfileHeight,
                "profileHeight");
            double centerX = RequireCoordinate(arguments.CenterX, "centerX");
            double centerY = RequireCoordinate(arguments.CenterY, "centerY");
            double planeZ = RequireCoordinate(arguments.PlaneZ, "planeZ");
            Part workPart = RequireWorkPart(
                "creating a rectangular sketch");

            Session.UndoMarkId undoMark = session.SetUndoMark(
                Session.MarkVisibility.Visible,
                "NX Codex: create rectangle sketch");
            SketchInPlaceBuilder builder = null;
            string stage = "creating the support plane";

            try
            {
                Plane plane = workPart.Planes.CreatePlane(
                    new Point3d(centerX, centerY, planeZ),
                    new Vector3d(0.0, 0.0, 1.0),
                    SmartObject.UpdateOption.WithinModeling);
                stage = "configuring the NX 12 sketch builder";
                string sketchName =
                    string.IsNullOrWhiteSpace(arguments.Name)
                        ? "NX_CODEX_RECTANGLE_SKETCH"
                        : arguments.Name.Trim();
                builder = workPart.Sketches.CreateSketchInPlaceBuilder2(null);
                builder.PlaneOption = Sketch.PlaneOption.ExistingPlane;
                builder.PlaneReference = plane;
                builder.AxisOrientation = AxisOrientation.Horizontal;
                stage = "committing the empty sketch";
                Sketch sketch = builder.Commit() as Sketch;
                if (sketch == null)
                {
                    throw new BridgeFaultException(
                        "NX_SKETCH_COMMIT_FAILED",
                        "NX did not return a committed sketch.",
                        false);
                }
                sketch.SetName(sketchName);

                Point3d[] points =
                {
                    new Point3d(
                        centerX - width / 2.0,
                        centerY - height / 2.0,
                        planeZ),
                    new Point3d(
                        centerX + width / 2.0,
                        centerY - height / 2.0,
                        planeZ),
                    new Point3d(
                        centerX + width / 2.0,
                        centerY + height / 2.0,
                        planeZ),
                    new Point3d(
                        centerX - width / 2.0,
                        centerY + height / 2.0,
                        planeZ)
                };

                stage = "activating the sketch";
                sketch.Activate(Sketch.ViewReorient.False);
                stage = "adding rectangle curves";
                for (int index = 0; index < 4; index++)
                {
                    Line line = workPart.Curves.CreateLine(
                        points[index],
                        points[(index + 1) % 4]);
                    sketch.AddGeometry(
                        line,
                        Sketch.InferConstraintsOption.InferCoincidentConstraints);
                }
                stage = "updating the sketch";
                sketch.Update();
                stage = "deactivating the sketch";
                sketch.Deactivate(
                    Sketch.ViewReorient.False,
                    Sketch.UpdateLevel.Model);

                Feature feature = sketch.Feature;
                if (feature == null)
                {
                    throw new BridgeFaultException(
                        "NX_SKETCH_FEATURE_MISSING",
                        "NX committed the sketch without a feature handle.",
                        false);
                }
                if (!string.IsNullOrWhiteSpace(arguments.Name))
                {
                    feature.SetName(arguments.Name.Trim());
                }

                string transactionId = RecordTransaction(
                    undoMark,
                    "create rectangle sketch");
                BridgeResult result = GetSessionState();
                result.TransactionId = transactionId;
                result.FeatureJournalIdentifier = feature.JournalIdentifier;
                result.FeatureName = FeatureDisplayName(feature);
                result.CurveCount = sketch.GetAllGeometry().Length;
                result.Message =
                    "Created a four-line rectangular sketch on the absolute XY plane. The sketch is not fully constrained and the work part was not saved.";
                return result;
            }
            catch (BridgeFaultException)
            {
                TryRollback(undoMark);
                throw;
            }
            catch (Exception ex)
            {
                TryRollback(undoMark);
                throw new BridgeFaultException(
                    "NX_SKETCH_FAILED",
                    "NX failed while " + stage +
                    " for the rectangular sketch: " +
                    ex.Message,
                    false);
            }
            finally
            {
                DestroyBuilder(builder);
            }
        }

        private BridgeResult ExtrudeSketch(BridgeArguments arguments)
        {
            if (arguments == null)
            {
                throw InvalidArgument("Arguments are required.");
            }
            string journalIdentifier =
                arguments.SketchFeatureJournalIdentifier;
            if (string.IsNullOrWhiteSpace(journalIdentifier) ||
                journalIdentifier.Length > 1024)
            {
                throw InvalidArgument(
                    "sketchFeatureJournalIdentifier is required and must be at most 1024 characters.");
            }
            double distance = RequirePositive(arguments.Distance, "distance");
            Part workPart = RequireWorkPart("extruding a sketch");
            Sketch sketch = FindSketch(
                workPart,
                journalIdentifier.Trim());

            NXObject[] geometry = sketch.GetAllGeometry();
            if (geometry == null || geometry.Length == 0)
            {
                throw new BridgeFaultException(
                    "EMPTY_SKETCH",
                    "The selected sketch contains no geometry.",
                    false);
            }
            Session.UndoMarkId undoMark = session.SetUndoMark(
                Session.MarkVisibility.Visible,
                "NX Codex: extrude sketch");
            ExtrudeBuilder builder = null;
            Section section = null;

            try
            {
                builder = workPart.Features.CreateExtrudeBuilder(null);
                section = workPart.Sections.CreateSection(0.0095, 0.01, 0.5);
                section.SetAllowedEntityTypes(Section.AllowTypes.OnlyCurves);
                section.AllowSelfIntersection(false);
                builder.Section = section;
                builder.BooleanOperation.Type =
                    NXOpen.GeometricUtilities.BooleanOperation.BooleanType.Create;
                builder.Direction = workPart.Directions.CreateDirection(
                    sketch,
                    Sense.Forward,
                    SmartObject.UpdateOption.WithinModeling);
                builder.Limits.StartExtend.Value.RightHandSide = "0";
                builder.Limits.EndExtend.Value.RightHandSide =
                    Expression(distance);

                CurveFeatureRule rule =
                    ((BasePart)workPart).ScRuleFactory.CreateRuleCurveFeature(
                        new Feature[] { sketch.Feature });
                section.AddToSection(
                    new SelectionIntentRule[] { rule },
                    geometry[0],
                    null,
                    null,
                    sketch.Origin,
                    Section.Mode.Create,
                    false);

                Feature feature = builder.CommitFeature();
                if (!string.IsNullOrWhiteSpace(arguments.Name))
                {
                    feature.SetName(arguments.Name.Trim());
                }

                string transactionId = RecordTransaction(
                    undoMark,
                    "extrude sketch");
                BridgeResult result = GetSessionState();
                result.TransactionId = transactionId;
                result.FeatureJournalIdentifier = feature.JournalIdentifier;
                result.FeatureName = FeatureDisplayName(feature);
                result.Message =
                    "Extruded the selected sketch as a new solid in the positive sketch-normal direction. The work part was not saved.";
                return result;
            }
            catch (BridgeFaultException)
            {
                TryRollback(undoMark);
                throw;
            }
            catch (Exception ex)
            {
                TryRollback(undoMark);
                throw new BridgeFaultException(
                    "NX_EXTRUDE_FAILED",
                    "NX failed to extrude the sketch: " + ex.Message,
                    false);
            }
            finally
            {
                DestroyBuilder(builder);
                if (section != null)
                {
                    try
                    {
                        section.Destroy();
                    }
                    catch
                    {
                    }
                }
            }
        }

        private BridgeResult RevolveSketch(BridgeArguments arguments)
        {
            if (arguments == null)
            {
                throw InvalidArgument("Arguments are required.");
            }
            string journalIdentifier =
                arguments.SketchFeatureJournalIdentifier;
            if (string.IsNullOrWhiteSpace(journalIdentifier) ||
                journalIdentifier.Length > 1024)
            {
                throw InvalidArgument(
                    "sketchFeatureJournalIdentifier is required and must be at most 1024 characters.");
            }

            string axisDirection = arguments.AxisDirection;
            if (!string.Equals(
                    axisDirection,
                    "WCS_X",
                    StringComparison.Ordinal) &&
                !string.Equals(
                    axisDirection,
                    "WCS_Y",
                    StringComparison.Ordinal))
            {
                throw InvalidArgument(
                    "axisDirection must be exactly WCS_X or WCS_Y.");
            }

            double axisOriginX = RequireCoordinateValue(
                arguments.AxisOriginX,
                "axisOriginX");
            double axisOriginY = RequireCoordinateValue(
                arguments.AxisOriginY,
                "axisOriginY");
            double axisOriginZ = RequireCoordinateValue(
                arguments.AxisOriginZ,
                "axisOriginZ");
            Part workPart = RequireWorkPart("revolving a sketch");
            Sketch sketch = FindSketch(
                workPart,
                journalIdentifier.Trim());

            if (Math.Abs(sketch.Origin.Z - axisOriginZ) > 0.000001)
            {
                throw new BridgeFaultException(
                    "AXIS_NOT_IN_SKETCH_PLANE",
                    "The full-revolution axis origin must lie on the sketch's absolute XY plane.",
                    false);
            }

            NXObject[] geometry = sketch.GetAllGeometry();
            if (geometry == null || geometry.Length == 0)
            {
                throw new BridgeFaultException(
                    "EMPTY_SKETCH",
                    "The selected sketch contains no geometry.",
                    false);
            }
            EnsureRectangleProfileDoesNotCrossAxis(
                geometry,
                axisDirection,
                axisOriginX,
                axisOriginY,
                axisOriginZ);

            Session.UndoMarkId undoMark = session.SetUndoMark(
                Session.MarkVisibility.Visible,
                "NX Codex: revolve sketch");
            string stage = "preparing the NX 12 UF revolve input";
            int beforeBodyCount = workPart.Bodies.ToArray().Length;

            try
            {
                Tag[] generatorTags = new Tag[geometry.Length];
                for (int index = 0; index < geometry.Length; index++)
                {
                    generatorTags[index] = geometry[index].Tag;
                }
                double[] axisPoint =
                {
                    axisOriginX,
                    axisOriginY,
                    axisOriginZ
                };
                double[] axisDirectionVector = string.Equals(
                    axisDirection,
                    "WCS_X",
                    StringComparison.Ordinal)
                        ? new double[] { 1.0, 0.0, 0.0 }
                        : new double[] { 0.0, 1.0, 0.0 };
                Tag[] featureTags;
                stage = "creating the full revolve with UF_MODL_create_revolved";
                adapter.CreateRevolved(
                    generatorTags,
                    new string[] { "0", "360" },
                    axisPoint,
                    axisDirectionVector,
                    FeatureSigns.Nullsign,
                    out featureTags);

                if (featureTags == null || featureTags.Length != 1)
                {
                    throw new BridgeFaultException(
                        "REVOLVE_RESULT_INVALID",
                        "NX did not return exactly one revolved feature.",
                        false);
                }
                Feature feature = null;
                foreach (Feature candidate in workPart.Features.ToArray())
                {
                    if (candidate.Tag.Equals(featureTags[0]))
                    {
                        feature = candidate;
                        break;
                    }
                }
                if (feature == null)
                {
                    throw new BridgeFaultException(
                        "REVOLVE_FEATURE_MISSING",
                        "NX created a revolve tag that was not present in the work-part feature collection.",
                        false);
                }
                if (!string.IsNullOrWhiteSpace(arguments.Name))
                {
                    feature.SetName(arguments.Name.Trim());
                }

                if (workPart.Bodies.ToArray().Length != beforeBodyCount + 1)
                {
                    throw new BridgeFaultException(
                        "REVOLVE_BODY_COUNT_INVALID",
                        "The full revolve did not create exactly one new body.",
                        false);
                }
                string transactionId = RecordTransaction(
                    undoMark,
                    "revolve sketch");
                BridgeResult result = GetSessionState();
                result.TransactionId = transactionId;
                result.FeatureJournalIdentifier = feature.JournalIdentifier;
                result.FeatureName = FeatureDisplayName(feature);
                result.Message =
                    "Revolved the selected sketch through 360 degrees about the requested absolute WCS axis as a new solid. The work part was not saved.";
                return result;
            }
            catch (BridgeFaultException)
            {
                TryRollback(undoMark);
                throw;
            }
            catch (Exception ex)
            {
                TryRollback(undoMark);
                throw new BridgeFaultException(
                    "NX_REVOLVE_FAILED",
                    "NX failed while " + stage + ": " + ex.Message,
                    false);
            }
        }

        private BridgeResult CreateSimpleThroughHole(
            BridgeArguments arguments)
        {
            if (arguments == null)
            {
                throw InvalidArgument("Arguments are required.");
            }

            double centerX = RequireCoordinateValue(
                arguments.HoleCenterX,
                "holeCenterX");
            double centerY = RequireCoordinateValue(
                arguments.HoleCenterY,
                "holeCenterY");
            double diameter = RequirePositive(
                arguments.HoleDiameter,
                "holeDiameter");
            Part workPart = RequireWorkPart("creating a through hole");
            List<Body> solidBodies = GetSolidBodies(workPart);
            if (solidBodies.Count != 1)
            {
                throw new BridgeFaultException(
                    "HOLE_REQUIRES_ONE_SOLID_BODY",
                    "A simple through hole requires exactly one solid body in the work part.",
                    false);
            }

            Body targetBody = solidBodies[0];
            AbsoluteBounds bounds = ReadExactAbsoluteBounds(
                workPart,
                targetBody,
                "through-hole preflight",
                "NX_HOLE_PREFLIGHT_FAILED");
            double bodyHeight = bounds.MaximumZ - bounds.MinimumZ;
            if (bodyHeight <= 0.000001)
            {
                throw new BridgeFaultException(
                    "HOLE_BODY_HEIGHT_INVALID",
                    "The target body's absolute Z height is too small for a through hole.",
                    false);
            }

            HoleFaceSelection faces = SelectThroughHoleFaces(
                targetBody,
                bounds,
                centerX,
                centerY,
                diameter);
            int beforeFeatureCount = workPart.Features.ToArray().Length;
            int beforeBodyCount = solidBodies.Count;
            Session.UndoMarkId undoMark = session.SetUndoMark(
                Session.MarkVisibility.Visible,
                "NX Codex: create simple through hole");
            string stage = "preparing the NX 12 UF simple-hole input";

            try
            {
                Tag featureTag;
                stage = "creating the semantic through hole with UF_MODL_create_simple_hole";
                adapter.CreateSimpleHole(
                    new double[] { centerX, centerY, bounds.MaximumZ },
                    new double[] { 0.0, 0.0, -1.0 },
                    Expression(diameter),
                    Expression(bodyHeight),
                    "118",
                    faces.StartFace.Tag,
                    faces.ThroughFace.Tag,
                    out featureTag);

                Feature feature = null;
                foreach (Feature candidate in workPart.Features.ToArray())
                {
                    if (candidate.Tag.Equals(featureTag))
                    {
                        feature = candidate;
                        break;
                    }
                }
                if (feature == null)
                {
                    throw new BridgeFaultException(
                        "HOLE_FEATURE_MISSING",
                        "NX created a hole tag that was not present in the work-part feature collection.",
                        false);
                }
                if (!string.IsNullOrWhiteSpace(arguments.Name))
                {
                    feature.SetName(arguments.Name.Trim());
                }

                if (workPart.Features.ToArray().Length !=
                    beforeFeatureCount + 1)
                {
                    throw new BridgeFaultException(
                        "HOLE_FEATURE_COUNT_INVALID",
                        "The simple through-hole operation did not create exactly one new feature.",
                        false);
                }
                if (GetSolidBodies(workPart).Count != beforeBodyCount)
                {
                    throw new BridgeFaultException(
                        "HOLE_BODY_COUNT_INVALID",
                        "The simple through hole unexpectedly changed the number of solid bodies.",
                        false);
                }

                string transactionId = RecordTransaction(
                    undoMark,
                    "create simple through hole");
                BridgeResult result = GetSessionState();
                result.TransactionId = transactionId;
                result.FeatureJournalIdentifier = feature.JournalIdentifier;
                result.FeatureName = FeatureDisplayName(feature);
                result.Message =
                    "Created a semantic simple hole from the unique absolute-Z top face through the unique bottom face. The work part was not saved.";
                return result;
            }
            catch (BridgeFaultException)
            {
                TryRollback(undoMark);
                throw;
            }
            catch (Exception ex)
            {
                TryRollback(undoMark);
                throw new BridgeFaultException(
                    "NX_HOLE_FAILED",
                    "NX failed while " + stage + ": " + ex.Message,
                    false);
            }
        }

        private BridgeResult BooleanBodies(BridgeArguments arguments)
        {
            if (arguments == null)
            {
                throw InvalidArgument("Arguments are required.");
            }

            string operation = arguments.BooleanOperation;
            if (!string.Equals(operation, "UNITE", StringComparison.Ordinal) &&
                !string.Equals(operation, "SUBTRACT", StringComparison.Ordinal) &&
                !string.Equals(operation, "INTERSECT", StringComparison.Ordinal))
            {
                throw InvalidArgument(
                    "booleanOperation must be exactly UNITE, SUBTRACT, or INTERSECT.");
            }
            string targetIdentifier = RequireFeatureJournalIdentifier(
                arguments.TargetFeatureJournalIdentifier,
                "targetFeatureJournalIdentifier");
            string toolIdentifier = RequireFeatureJournalIdentifier(
                arguments.ToolFeatureJournalIdentifier,
                "toolFeatureJournalIdentifier");
            if (string.Equals(
                    targetIdentifier,
                    toolIdentifier,
                    StringComparison.Ordinal))
            {
                throw new BridgeFaultException(
                    "BOOLEAN_REQUIRES_DISTINCT_FEATURES",
                    "Boolean target and tool feature identifiers must be different.",
                    false);
            }

            Part workPart = RequireWorkPart("performing a Boolean operation");
            Feature targetFeature = FindFeature(
                workPart,
                targetIdentifier,
                "BOOLEAN_TARGET_FEATURE_NOT_FOUND",
                "BOOLEAN_FEATURE_IDENTIFIER_AMBIGUOUS");
            Feature toolFeature = FindFeature(
                workPart,
                toolIdentifier,
                "BOOLEAN_TOOL_FEATURE_NOT_FOUND",
                "BOOLEAN_FEATURE_IDENTIFIER_AMBIGUOUS");
            Body targetBody = FindCurrentSolidBodyForFeature(
                workPart,
                targetFeature,
                "target",
                "BOOLEAN");
            Body toolBody = FindCurrentSolidBodyForFeature(
                workPart,
                toolFeature,
                "tool",
                "BOOLEAN");
            if (targetBody.Tag.Equals(toolBody.Tag))
            {
                throw new BridgeFaultException(
                    "BOOLEAN_REQUIRES_DISTINCT_BODIES",
                    "Boolean target and tool features resolve to the same current solid body.",
                    false);
            }

            AbsoluteBounds targetBounds = ReadExactAbsoluteBounds(
                workPart,
                targetBody,
                "Boolean target preflight",
                "NX_BOOLEAN_PREFLIGHT_FAILED");
            AbsoluteBounds toolBounds = ReadExactAbsoluteBounds(
                workPart,
                toolBody,
                "Boolean tool preflight",
                "NX_BOOLEAN_PREFLIGHT_FAILED");
            if (!BoundsHavePositiveOverlap(targetBounds, toolBounds))
            {
                throw new BridgeFaultException(
                    "BOOLEAN_BODIES_DO_NOT_OVERLAP",
                    "The selected target and tool bodies do not have a positive-volume overlap.",
                    false);
            }

            Feature[] beforeFeatures = workPart.Features.ToArray();
            int beforeBodyCount = GetSolidBodies(workPart).Count;
            Session.UndoMarkId undoMark = session.SetUndoMark(
                Session.MarkVisibility.Visible,
                "NX Codex: Boolean " + operation.ToLowerInvariant());
            string stage = "preparing the NX 12 UF Boolean input";

            try
            {
                int resultBodyCount = 1;
                Tag[] resultingBodyTags = null;
                if (string.Equals(operation, "UNITE", StringComparison.Ordinal))
                {
                    stage = "uniting the selected bodies with UF_MODL_unite_bodies";
                    adapter.UniteBodies(targetBody.Tag, toolBody.Tag);
                }
                else if (string.Equals(
                    operation,
                    "SUBTRACT",
                    StringComparison.Ordinal))
                {
                    stage = "subtracting the tool body with UF_MODL_subtract_bodies";
                    adapter.SubtractBodies(
                        targetBody.Tag,
                        toolBody.Tag,
                        out resultBodyCount,
                        out resultingBodyTags);
                }
                else
                {
                    stage = "intersecting the selected bodies with UF_MODL_intersect_bodies";
                    adapter.IntersectBodies(
                        targetBody.Tag,
                        toolBody.Tag,
                        out resultBodyCount,
                        out resultingBodyTags);
                }

                if (!string.Equals(operation, "UNITE", StringComparison.Ordinal) &&
                    (resultBodyCount != 1 ||
                     resultingBodyTags == null ||
                     resultingBodyTags.Length != 1))
                {
                    throw new BridgeFaultException(
                        "BOOLEAN_RESULT_BODY_COUNT_INVALID",
                        "The Boolean operation did not return exactly one resultant body.",
                        false);
                }
                List<Body> afterBodies = GetSolidBodies(workPart);
                if (afterBodies.Count != beforeBodyCount - 1)
                {
                    throw new BridgeFaultException(
                        "BOOLEAN_BODY_COUNT_INVALID",
                        "The Boolean operation did not consume exactly one tool body.",
                        false);
                }

                List<Feature> createdFeatures = new List<Feature>();
                foreach (Feature candidate in workPart.Features.ToArray())
                {
                    bool existed = false;
                    foreach (Feature previous in beforeFeatures)
                    {
                        if (candidate.Tag.Equals(previous.Tag))
                        {
                            existed = true;
                            break;
                        }
                    }
                    if (!existed)
                    {
                        createdFeatures.Add(candidate);
                    }
                }
                if (createdFeatures.Count != 1)
                {
                    throw new BridgeFaultException(
                        "BOOLEAN_FEATURE_COUNT_INVALID",
                        "The Boolean operation did not create exactly one new feature.",
                        false);
                }
                Feature booleanFeature = createdFeatures[0];
                if (!string.IsNullOrWhiteSpace(arguments.Name))
                {
                    booleanFeature.SetName(arguments.Name.Trim());
                }

                string transactionId = RecordTransaction(
                    undoMark,
                    "Boolean " + operation.ToLowerInvariant());
                BridgeResult result = GetSessionState();
                result.TransactionId = transactionId;
                result.FeatureJournalIdentifier =
                    booleanFeature.JournalIdentifier;
                result.FeatureName = FeatureDisplayName(booleanFeature);
                result.Message =
                    "Completed the typed " + operation +
                    " Boolean between the explicitly selected current solid bodies. The work part was not saved.";
                return result;
            }
            catch (BridgeFaultException)
            {
                TryRollback(undoMark);
                throw;
            }
            catch (Exception ex)
            {
                TryRollback(undoMark);
                throw new BridgeFaultException(
                    "NX_BOOLEAN_FAILED",
                    "NX failed while " + stage + ": " + ex.Message,
                    false);
            }
        }

        private BridgeResult FilletVerticalEdges(BridgeArguments arguments)
        {
            if (arguments == null)
            {
                throw InvalidArgument("Arguments are required.");
            }

            string identifier = RequireFeatureJournalIdentifier(
                arguments.BodyFeatureJournalIdentifier,
                "bodyFeatureJournalIdentifier");
            double radius = RequirePositive(
                arguments.FilletRadius,
                "filletRadius");
            Part workPart = RequireWorkPart("filleting vertical body edges");
            Feature selectedFeature = FindFeature(
                workPart,
                identifier,
                "FILLET_BODY_FEATURE_NOT_FOUND",
                "FILLET_FEATURE_IDENTIFIER_AMBIGUOUS");
            Body targetBody = FindCurrentSolidBodyForFeature(
                workPart,
                selectedFeature,
                "body",
                "FILLET");
            AbsoluteBounds bounds = ReadExactAbsoluteBounds(
                workPart,
                targetBody,
                "vertical-edge fillet preflight",
                "NX_FILLET_PREFLIGHT_FAILED");

            const double tolerance = 0.000001;
            double sizeX = bounds.MaximumX - bounds.MinimumX;
            double sizeY = bounds.MaximumY - bounds.MinimumY;
            if (sizeX <= tolerance || sizeY <= tolerance)
            {
                throw new BridgeFaultException(
                    "FILLET_TRANSVERSE_BOUNDS_INVALID",
                    "The selected body has no positive absolute WCS X/Y transverse size.",
                    false);
            }
            if (radius >= Math.Min(sizeX, sizeY) / 2.0 - tolerance)
            {
                throw new BridgeFaultException(
                    "FILLET_RADIUS_TOO_LARGE",
                    "filletRadius must be strictly less than half the smaller exact absolute WCS X/Y body size.",
                    false);
            }

            List<Edge> verticalEdges = new List<Edge>();
            foreach (Edge edge in targetBody.GetEdges())
            {
                if (edge == null || edge.SolidEdgeType != Edge.EdgeType.Linear)
                {
                    continue;
                }
                Point3d first;
                Point3d second;
                edge.GetVertices(out first, out second);
                bool parallelToZ =
                    Math.Abs(first.X - second.X) <= tolerance &&
                    Math.Abs(first.Y - second.Y) <= tolerance;
                bool spansBounds =
                    (Math.Abs(first.Z - bounds.MinimumZ) <= tolerance &&
                     Math.Abs(second.Z - bounds.MaximumZ) <= tolerance) ||
                    (Math.Abs(second.Z - bounds.MinimumZ) <= tolerance &&
                     Math.Abs(first.Z - bounds.MaximumZ) <= tolerance);
                if (parallelToZ && spansBounds)
                {
                    verticalEdges.Add(edge);
                }
            }
            if (verticalEdges.Count != 4)
            {
                throw new BridgeFaultException(
                    "FILLET_REQUIRES_FOUR_VERTICAL_EDGES",
                    "The selected current solid body must expose exactly four linear edges parallel to absolute WCS Z and spanning its exact Z bounds.",
                    false);
            }

            Feature[] beforeFeatures = workPart.Features.ToArray();
            int beforeBodyCount = GetSolidBodies(workPart).Count;
            Session.UndoMarkId undoMark = session.SetUndoMark(
                Session.MarkVisibility.Visible,
                "NX Codex: fillet vertical edges");
            string stage = "preparing the NX 12 UF blend input";

            try
            {
                Tag[] edgeTags = new Tag[verticalEdges.Count];
                for (int index = 0; index < verticalEdges.Count; index++)
                {
                    edgeTags[index] = verticalEdges[index].Tag;
                }

                stage = "creating the four-edge constant-radius blend with UF_MODL_create_blend";
                Tag featureTag;
                adapter.CreateBlend(
                    Expression(radius),
                    edgeTags,
                    0.001,
                    out featureTag);

                if (GetSolidBodies(workPart).Count != beforeBodyCount)
                {
                    throw new BridgeFaultException(
                        "FILLET_BODY_COUNT_INVALID",
                        "The fillet changed the number of current solid bodies.",
                        false);
                }
                List<Feature> createdFeatures = new List<Feature>();
                foreach (Feature candidate in workPart.Features.ToArray())
                {
                    bool existed = false;
                    foreach (Feature previous in beforeFeatures)
                    {
                        if (candidate.Tag.Equals(previous.Tag))
                        {
                            existed = true;
                            break;
                        }
                    }
                    if (!existed)
                    {
                        createdFeatures.Add(candidate);
                    }
                }
                if (createdFeatures.Count != 1 ||
                    !createdFeatures[0].Tag.Equals(featureTag))
                {
                    throw new BridgeFaultException(
                        "FILLET_FEATURE_COUNT_INVALID",
                        "The fillet did not create exactly the one feature returned by NX.",
                        false);
                }
                Feature filletFeature = createdFeatures[0];
                if (!string.IsNullOrWhiteSpace(arguments.Name))
                {
                    filletFeature.SetName(arguments.Name.Trim());
                }

                string transactionId = RecordTransaction(
                    undoMark,
                    "Fillet four vertical edges");
                BridgeResult result = GetSessionState();
                result.TransactionId = transactionId;
                result.FeatureJournalIdentifier =
                    filletFeature.JournalIdentifier;
                result.FeatureName = FeatureDisplayName(filletFeature);
                result.Message =
                    "Created one constant-radius blend on the four validated absolute-WCS vertical edges. The work part was not saved.";
                return result;
            }
            catch (BridgeFaultException)
            {
                TryRollback(undoMark);
                throw;
            }
            catch (Exception ex)
            {
                TryRollback(undoMark);
                throw new BridgeFaultException(
                    "NX_FILLET_FAILED",
                    "NX failed while " + stage + ": " + ex.Message,
                    false);
            }
        }

        private List<Body> GetSolidBodies(Part workPart)
        {
            List<Body> solidBodies = new List<Body>();
            foreach (Body body in workPart.Bodies.ToArray())
            {
                if (body != null && body.IsSolidBody)
                {
                    solidBodies.Add(body);
                }
            }
            return solidBodies;
        }

        private AbsoluteBounds ReadExactAbsoluteBounds(
            Part workPart,
            Body body,
            string context,
            string failureCode)
        {
            Session.UndoMarkId temporaryUndoMark = session.SetUndoMark(
                Session.MarkVisibility.Invisible,
                "NX Codex: temporary " + context + " objects");
            bool cleaned = false;
            try
            {
                CartesianCoordinateSystem absoluteCoordinateSystem =
                    workPart.CoordinateSystems.CreateCoordinateSystem(
                        new Point3d(0.0, 0.0, 0.0),
                        IdentityMatrix(),
                        true);
                double[] corner = new double[3];
                double[,] directions = new double[3, 3];
                double[] distances = new double[3];
                UFSession.GetUFSession().Modl.AskBoundingBoxExact(
                    body.Tag,
                    absoluteCoordinateSystem.Tag,
                    corner,
                    directions,
                    distances);

                AbsoluteBounds bounds = new AbsoluteBounds();
                for (int mask = 0; mask < 8; mask++)
                {
                    double[] point =
                    {
                        corner[0],
                        corner[1],
                        corner[2]
                    };
                    for (int axis = 0; axis < 3; axis++)
                    {
                        if ((mask & (1 << axis)) == 0)
                        {
                            continue;
                        }
                        for (int component = 0; component < 3; component++)
                        {
                            point[component] +=
                                directions[axis, component] * distances[axis];
                        }
                    }
                    bounds.Include(point);
                }

                session.UndoToMark(temporaryUndoMark, null);
                session.DeleteUndoMark(temporaryUndoMark, null);
                cleaned = true;
                return bounds;
            }
            catch (BridgeFaultException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    failureCode,
                    "NX failed to read exact absolute body bounds during " +
                    context + ": " +
                    ex.Message,
                    false);
            }
            finally
            {
                if (!cleaned)
                {
                    TryRollbackAndDelete(temporaryUndoMark);
                }
            }
        }

        private static HoleFaceSelection SelectThroughHoleFaces(
            Body targetBody,
            AbsoluteBounds bounds,
            double centerX,
            double centerY,
            double diameter)
        {
            const double tolerance = 0.000001;
            UFSession ufSession = UFSession.GetUFSession();
            List<HoleFaceCandidate> topFaces =
                new List<HoleFaceCandidate>();
            List<HoleFaceCandidate> bottomFaces =
                new List<HoleFaceCandidate>();

            foreach (Face face in targetBody.GetFaces())
            {
                int faceType;
                double[] point = new double[3];
                double[] direction = new double[3];
                double[] faceBox = new double[6];
                double radius;
                double radiusData;
                int normalDirection;
                ufSession.Modl.AskFaceData(
                    face.Tag,
                    out faceType,
                    point,
                    direction,
                    faceBox,
                    out radius,
                    out radiusData,
                    out normalDirection);
                if (faceType != 22 ||
                    Math.Abs(direction[0]) > tolerance ||
                    Math.Abs(direction[1]) > tolerance)
                {
                    continue;
                }

                double actualNormalZ = direction[2] * normalDirection;
                bool isTop =
                    Math.Abs(point[2] - bounds.MaximumZ) <= tolerance &&
                    actualNormalZ >= 1.0 - tolerance;
                bool isBottom =
                    Math.Abs(point[2] - bounds.MinimumZ) <= tolerance &&
                    actualNormalZ <= -1.0 + tolerance;
                if (!isTop && !isBottom)
                {
                    continue;
                }

                double z = isTop ? bounds.MaximumZ : bounds.MinimumZ;
                int containment;
                ufSession.Modl.AskPointContainment(
                    new double[] { centerX, centerY, z },
                    face.Tag,
                    out containment);
                if (containment != 1)
                {
                    continue;
                }

                HoleFaceCandidate candidate = new HoleFaceCandidate(
                    face,
                    faceBox);
                if (isTop)
                {
                    topFaces.Add(candidate);
                }
                if (isBottom)
                {
                    bottomFaces.Add(candidate);
                }
            }

            HoleFaceCandidate top = RequireUniqueHoleFace(
                topFaces,
                "HOLE_START_FACE_NOT_FOUND",
                "HOLE_START_FACE_AMBIGUOUS",
                "No unique upward planar face at the body's maximum absolute Z contains the requested center.");
            HoleFaceCandidate bottom = RequireUniqueHoleFace(
                bottomFaces,
                "HOLE_THROUGH_FACE_NOT_FOUND",
                "HOLE_THROUGH_FACE_AMBIGUOUS",
                "No unique downward planar face at the body's minimum absolute Z contains the requested center.");

            double radiusValue = diameter / 2.0;
            if (!CircleFitsFaceBox(top.FaceBox, centerX, centerY, radiusValue) ||
                !CircleFitsFaceBox(bottom.FaceBox, centerX, centerY, radiusValue))
            {
                throw new BridgeFaultException(
                    "HOLE_CLEARANCE_OUTSIDE_FACE",
                    "The requested hole circle does not fit strictly inside both selected planar face bounding boxes.",
                    false);
            }
            return new HoleFaceSelection(top.Face, bottom.Face);
        }

        private static HoleFaceCandidate RequireUniqueHoleFace(
            List<HoleFaceCandidate> candidates,
            string missingCode,
            string ambiguousCode,
            string message)
        {
            if (candidates.Count == 0)
            {
                throw new BridgeFaultException(missingCode, message, false);
            }
            if (candidates.Count > 1)
            {
                throw new BridgeFaultException(
                    ambiguousCode,
                    message + " Multiple candidate faces matched.",
                    false);
            }
            return candidates[0];
        }

        private static bool CircleFitsFaceBox(
            double[] faceBox,
            double centerX,
            double centerY,
            double radius)
        {
            const double tolerance = 0.000001;
            return centerX - radius > faceBox[0] + tolerance &&
                centerY - radius > faceBox[1] + tolerance &&
                centerX + radius < faceBox[3] - tolerance &&
                centerY + radius < faceBox[4] - tolerance;
        }

        private BridgeResult MeasureWorkPart()
        {
            Part workPart = RequireWorkPart("measuring solid bodies");
            Body[] bodies = workPart.Bodies.ToArray();
            List<Body> solidBodies = new List<Body>();
            foreach (Body body in bodies)
            {
                if (body != null && body.IsSolidBody)
                {
                    solidBodies.Add(body);
                }
            }
            if (solidBodies.Count == 0)
            {
                throw new BridgeFaultException(
                    "NO_SOLID_BODY",
                    "The NX work part contains no solid body to measure.",
                    false);
            }

            Session.UndoMarkId temporaryUndoMark = session.SetUndoMark(
                Session.MarkVisibility.Invisible,
                "NX Codex: temporary measurement objects");
            bool temporaryMarkCleaned = false;
            try
            {
                UFSession ufSession = UFSession.GetUFSession();
                bool millimeters =
                    workPart.PartUnits == BasePart.Units.Millimeters;
                if (!millimeters &&
                    workPart.PartUnits != BasePart.Units.Inches)
                {
                    throw new BridgeFaultException(
                        "UNSUPPORTED_PART_UNITS",
                        "Measurement supports millimeter and inch parts only.",
                        false);
                }
                int massPropertyUnits = millimeters ? 3 : 1;
                double massLengthToPartUnits = millimeters ? 10.0 : 1.0;
                double massAreaToPartUnits =
                    massLengthToPartUnits * massLengthToPartUnits;
                double massVolumeToPartUnits =
                    massAreaToPartUnits * massLengthToPartUnits;
                Tag[] bodyTags = new Tag[solidBodies.Count];
                for (int index = 0; index < solidBodies.Count; index++)
                {
                    bodyTags[index] = solidBodies[index].Tag;
                }

                double[] accuracy = new double[11];
                accuracy[0] = 0.999;
                double[] massProperties = new double[47];
                double[] statistics = new double[13];
                ufSession.Modl.AskMassProps3d(
                    bodyTags,
                    bodyTags.Length,
                    1,
                    massPropertyUnits,
                    1.0,
                    1,
                    accuracy,
                    massProperties,
                    statistics);

                double[] centroidInWorkAbsolute = new double[3];
                ufSession.Csys.MapPoint(
                    3,
                    new double[]
                    {
                        massProperties[3] * massLengthToPartUnits,
                        massProperties[4] * massLengthToPartUnits,
                        massProperties[5] * massLengthToPartUnits
                    },
                    2,
                    centroidInWorkAbsolute);

                Matrix3x3 orientation = IdentityMatrix();
                CartesianCoordinateSystem absoluteCoordinateSystem =
                    workPart.CoordinateSystems.CreateCoordinateSystem(
                        new Point3d(0.0, 0.0, 0.0),
                        orientation,
                        true);
                double[] minimum = {
                    double.PositiveInfinity,
                    double.PositiveInfinity,
                    double.PositiveInfinity
                };
                double[] maximum = {
                    double.NegativeInfinity,
                    double.NegativeInfinity,
                    double.NegativeInfinity
                };

                foreach (Body body in solidBodies)
                {
                    double[] corner = new double[3];
                    double[,] directions = new double[3, 3];
                    double[] distances = new double[3];
                    ufSession.Modl.AskBoundingBoxExact(
                        body.Tag,
                        absoluteCoordinateSystem.Tag,
                        corner,
                        directions,
                        distances);

                    for (int mask = 0; mask < 8; mask++)
                    {
                        double[] point =
                        {
                            corner[0],
                            corner[1],
                            corner[2]
                        };
                        for (int axis = 0; axis < 3; axis++)
                        {
                            if ((mask & (1 << axis)) == 0)
                            {
                                continue;
                            }
                            for (int component = 0; component < 3; component++)
                            {
                                point[component] +=
                                    directions[axis, component] *
                                    distances[axis];
                            }
                        }
                        for (int component = 0; component < 3; component++)
                        {
                            minimum[component] = Math.Min(
                                minimum[component],
                                point[component]);
                            maximum[component] = Math.Max(
                                maximum[component],
                                point[component]);
                        }
                    }
                }

                CleanupTemporaryUndoMark(temporaryUndoMark);
                temporaryMarkCleaned = true;
                BridgeResult result = GetSessionState();
                result.MeasuredBodyCount = solidBodies.Count;
                result.MeasurementUnits = millimeters
                    ? "Millimeters"
                    : "Inches";
                result.BoundingBoxMinX = minimum[0];
                result.BoundingBoxMinY = minimum[1];
                result.BoundingBoxMinZ = minimum[2];
                result.BoundingBoxMaxX = maximum[0];
                result.BoundingBoxMaxY = maximum[1];
                result.BoundingBoxMaxZ = maximum[2];
                result.BoundingBoxSizeX = maximum[0] - minimum[0];
                result.BoundingBoxSizeY = maximum[1] - minimum[1];
                result.BoundingBoxSizeZ = maximum[2] - minimum[2];
                result.SurfaceArea =
                    massProperties[0] * massAreaToPartUnits;
                result.Volume =
                    massProperties[1] * massVolumeToPartUnits;
                result.CentroidX = centroidInWorkAbsolute[0];
                result.CentroidY = centroidInWorkAbsolute[1];
                result.CentroidZ = centroidInWorkAbsolute[2];
                result.Message =
                    "Measured solid bodies without modifying the work part. Bounding box and centroid are in work-part absolute coordinates.";
                return result;
            }
            catch (BridgeFaultException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    "NX_MEASUREMENT_FAILED",
                    "NX failed to measure the work-part solids: " +
                    ex.Message,
                    false);
            }
            finally
            {
                if (!temporaryMarkCleaned)
                {
                    TryRollbackAndDelete(temporaryUndoMark);
                }
            }
        }

        private BridgeResult ExportStep(BridgeArguments arguments)
        {
            if (arguments == null)
            {
                throw InvalidArgument("Arguments are required.");
            }
            Part workPart = RequireWorkPart("exporting STEP");
            string target = RequireStepPath(arguments);
            string format = string.IsNullOrWhiteSpace(arguments.StepFormat)
                ? "AP214"
                : arguments.StepFormat.Trim().ToUpperInvariant();
            StepCreator.ExportAsOption exportAs;
            switch (format)
            {
                case "AP203":
                    exportAs = StepCreator.ExportAsOption.Ap203;
                    break;
                case "AP214":
                    exportAs = StepCreator.ExportAsOption.Ap214;
                    break;
                case "AP242":
                    exportAs = StepCreator.ExportAsOption.Ap242;
                    break;
                default:
                    throw InvalidArgument(
                        "stepFormat must be AP203, AP214, or AP242.");
            }

            FileAccessPolicy policy = FileAccessPolicy.Load();
            target = policy.ValidateStepPath(target, FilePathIntent.Create);
            string parent = Path.GetDirectoryName(target);
            string staging = Path.Combine(
                parent,
                ".nx-codex-step-staging-" +
                Guid.NewGuid().ToString("N") +
                ".stp");
            staging = policy.ValidateStepPath(
                staging,
                FilePathIntent.Create);
            StepCreator creator = null;
            try
            {
                creator = session.DexManager.CreateStepCreator();
                creator.ExportFrom = StepCreator.ExportFromOption.DisplayPart;
                creator.OutputFile = staging;
                creator.FileSaveFlag = false;
                creator.ExportAs = exportAs;
                creator.ExportSolidsAndSurfacesAs =
                    StepCreator.ExportSolidsAndSurfacesAsOption.Precise;
                creator.EntityNames = StepCreator.EntityNameOption.LongName;
                creator.Commit();

                if (!File.Exists(staging))
                {
                    throw new BridgeFaultException(
                        "NX_STEP_EXPORT_FAILED",
                        "NX completed STEP export without creating the staging file.",
                        false);
                }
                if (File.Exists(target))
                {
                    throw new BridgeFaultException(
                        "TARGET_EXISTS",
                        "The STEP destination appeared during export; no overwrite was performed.",
                        false);
                }
                File.Move(staging, target);
                BridgeResult result = GetSessionState();
                result.FilePath = target;
                result.Exported = true;
                result.StepFormat = format;
                result.Message =
                    "Exported the displayed work part to a precise STEP file without modifying or saving the NX part.";
                return result;
            }
            catch (BridgeFaultException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    "NX_STEP_EXPORT_FAILED",
                    "NX failed to export the STEP file: " + ex.Message,
                    false);
            }
            finally
            {
                if (creator != null)
                {
                    try
                    {
                        creator.Destroy();
                    }
                    catch
                    {
                    }
                }
                try
                {
                    if (File.Exists(staging))
                    {
                        File.Delete(staging);
                    }
                }
                catch
                {
                }
            }
        }

        private BridgeResult UndoTransaction(BridgeArguments arguments)
        {
            string transactionId =
                arguments == null ? null : arguments.TransactionId;
            if (string.IsNullOrWhiteSpace(transactionId))
            {
                throw InvalidArgument("transactionId is required.");
            }
            if (transactions.Count == 0)
            {
                throw new BridgeFaultException(
                    "TRANSACTION_NOT_FOUND",
                    "No NX Codex transaction is available to undo.",
                    false);
            }

            TransactionRecord latest = transactions[transactions.Count - 1];
            if (!string.Equals(
                latest.Id,
                transactionId,
                StringComparison.Ordinal))
            {
                throw new BridgeFaultException(
                    "TRANSACTION_NOT_LATEST",
                    "Only the latest NX Codex transaction can be undone safely.",
                    false);
            }

            try
            {
                session.UndoToMark(latest.UndoMark, null);
                transactions.RemoveAt(transactions.Count - 1);
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    "UNDO_FAILED",
                    "NX failed to undo the transaction: " + ex.Message,
                    false);
            }

            BridgeResult result = GetSessionState();
            result.TransactionId = transactionId;
            result.Message = "Transaction undone. The work part was not saved.";
            return result;
        }

        private Part RequireWorkPart(string action)
        {
            Part workPart = session.Parts.Work;
            if (workPart == null)
            {
                throw new BridgeFaultException(
                    "NO_WORK_PART",
                    "Open or create an NX work part before " + action + ".",
                    false);
            }
            return workPart;
        }

        private static Sketch FindSketch(
            Part workPart,
            string featureJournalIdentifier)
        {
            foreach (Sketch sketch in workPart.Sketches.ToArray())
            {
                Feature feature = sketch == null ? null : sketch.Feature;
                if (feature != null &&
                    string.Equals(
                        feature.JournalIdentifier,
                        featureJournalIdentifier,
                        StringComparison.Ordinal))
                {
                    return sketch;
                }
            }
            throw new BridgeFaultException(
                "SKETCH_NOT_FOUND",
                "No sketch feature exactly matched the supplied journal identifier.",
                false);
        }

        private static Feature FindFeature(
            Part workPart,
            string journalIdentifier,
            string missingCode,
            string ambiguousCode)
        {
            Feature match = null;
            foreach (Feature feature in workPart.Features.ToArray())
            {
                if (!string.Equals(
                    feature.JournalIdentifier,
                    journalIdentifier,
                    StringComparison.Ordinal))
                {
                    continue;
                }
                if (match != null)
                {
                    throw new BridgeFaultException(
                        ambiguousCode,
                        "More than one feature matched the supplied exact journal identifier.",
                        false);
                }
                match = feature;
            }
            if (match == null)
            {
                throw new BridgeFaultException(
                    missingCode,
                    "No feature exactly matched the supplied journal identifier.",
                    false);
            }
            return match;
        }

        private Body FindCurrentSolidBodyForFeature(
            Part workPart,
            Feature feature,
            string role,
            string codePrefix)
        {
            Body match = null;
            foreach (Body body in GetSolidBodies(workPart))
            {
                foreach (Feature bodyFeature in body.GetFeatures())
                {
                    if (!bodyFeature.Tag.Equals(feature.Tag))
                    {
                        continue;
                    }
                    if (match != null && !match.Tag.Equals(body.Tag))
                    {
                        throw new BridgeFaultException(
                            codePrefix + "_BODY_MAPPING_AMBIGUOUS",
                            "The selected " + role +
                            " feature maps to more than one current solid body.",
                            false);
                    }
                    match = body;
                }
            }
            if (match == null)
            {
                throw new BridgeFaultException(
                    codePrefix + "_BODY_NOT_CURRENT",
                    "The selected " + role +
                    " feature does not map to a current solid body.",
                    false);
            }
            return match;
        }

        private static bool BoundsHavePositiveOverlap(
            AbsoluteBounds first,
            AbsoluteBounds second)
        {
            const double tolerance = 0.000001;
            return Math.Min(first.MaximumX, second.MaximumX) -
                    Math.Max(first.MinimumX, second.MinimumX) > tolerance &&
                Math.Min(first.MaximumY, second.MaximumY) -
                    Math.Max(first.MinimumY, second.MinimumY) > tolerance &&
                Math.Min(first.MaximumZ, second.MaximumZ) -
                    Math.Max(first.MinimumZ, second.MinimumZ) > tolerance;
        }

        private static void EnsureRectangleProfileDoesNotCrossAxis(
            NXObject[] geometry,
            string axisDirection,
            double axisOriginX,
            double axisOriginY,
            double axisOriginZ)
        {
            if (geometry == null || geometry.Length != 4)
            {
                throw new BridgeFaultException(
                    "UNSUPPORTED_SKETCH_PROFILE",
                    "Full revolve currently requires the four-line rectangular profile created by this bridge.",
                    false);
            }

            double minimumX = double.PositiveInfinity;
            double maximumX = double.NegativeInfinity;
            double minimumY = double.PositiveInfinity;
            double maximumY = double.NegativeInfinity;
            foreach (NXObject item in geometry)
            {
                Line line = item as Line;
                if (line == null)
                {
                    throw new BridgeFaultException(
                        "UNSUPPORTED_SKETCH_PROFILE",
                        "Full revolve currently requires the four-line rectangular profile created by this bridge.",
                        false);
                }
                Point3d start = line.StartPoint;
                Point3d end = line.EndPoint;
                if (Math.Abs(start.Z - axisOriginZ) > 0.000001 ||
                    Math.Abs(end.Z - axisOriginZ) > 0.000001)
                {
                    throw new BridgeFaultException(
                        "AXIS_NOT_IN_SKETCH_PLANE",
                        "The full-revolution axis must lie in the rectangular sketch plane.",
                        false);
                }
                minimumX = Math.Min(
                    minimumX,
                    Math.Min(start.X, end.X));
                maximumX = Math.Max(
                    maximumX,
                    Math.Max(start.X, end.X));
                minimumY = Math.Min(
                    minimumY,
                    Math.Min(start.Y, end.Y));
                maximumY = Math.Max(
                    maximumY,
                    Math.Max(start.Y, end.Y));
            }

            double radialMinimum = string.Equals(
                axisDirection,
                "WCS_X",
                StringComparison.Ordinal)
                    ? minimumY
                    : minimumX;
            double radialMaximum = string.Equals(
                axisDirection,
                "WCS_X",
                StringComparison.Ordinal)
                    ? maximumY
                    : maximumX;
            double radialAxis = string.Equals(
                axisDirection,
                "WCS_X",
                StringComparison.Ordinal)
                    ? axisOriginY
                    : axisOriginX;
            if (radialAxis > radialMinimum + 0.000001 &&
                radialAxis < radialMaximum - 0.000001)
            {
                throw new BridgeFaultException(
                    "PROFILE_CROSSES_AXIS",
                    "The rectangular profile crosses the requested full-revolution axis.",
                    false);
            }
        }

        private string RecordTransaction(
            Session.UndoMarkId undoMark,
            string operationName)
        {
            string transactionId = "TX-" + Guid.NewGuid().ToString();
            session.SetUndoMarkName(
                undoMark,
                "NX Codex: " + transactionId + " / " + operationName);
            transactions.Add(new TransactionRecord(transactionId, undoMark));
            return transactionId;
        }

        private static string FeatureDisplayName(Feature feature)
        {
            return string.IsNullOrWhiteSpace(feature.Name)
                ? feature.JournalIdentifier
                : feature.Name;
        }

        private static Matrix3x3 IdentityMatrix()
        {
            Matrix3x3 matrix = new Matrix3x3();
            matrix.Xx = 1.0;
            matrix.Xy = 0.0;
            matrix.Xz = 0.0;
            matrix.Yx = 0.0;
            matrix.Yy = 1.0;
            matrix.Yz = 0.0;
            matrix.Zx = 0.0;
            matrix.Zy = 0.0;
            matrix.Zz = 1.0;
            return matrix;
        }

        private static void DestroyBuilder(Builder builder)
        {
            if (builder == null)
            {
                return;
            }
            try
            {
                builder.Destroy();
            }
            catch
            {
            }
        }

        private string RequirePartPath(
            BridgeArguments arguments,
            FilePathIntent intent)
        {
            string supplied = arguments == null
                ? null
                : arguments.FilePath;
            if (string.IsNullOrWhiteSpace(supplied))
            {
                throw InvalidArgument("filePath is required.");
            }
            return FileAccessPolicy.Load().ValidatePartPath(
                supplied,
                intent);
        }

        private string RequireStepPath(BridgeArguments arguments)
        {
            string supplied = arguments == null ? null : arguments.FilePath;
            if (string.IsNullOrWhiteSpace(supplied))
            {
                throw InvalidArgument("filePath is required.");
            }
            return FileAccessPolicy.Load().ValidateStepPath(
                supplied,
                FilePathIntent.Create);
        }

        private void EnsureNoPendingTransactions(string action)
        {
            if (transactions.Count > 0)
            {
                throw new BridgeFaultException(
                    "PENDING_TRANSACTION",
                    "Undo or save the current NX Codex transaction before " +
                    action + ".",
                    false);
            }
        }

        private void TryOpenRecovery(string recoveryPath)
        {
            if (!File.Exists(recoveryPath))
            {
                return;
            }
            PartLoadStatus loadStatus = null;
            try
            {
                session.Parts.OpenDisplay(recoveryPath, out loadStatus);
            }
            catch
            {
            }
            finally
            {
                FreeLoadStatus(loadStatus);
            }
        }

        private static string[] ReadLoadWarnings(
            PartLoadStatus loadStatus)
        {
            if (loadStatus == null ||
                loadStatus.NumberUnloadedParts <= 0)
            {
                return new string[0];
            }

            List<string> warnings = new List<string>();
            int count = Math.Min(
                loadStatus.NumberUnloadedParts,
                32);
            for (int index = 0; index < count; index++)
            {
                try
                {
                    string partName = loadStatus.GetPartName(index);
                    string description =
                        loadStatus.GetStatusDescription(index);
                    warnings.Add(
                        string.IsNullOrWhiteSpace(partName)
                            ? description
                            : partName + ": " + description);
                }
                catch (Exception ex)
                {
                    warnings.Add(
                        "Unable to read load warning " +
                        index.ToString(CultureInfo.InvariantCulture) +
                        ": " + ex.Message);
                }
            }
            return warnings.ToArray();
        }

        private static void FreeLoadStatus(PartLoadStatus loadStatus)
        {
            if (loadStatus == null)
            {
                return;
            }
            try
            {
                loadStatus.Dispose();
            }
            catch
            {
            }
        }

        private static void FreeSaveStatus(PartSaveStatus saveStatus)
        {
            if (saveStatus == null)
            {
                return;
            }
            try
            {
                saveStatus.Dispose();
            }
            catch
            {
            }
        }

        private void TryRollback(Session.UndoMarkId undoMark)
        {
            try
            {
                session.UndoToMark(undoMark, null);
            }
            catch
            {
            }
        }

        private void CleanupTemporaryUndoMark(Session.UndoMarkId undoMark)
        {
            try
            {
                session.UndoToMark(undoMark, null);
                session.DeleteUndoMark(undoMark, null);
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    "NX_MEASUREMENT_CLEANUP_FAILED",
                    "NX measured the part but could not remove its temporary coordinate system: " +
                    ex.Message,
                    false);
            }
        }

        private void TryRollbackAndDelete(Session.UndoMarkId undoMark)
        {
            try
            {
                session.UndoToMark(undoMark, null);
            }
            catch
            {
            }
            try
            {
                session.DeleteUndoMark(undoMark, null);
            }
            catch
            {
            }
        }

        private static double RequirePositive(double? value, string name)
        {
            if (!value.HasValue ||
                double.IsNaN(value.Value) ||
                double.IsInfinity(value.Value) ||
                value.Value <= 0 ||
                value.Value > 1000000)
            {
                throw InvalidArgument(
                    name + " must be finite, greater than zero, and at most 1000000.");
            }
            return value.Value;
        }

        private static string RequireFeatureJournalIdentifier(
            string value,
            string name)
        {
            if (string.IsNullOrWhiteSpace(value) || value.Length > 1024)
            {
                throw InvalidArgument(
                    name +
                    " is required and must be at most 1024 characters.");
            }
            return value.Trim();
        }

        private static double RequireCoordinate(double? value, string name)
        {
            double coordinate = value ?? 0.0;
            if (double.IsNaN(coordinate) ||
                double.IsInfinity(coordinate) ||
                coordinate < -1000000 ||
                coordinate > 1000000)
            {
                throw InvalidArgument(
                    name + " must be finite and between -1000000 and 1000000.");
            }
            return coordinate;
        }

        private static double RequireCoordinateValue(
            double? value,
            string name)
        {
            if (!value.HasValue)
            {
                throw InvalidArgument(name + " is required.");
            }
            return RequireCoordinate(value, name);
        }

        private static BridgeFaultException InvalidArgument(string message)
        {
            return new BridgeFaultException(
                "INVALID_ARGUMENT",
                message,
                false);
        }

        private static string Expression(double value)
        {
            return value.ToString("R", CultureInfo.InvariantCulture);
        }

        private static string DescribePart(Part part)
        {
            if (part == null)
            {
                return null;
            }
            string fullPath = ReadStringProperty(part, "FullPath");
            if (!string.IsNullOrWhiteSpace(fullPath))
            {
                return fullPath;
            }
            string leaf = ReadStringProperty(part, "Leaf");
            if (!string.IsNullOrWhiteSpace(leaf))
            {
                return leaf;
            }
            return ReadStringProperty(part, "Name") ?? part.ToString();
        }

        private static string ReadStringProperty(object target, string name)
        {
            object value = ReadProperty(target, name);
            return value == null ? null : Convert.ToString(
                value,
                CultureInfo.InvariantCulture);
        }

        private static bool ReadBooleanProperty(object target, string name)
        {
            object value = ReadProperty(target, name);
            return value != null && Convert.ToBoolean(
                value,
                CultureInfo.InvariantCulture);
        }

        private static object ReadProperty(object target, string name)
        {
            if (target == null)
            {
                return null;
            }
            try
            {
                PropertyInfo property = target.GetType().GetProperty(name);
                return property == null ? null : property.GetValue(target, null);
            }
            catch
            {
                return null;
            }
        }

        private sealed class AbsoluteBounds
        {
            public AbsoluteBounds()
            {
                MinimumX = double.PositiveInfinity;
                MinimumY = double.PositiveInfinity;
                MinimumZ = double.PositiveInfinity;
                MaximumX = double.NegativeInfinity;
                MaximumY = double.NegativeInfinity;
                MaximumZ = double.NegativeInfinity;
            }

            public double MinimumX { get; private set; }
            public double MinimumY { get; private set; }
            public double MinimumZ { get; private set; }
            public double MaximumX { get; private set; }
            public double MaximumY { get; private set; }
            public double MaximumZ { get; private set; }

            public void Include(double[] point)
            {
                MinimumX = Math.Min(MinimumX, point[0]);
                MinimumY = Math.Min(MinimumY, point[1]);
                MinimumZ = Math.Min(MinimumZ, point[2]);
                MaximumX = Math.Max(MaximumX, point[0]);
                MaximumY = Math.Max(MaximumY, point[1]);
                MaximumZ = Math.Max(MaximumZ, point[2]);
            }
        }

        private sealed class HoleFaceCandidate
        {
            public HoleFaceCandidate(Face face, double[] faceBox)
            {
                Face = face;
                FaceBox = faceBox;
            }

            public Face Face { get; private set; }
            public double[] FaceBox { get; private set; }
        }

        private sealed class HoleFaceSelection
        {
            public HoleFaceSelection(Face startFace, Face throughFace)
            {
                StartFace = startFace;
                ThroughFace = throughFace;
            }

            public Face StartFace { get; private set; }
            public Face ThroughFace { get; private set; }
        }

        private sealed class TransactionRecord
        {
            public TransactionRecord(
                string id,
                Session.UndoMarkId undoMark)
            {
                Id = id;
                UndoMark = undoMark;
            }

            public string Id { get; private set; }
            public Session.UndoMarkId UndoMark { get; private set; }
        }
    }
}
