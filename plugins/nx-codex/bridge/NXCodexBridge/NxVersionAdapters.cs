using System;
using System.Collections.Generic;
using System.IO;

using NXOpen;
using NXOpen.Assemblies;
using NXOpen.Drawings;
using NXOpen.UF;

namespace NXCodexBridge
{
    internal interface INxVersionAdapter
    {
        string Id { get; }
        string ContractId { get; }
        string CompatibilityStatus { get; }
        string NxOpenAssemblyVersion { get; }
        string[] SupportedCapabilities { get; }
        bool Supports(string operation);

        ModuleCapabilityDetection DetectModuleCapability(
            Session session,
            string moduleName);

        AssemblyStructureSnapshot ReadAssemblyStructure(
            Part workPart,
            int maxDepth,
            int maxComponents);

        DraftingStructureSnapshot ReadDraftingStructure(
            Part workPart,
            int maxSheets,
            int maxViews);

        void CreateRevolved(
            Tag[] generatorTags,
            string[] limits,
            double[] axisPoint,
            double[] axisDirection,
            FeatureSigns sign,
            out Tag[] featureTags);

        void CreateSimpleHole(
            double[] location,
            double[] direction,
            string diameter,
            string depth,
            string tipAngle,
            Tag startFace,
            Tag throughFace,
            out Tag featureTag);

        void UniteBodies(Tag targetBody, Tag toolBody);

        void SubtractBodies(
            Tag targetBody,
            Tag toolBody,
            out int resultBodyCount,
            out Tag[] resultingBodyTags);

        void IntersectBodies(
            Tag targetBody,
            Tag toolBody,
            out int resultBodyCount,
            out Tag[] resultingBodyTags);

        void CreateBlend(
            string radius,
            Tag[] edgeTags,
            double tolerance,
            out Tag featureTag);

        void CapturePng(string filePath);
    }

    internal sealed class ModuleCapabilityDetection
    {
        public bool Available { get; set; }
        public bool Licensed { get; set; }
        public string UnsupportedReason { get; set; }
    }

    internal sealed class AssemblyStructureSnapshot
    {
        public bool IsAssembly { get; set; }
        public AssemblyComponentNode RootComponent { get; set; }
        public AssemblyComponentNode[] Components { get; set; }
        public int ComponentCount { get; set; }
        public bool ComponentCountComplete { get; set; }
        public bool DepthTruncated { get; set; }
        public bool ComponentLimitTruncated { get; set; }
    }

    internal sealed class AssemblyTraversalItem
    {
        public Component Component { get; set; }
        public int ParentIndex { get; set; }
        public int Depth { get; set; }
    }

    internal sealed class DraftingStructureSnapshot
    {
        public bool HasDrawingSheets { get; set; }
        public DraftingSheetNode[] Sheets { get; set; }
        public DraftingViewNode[] Views { get; set; }
        public int SheetCount { get; set; }
        public bool SheetCountComplete { get; set; }
        public int ViewCount { get; set; }
        public bool ViewCountComplete { get; set; }
        public bool SheetLimitTruncated { get; set; }
        public bool ViewLimitTruncated { get; set; }
    }

    internal static class NxCapabilityCatalog
    {
        private static readonly string[] ReadOnlyCapabilities =
        {
            "health",
            "get_capabilities",
            "get_session_state",
            "get_assembly_capability",
            "get_drafting_capability",
            "get_cae_capability",
            "get_cam_capability"
        };

        private static readonly string[] Nx12Capabilities =
        {
            "health",
            "get_capabilities",
            "get_session_state",
            "get_assembly_capability",
            "get_drafting_capability",
            "get_cae_capability",
            "get_cam_capability",
            "get_assembly_structure",
            "get_drafting_structure",
            "create_test_drawing",
            "preflight_modeling",
            "get_feature_tree",
            "capture_screenshot",
            "new_part",
            "open_part",
            "save_as",
            "close_part",
            "create_block",
            "create_rectangle_sketch",
            "extrude_sketch",
            "revolve_sketch",
            "create_simple_through_hole",
            "boolean_bodies",
            "fillet_vertical_edges",
            "measure_work_part",
            "export_step",
            "undo_transaction"
        };

        public static string[] ReadOnly()
        {
            return (string[])ReadOnlyCapabilities.Clone();
        }

        public static string[] Nx12()
        {
            return (string[])Nx12Capabilities.Clone();
        }
    }

    internal static class NxVersionAdapterRegistry
    {
        private static readonly Version VerifiedNx12Version =
            new Version(12, 0, 2, 9);

        public static INxVersionAdapter Select(Version nxOpenVersion)
        {
            if (nxOpenVersion != null &&
                nxOpenVersion.Equals(VerifiedNx12Version))
            {
                return new Nx12_0_2_9Adapter(nxOpenVersion);
            }
            return new UnsupportedNxVersionAdapter(nxOpenVersion);
        }
    }

    internal sealed class Nx12_0_2_9Adapter : INxVersionAdapter
    {
        private readonly string nxOpenAssemblyVersion;

        public Nx12_0_2_9Adapter(Version nxOpenVersion)
        {
            nxOpenAssemblyVersion = nxOpenVersion.ToString();
        }

        public string Id { get { return "nx12.0.2.9"; } }

        public string ContractId
        {
            get { return "nx12.0.2.9-required-api-v1"; }
        }

        public string CompatibilityStatus { get { return "verified"; } }

        public string NxOpenAssemblyVersion
        {
            get { return nxOpenAssemblyVersion; }
        }

        public string[] SupportedCapabilities
        {
            get { return NxCapabilityCatalog.Nx12(); }
        }

        public bool Supports(string operation)
        {
            foreach (string capability in SupportedCapabilities)
            {
                if (string.Equals(
                        capability,
                        operation,
                        StringComparison.Ordinal))
                {
                    return true;
                }
            }
            return false;
        }

        public ModuleCapabilityDetection DetectModuleCapability(
            Session session,
            string moduleName)
        {
            return Nx12ReadOnlyModuleCapabilityDetector.Detect(
                session,
                moduleName);
        }

        public AssemblyStructureSnapshot ReadAssemblyStructure(
            Part workPart,
            int maxDepth,
            int maxComponents)
        {
            if (workPart == null)
            {
                throw new ArgumentNullException("workPart");
            }

            ComponentAssembly assembly = workPart.ComponentAssembly;
            Component root = assembly == null ? null : assembly.RootComponent;
            if (root == null)
            {
                return new AssemblyStructureSnapshot
                {
                    IsAssembly = false,
                    RootComponent = null,
                    Components = new AssemblyComponentNode[0],
                    ComponentCount = 0,
                    ComponentCountComplete = true,
                    DepthTruncated = false,
                    ComponentLimitTruncated = false
                };
            }

            Component[] rootChildren = root.GetChildren() ?? new Component[0];
            bool depthTruncated = maxDepth == 0 && rootChildren.Length > 0;
            bool componentLimitTruncated = false;
            AssemblyComponentNode rootNode = new AssemblyComponentNode
            {
                Index = 0,
                ParentIndex = null,
                Depth = 0,
                InstanceName = Bounded(workPart.Leaf, 256),
                DisplayName = Bounded(workPart.Leaf, 256),
                PrototypePartIdentifier = PartIdentifier(
                    string.IsNullOrWhiteSpace(workPart.FullPath)
                        ? workPart.Leaf
                        : workPart.FullPath),
                Suppressed = false,
                LoadState = "loaded",
                RepresentationMode = "Exact",
                ChildCount = rootChildren.Length,
                ChildrenTruncated = depthTruncated ? (bool?)true : null
            };

            List<AssemblyComponentNode> nodes =
                new List<AssemblyComponentNode>();
            Queue<AssemblyTraversalItem> pending =
                new Queue<AssemblyTraversalItem>();
            if (maxDepth > 0)
            {
                EnqueueBounded(
                    rootChildren,
                    0,
                    1,
                    maxComponents,
                    nodes.Count,
                    pending,
                    ref componentLimitTruncated);
                if (componentLimitTruncated)
                {
                    rootNode.ChildrenTruncated = true;
                }
            }

            UFSession ufSession = UFSession.GetUFSession();
            while (pending.Count > 0 && nodes.Count < maxComponents)
            {
                AssemblyTraversalItem item = pending.Dequeue();
                Component[] children = item.Component.GetChildren() ??
                    new Component[0];
                bool childrenTruncated = false;
                if (item.Depth >= maxDepth && children.Length > 0)
                {
                    depthTruncated = true;
                    childrenTruncated = true;
                }

                int nodeIndex = nodes.Count + 1;
                AssemblyComponentNode node = ReadComponentNode(
                    ufSession,
                    item.Component,
                    nodeIndex,
                    item.ParentIndex,
                    item.Depth,
                    children.Length);
                nodes.Add(node);

                if (item.Depth < maxDepth && children.Length > 0)
                {
                    bool limitBefore = componentLimitTruncated;
                    EnqueueBounded(
                        children,
                        nodeIndex,
                        item.Depth + 1,
                        maxComponents,
                        nodes.Count,
                        pending,
                        ref componentLimitTruncated);
                    if (!limitBefore && componentLimitTruncated)
                    {
                        childrenTruncated = true;
                    }
                    else if (componentLimitTruncated &&
                        nodes.Count + pending.Count >= maxComponents)
                    {
                        childrenTruncated = true;
                    }
                }
                if (childrenTruncated)
                {
                    node.ChildrenTruncated = true;
                }
            }

            if (pending.Count > 0)
            {
                componentLimitTruncated = true;
            }
            bool truncated = depthTruncated || componentLimitTruncated;
            return new AssemblyStructureSnapshot
            {
                IsAssembly = true,
                RootComponent = rootNode,
                Components = nodes.ToArray(),
                ComponentCount = nodes.Count,
                ComponentCountComplete = !truncated,
                DepthTruncated = depthTruncated,
                ComponentLimitTruncated = componentLimitTruncated
            };
        }

        public DraftingStructureSnapshot ReadDraftingStructure(
            Part workPart,
            int maxSheets,
            int maxViews)
        {
            if (workPart == null)
            {
                throw new ArgumentNullException("workPart");
            }

            DrawingSheet[] allSheets = workPart.DrawingSheets.ToArray() ??
                new DrawingSheet[0];
            int returnedSheetCount = Math.Min(allSheets.Length, maxSheets);
            bool sheetLimitTruncated = allSheets.Length > returnedSheetCount;
            bool viewLimitTruncated = false;
            int observedViewCount = 0;
            List<DraftingSheetNode> sheets = new List<DraftingSheetNode>();
            List<DraftingViewNode> views = new List<DraftingViewNode>();

            for (int sheetIndex = 0;
                sheetIndex < returnedSheetCount;
                sheetIndex++)
            {
                DrawingSheet sheet = allSheets[sheetIndex];
                if (sheet == null)
                {
                    continue;
                }

                DraftingView[] sheetViews = sheet.GetDraftingViews() ??
                    new DraftingView[0];
                observedViewCount += sheetViews.Length;
                int remainingViews = Math.Max(0, maxViews - views.Count);
                int returnedViews = Math.Min(
                    sheetViews.Length,
                    remainingViews);
                bool viewsTruncated = returnedViews < sheetViews.Length;
                if (viewsTruncated)
                {
                    viewLimitTruncated = true;
                }

                double scaleNumerator;
                double scaleDenominator;
                sheet.GetScale(out scaleNumerator, out scaleDenominator);
                sheets.Add(new DraftingSheetNode
                {
                    Index = sheetIndex,
                    JournalIdentifier = Bounded(
                        sheet.JournalIdentifier,
                        1024),
                    Name = Bounded(sheet.Name, 256),
                    Length = sheet.Length,
                    Height = sheet.Height,
                    Units = Bounded(sheet.Units.ToString(), 32),
                    ProjectionAngle = Bounded(
                        sheet.ProjectionAngle.ToString(),
                        32),
                    ScaleNumerator = scaleNumerator,
                    ScaleDenominator = scaleDenominator,
                    IsOutOfDate = sheet.IsOutOfDate,
                    ViewCount = sheetViews.Length,
                    ViewsTruncated = viewsTruncated ? (bool?)true : null
                });

                for (int viewIndex = 0;
                    viewIndex < returnedViews;
                    viewIndex++)
                {
                    DraftingView view = sheetViews[viewIndex];
                    if (view == null)
                    {
                        continue;
                    }
                    Point3d origin = view.Origin;
                    views.Add(new DraftingViewNode
                    {
                        Index = views.Count,
                        SheetIndex = sheetIndex,
                        JournalIdentifier = Bounded(
                            view.JournalIdentifier,
                            1024),
                        Name = Bounded(view.Name, 256),
                        Scale = view.Scale,
                        OriginX = origin.X,
                        OriginY = origin.Y,
                        OriginZ = origin.Z,
                        IsOutOfDate = view.IsOutOfDate,
                        IsBroken = view.IsBroken,
                        IsDecoration = view.IsDecoration,
                        IsSlave = view.IsSlave
                    });
                }
            }

            return new DraftingStructureSnapshot
            {
                HasDrawingSheets = allSheets.Length > 0,
                Sheets = sheets.ToArray(),
                Views = views.ToArray(),
                SheetCount = allSheets.Length,
                SheetCountComplete = true,
                ViewCount = observedViewCount,
                ViewCountComplete = !sheetLimitTruncated,
                SheetLimitTruncated = sheetLimitTruncated,
                ViewLimitTruncated = viewLimitTruncated
            };
        }

        private static AssemblyComponentNode ReadComponentNode(
            UFSession ufSession,
            Component component,
            int index,
            int parentIndex,
            int depth,
            int childCount)
        {
            string partName;
            string referenceSetName;
            string instanceName;
            double[] origin = new double[3];
            double[] coordinateSystem = new double[9];
            double[,] transform = new double[4, 4];
            ufSession.Assem.AskComponentData(
                component.Tag,
                out partName,
                out referenceSetName,
                out instanceName,
                origin,
                coordinateSystem,
                transform);

            string loadState = string.IsNullOrWhiteSpace(partName)
                ? "unknown"
                : (ufSession.Part.IsLoaded(partName) == 0
                    ? "unloaded"
                    : "loaded");
            string representationMode =
                component.GetComponentRepresentationMode().ToString();
            if (string.IsNullOrWhiteSpace(representationMode))
            {
                representationMode = "Unknown";
            }

            return new AssemblyComponentNode
            {
                Index = index,
                ParentIndex = parentIndex,
                Depth = depth,
                InstanceName = Bounded(instanceName, 256),
                DisplayName = Bounded(component.DisplayName, 256),
                PrototypePartIdentifier = PartIdentifier(partName),
                Suppressed = component.IsSuppressed,
                LoadState = loadState,
                RepresentationMode = Bounded(representationMode, 32),
                ChildCount = childCount,
                ChildrenTruncated = null
            };
        }

        private static void EnqueueBounded(
            Component[] children,
            int parentIndex,
            int depth,
            int maxComponents,
            int currentCount,
            Queue<AssemblyTraversalItem> pending,
            ref bool componentLimitTruncated)
        {
            foreach (Component child in children)
            {
                if (child == null)
                {
                    continue;
                }
                if (currentCount + pending.Count >= maxComponents)
                {
                    componentLimitTruncated = true;
                    break;
                }
                pending.Enqueue(new AssemblyTraversalItem
                {
                    Component = child,
                    ParentIndex = parentIndex,
                    Depth = depth
                });
            }
        }

        private static string PartIdentifier(string partName)
        {
            if (string.IsNullOrWhiteSpace(partName))
            {
                return string.Empty;
            }
            try
            {
                string leaf = Path.GetFileName(partName.Trim());
                return Bounded(
                    string.IsNullOrWhiteSpace(leaf) ? partName.Trim() : leaf,
                    256);
            }
            catch (ArgumentException)
            {
                return Bounded(partName.Trim(), 256);
            }
        }

        private static string Bounded(string value, int maxLength)
        {
            if (string.IsNullOrEmpty(value))
            {
                return string.Empty;
            }
            return value.Length <= maxLength
                ? value
                : value.Substring(0, maxLength);
        }

        public void CreateRevolved(
            Tag[] generatorTags,
            string[] limits,
            double[] axisPoint,
            double[] axisDirection,
            FeatureSigns sign,
            out Tag[] featureTags)
        {
            UFSession.GetUFSession().Modl.CreateRevolved(
                generatorTags,
                limits,
                axisPoint,
                axisDirection,
                sign,
                out featureTags);
        }

        public void CreateSimpleHole(
            double[] location,
            double[] direction,
            string diameter,
            string depth,
            string tipAngle,
            Tag startFace,
            Tag throughFace,
            out Tag featureTag)
        {
            UFSession.GetUFSession().Modl.CreateSimpleHole(
                location,
                direction,
                diameter,
                depth,
                tipAngle,
                startFace,
                throughFace,
                out featureTag);
        }

        public void UniteBodies(Tag targetBody, Tag toolBody)
        {
            UFSession.GetUFSession().Modl.UniteBodies(targetBody, toolBody);
        }

        public void SubtractBodies(
            Tag targetBody,
            Tag toolBody,
            out int resultBodyCount,
            out Tag[] resultingBodyTags)
        {
            UFSession.GetUFSession().Modl.SubtractBodies(
                targetBody,
                toolBody,
                out resultBodyCount,
                out resultingBodyTags);
        }

        public void IntersectBodies(
            Tag targetBody,
            Tag toolBody,
            out int resultBodyCount,
            out Tag[] resultingBodyTags)
        {
            UFSession.GetUFSession().Modl.IntersectBodies(
                targetBody,
                toolBody,
                out resultBodyCount,
                out resultingBodyTags);
        }

        public void CreateBlend(
            string radius,
            Tag[] edgeTags,
            double tolerance,
            out Tag featureTag)
        {
            UFSession.GetUFSession().Modl.CreateBlend(
                radius,
                edgeTags,
                0,
                0,
                0,
                tolerance,
                out featureTag);
        }

        public void CapturePng(string filePath)
        {
            // NX 12 marks this typed API obsolete but still ships it as the
            // stable graphics-area PNG capture entry point. Keep it isolated
            // inside the exact-version adapter and strict API contract.
#pragma warning disable 0618
            UFSession.GetUFSession().Disp.CreateImage(
                filePath,
                UFDisp.ImageFormat.Png,
                UFDisp.BackgroundColor.Original);
#pragma warning restore 0618
        }
    }

    internal sealed class UnsupportedNxVersionAdapter : INxVersionAdapter
    {
        private readonly string nxOpenAssemblyVersion;

        public UnsupportedNxVersionAdapter(Version nxOpenVersion)
        {
            nxOpenAssemblyVersion = nxOpenVersion == null
                ? "unknown"
                : nxOpenVersion.ToString();
        }

        public string Id
        {
            get { return "unsupported:" + nxOpenAssemblyVersion; }
        }

        public string ContractId { get { return "none"; } }

        public string CompatibilityStatus { get { return "unsupported"; } }

        public string NxOpenAssemblyVersion
        {
            get { return nxOpenAssemblyVersion; }
        }

        public string[] SupportedCapabilities
        {
            get { return NxCapabilityCatalog.ReadOnly(); }
        }

        public bool Supports(string operation)
        {
            foreach (string capability in SupportedCapabilities)
            {
                if (string.Equals(
                        capability,
                        operation,
                        StringComparison.Ordinal))
                {
                    return true;
                }
            }
            return false;
        }

        public ModuleCapabilityDetection DetectModuleCapability(
            Session session,
            string moduleName)
        {
            return new ModuleCapabilityDetection
            {
                Available = false,
                Licensed = false,
                UnsupportedReason =
                    "NXOpen assembly version " +
                    nxOpenAssemblyVersion +
                    " has no verified " +
                    moduleName +
                    " capability adapter."
            };
        }

        public AssemblyStructureSnapshot ReadAssemblyStructure(
            Part workPart,
            int maxDepth,
            int maxComponents)
        {
            throw Unsupported();
        }

        public DraftingStructureSnapshot ReadDraftingStructure(
            Part workPart,
            int maxSheets,
            int maxViews)
        {
            throw Unsupported();
        }

        private static BridgeFaultException Unsupported()
        {
            return new BridgeFaultException(
                "NX_VERSION_NOT_SUPPORTED",
                "This NXOpen assembly version has no verified typed adapter. Only read-only handshake and structured module detection operations are available.",
                false);
        }

        public void CreateRevolved(
            Tag[] generatorTags,
            string[] limits,
            double[] axisPoint,
            double[] axisDirection,
            FeatureSigns sign,
            out Tag[] featureTags)
        {
            featureTags = null;
            throw Unsupported();
        }

        public void CreateSimpleHole(
            double[] location,
            double[] direction,
            string diameter,
            string depth,
            string tipAngle,
            Tag startFace,
            Tag throughFace,
            out Tag featureTag)
        {
            featureTag = default(Tag);
            throw Unsupported();
        }

        public void UniteBodies(Tag targetBody, Tag toolBody)
        {
            throw Unsupported();
        }

        public void SubtractBodies(
            Tag targetBody,
            Tag toolBody,
            out int resultBodyCount,
            out Tag[] resultingBodyTags)
        {
            resultBodyCount = 0;
            resultingBodyTags = null;
            throw Unsupported();
        }

        public void IntersectBodies(
            Tag targetBody,
            Tag toolBody,
            out int resultBodyCount,
            out Tag[] resultingBodyTags)
        {
            resultBodyCount = 0;
            resultingBodyTags = null;
            throw Unsupported();
        }

        public void CreateBlend(
            string radius,
            Tag[] edgeTags,
            double tolerance,
            out Tag featureTag)
        {
            featureTag = default(Tag);
            throw Unsupported();
        }

        public void CapturePng(string filePath)
        {
            throw Unsupported();
        }
    }

    internal static class Nx12ReadOnlyModuleCapabilityDetector
    {
        public static ModuleCapabilityDetection Detect(
            Session session,
            string moduleName)
        {
            if (session == null)
            {
                return Unavailable("The NX session is unavailable.");
            }
            if (!IsSupportedModule(moduleName))
            {
                return Unavailable(
                    "NX 12.0.2.9 has no verified " +
                    moduleName +
                    " capability detector.");
            }

            try
            {
                string applicationName = session.ApplicationName;
                string[] activeLicenses = ReadActiveLicenses(
                    session.LicenseManager);
                return new ModuleCapabilityDetection
                {
                    Available = true,
                    Licensed = IsModuleLicensed(
                        moduleName,
                        applicationName,
                        activeLicenses),
                    UnsupportedReason = string.Empty
                };
            }
            catch (Exception ex)
            {
                return Unavailable(
                    "NX 12.0.2.9 read-only license detection failed: " +
                    ex.GetType().Name +
                    ".");
            }
        }

        internal static bool IsModuleLicensed(
            string moduleName,
            string applicationName,
            string[] activeLicenses)
        {
            string normalizedApplication = Normalize(applicationName);
            if (MatchesModule(moduleName, normalizedApplication))
            {
                return true;
            }

            if (activeLicenses == null)
            {
                return false;
            }
            foreach (string license in activeLicenses)
            {
                if (MatchesModule(moduleName, Normalize(license)))
                {
                    return true;
                }
            }
            return false;
        }

        private static bool IsSupportedModule(string moduleName)
        {
            return string.Equals(moduleName, "assembly", StringComparison.Ordinal) ||
                string.Equals(moduleName, "drafting", StringComparison.Ordinal) ||
                string.Equals(moduleName, "cae", StringComparison.Ordinal) ||
                string.Equals(moduleName, "cam", StringComparison.Ordinal);
        }

        private static bool MatchesModule(string moduleName, string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return false;
            }
            if (string.Equals(moduleName, "assembly", StringComparison.Ordinal))
            {
                return value.Contains("assembl");
            }
            if (string.Equals(moduleName, "drafting", StringComparison.Ordinal))
            {
                return value.Contains("draft");
            }
            if (string.Equals(moduleName, "cae", StringComparison.Ordinal))
            {
                return value.Contains("cae") ||
                    value.Contains("simulation") ||
                    value.Contains("simcenter") ||
                    value.Contains("masterfem") ||
                    value.Contains("designsim") ||
                    value.Contains("nastran") ||
                    value.Contains("desfem");
            }
            if (string.Equals(moduleName, "cam", StringComparison.Ordinal))
            {
                return value.Contains("cam") ||
                    value.Contains("manufactur") ||
                    value.Contains("machining");
            }
            return false;
        }

        private static string[] ReadActiveLicenses(LicenseManager manager)
        {
            if (manager == null)
            {
                return new string[0];
            }

            System.Collections.Generic.List<string> licenses =
                new System.Collections.Generic.List<string>();
            string[] bundles = manager.GetBundlesUsed();
            if (bundles == null)
            {
                return licenses.ToArray();
            }
            foreach (string bundle in bundles)
            {
                if (string.IsNullOrWhiteSpace(bundle))
                {
                    continue;
                }
                string[] active = manager.GetActiveLicensesInABundle(bundle);
                if (active != null)
                {
                    licenses.AddRange(active);
                }
            }
            return licenses.ToArray();
        }

        private static string Normalize(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            System.Text.StringBuilder normalized =
                new System.Text.StringBuilder(value.Length);
            foreach (char character in value)
            {
                if (char.IsLetterOrDigit(character))
                {
                    normalized.Append(char.ToLowerInvariant(character));
                }
            }
            return normalized.ToString();
        }

        private static ModuleCapabilityDetection Unavailable(string reason)
        {
            return new ModuleCapabilityDetection
            {
                Available = false,
                Licensed = false,
                UnsupportedReason = reason
            };
        }
    }
}
