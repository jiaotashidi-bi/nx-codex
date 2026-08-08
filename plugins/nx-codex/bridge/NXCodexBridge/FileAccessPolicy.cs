using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Security.Principal;
using System.Web.Script.Serialization;

namespace NXCodexBridge
{
    internal enum FilePathIntent
    {
        Open,
        Create
    }

    internal sealed class FileAccessPolicy
    {
        private const int MaxPolicyBytes = 16 * 1024;
        private const int MaxPathLength = 240;
        private readonly string[] allowedRoots;

        private FileAccessPolicy(string[] roots)
        {
            allowedRoots = roots;
        }

        public string[] AllowedRoots
        {
            get { return (string[])allowedRoots.Clone(); }
        }

        public static FileAccessPolicy Load()
        {
            string configured =
                Environment.GetEnvironmentVariable("NX_CODEX_POLICY_FILE");
            string file = string.IsNullOrWhiteSpace(configured)
                ? Path.Combine(
                    Environment.GetFolderPath(
                        Environment.SpecialFolder.LocalApplicationData),
                    "NXCodex",
                    "policy.json")
                : configured;

            if (!File.Exists(file))
            {
                throw new BridgeFaultException(
                    "POLICY_UNAVAILABLE",
                    "NX Codex file policy is unavailable. Run configure-file-policy.ps1 first.",
                    false);
            }

            FileInfo policyInfo = new FileInfo(file);
            if (policyInfo.Length > MaxPolicyBytes)
            {
                throw PolicyInvalid("The policy exceeds 16 KiB.");
            }
            VerifyPolicyOwner(file);

            object parsed;
            try
            {
                JavaScriptSerializer serializer = new JavaScriptSerializer
                {
                    MaxJsonLength = MaxPolicyBytes,
                    RecursionLimit = 8
                };
                parsed = serializer.DeserializeObject(File.ReadAllText(file));
            }
            catch (BridgeFaultException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw PolicyInvalid("The policy is not valid JSON: " + ex.Message);
            }

            IDictionary<string, object> root =
                parsed as IDictionary<string, object>;
            if (root == null ||
                root.Count != 2 ||
                !root.ContainsKey("version") ||
                !root.ContainsKey("allowedRoots"))
            {
                throw PolicyInvalid(
                    "The policy must contain only version and allowedRoots.");
            }

            int version;
            try
            {
                version = Convert.ToInt32(root["version"]);
            }
            catch
            {
                throw PolicyInvalid("Policy version must be the integer 1.");
            }
            if (version != 1)
            {
                throw PolicyInvalid("Unsupported policy version.");
            }

            object[] values = root["allowedRoots"] as object[];
            if (values == null || values.Length < 1 || values.Length > 8)
            {
                throw PolicyInvalid(
                    "allowedRoots must contain between one and eight paths.");
            }

            List<string> roots = new List<string>();
            foreach (object value in values)
            {
                string supplied = value as string;
                string canonical = ValidateWindowsSyntax(
                    supplied,
                    "Allowed root");
                if (!Directory.Exists(canonical))
                {
                    throw PolicyInvalid(
                        "An allowed root does not exist: " + canonical);
                }
                AssertNoReparsePoints(canonical, true);
                canonical = canonical.TrimEnd(
                    Path.DirectorySeparatorChar,
                    Path.AltDirectorySeparatorChar);
                if (!roots.Exists(
                    delegate(string existing)
                    {
                        return string.Equals(
                            existing,
                            canonical,
                            StringComparison.OrdinalIgnoreCase);
                    }))
                {
                    roots.Add(canonical);
                }
            }
            return new FileAccessPolicy(roots.ToArray());
        }

        public string ValidatePartPath(
            string suppliedPath,
            FilePathIntent intent)
        {
            string candidate = ValidateWindowsSyntax(suppliedPath, "filePath");
            if (!string.Equals(
                Path.GetExtension(candidate),
                ".prt",
                StringComparison.OrdinalIgnoreCase))
            {
                throw PathNotAllowed("Only Siemens NX .prt files are allowed.");
            }
            if (!IsInsideAllowedRoot(candidate))
            {
                throw PathNotAllowed(
                    "filePath is outside every configured allowed root.");
            }

            AssertNoReparsePoints(candidate, false);
            bool exists = File.Exists(candidate);
            if (Directory.Exists(candidate))
            {
                throw PathNotAllowed("filePath must refer to a regular file.");
            }
            if (exists &&
                (File.GetAttributes(candidate) & FileAttributes.ReparsePoint) != 0)
            {
                throw PathNotAllowed(
                    "Reparse files are forbidden by the file policy.");
            }
            if (intent == FilePathIntent.Open && !exists)
            {
                throw new BridgeFaultException(
                    "FILE_NOT_FOUND",
                    "The requested NX part does not exist.",
                    false);
            }
            if (intent == FilePathIntent.Create && exists)
            {
                throw new BridgeFaultException(
                    "TARGET_EXISTS",
                    "The destination already exists; NX Codex never overwrites a part.",
                    false);
            }

            string parent = Path.GetDirectoryName(candidate);
            if (string.IsNullOrWhiteSpace(parent) || !Directory.Exists(parent))
            {
                throw PathNotAllowed(
                    "The destination directory does not exist.");
            }
            string canonical = Path.Combine(
                new DirectoryInfo(parent).FullName,
                Path.GetFileName(candidate));
            if (!IsInsideAllowedRoot(canonical))
            {
                throw PathNotAllowed(
                    "Canonical filePath escapes every configured allowed root.");
            }
            return canonical;
        }

        public string ValidateStepPath(
            string suppliedPath,
            FilePathIntent intent)
        {
            string candidate = ValidateWindowsSyntax(suppliedPath, "filePath");
            string extension = Path.GetExtension(candidate);
            if (!string.Equals(extension, ".stp", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(extension, ".step", StringComparison.OrdinalIgnoreCase))
            {
                throw PathNotAllowed(
                    "Only STEP .stp or .step export files are allowed.");
            }
            if (!IsInsideAllowedRoot(candidate))
            {
                throw PathNotAllowed(
                    "filePath is outside every configured allowed root.");
            }

            AssertNoReparsePoints(candidate, false);
            bool exists = File.Exists(candidate);
            if (Directory.Exists(candidate))
            {
                throw PathNotAllowed("filePath must refer to a regular file.");
            }
            if (exists &&
                (File.GetAttributes(candidate) & FileAttributes.ReparsePoint) != 0)
            {
                throw PathNotAllowed(
                    "Reparse files are forbidden by the file policy.");
            }
            if (intent == FilePathIntent.Create && exists)
            {
                throw new BridgeFaultException(
                    "TARGET_EXISTS",
                    "The STEP destination already exists; NX Codex never overwrites exports.",
                    false);
            }

            string parent = Path.GetDirectoryName(candidate);
            if (string.IsNullOrWhiteSpace(parent) || !Directory.Exists(parent))
            {
                throw PathNotAllowed(
                    "The destination directory does not exist.");
            }
            string canonical = Path.Combine(
                new DirectoryInfo(parent).FullName,
                Path.GetFileName(candidate));
            if (!IsInsideAllowedRoot(canonical))
            {
                throw PathNotAllowed(
                    "Canonical filePath escapes every configured allowed root.");
            }
            return canonical;
        }

        public string ValidatePngPath(
            string suppliedPath,
            FilePathIntent intent)
        {
            string candidate = ValidateWindowsSyntax(suppliedPath, "filePath");
            if (!string.Equals(
                Path.GetExtension(candidate),
                ".png",
                StringComparison.OrdinalIgnoreCase))
            {
                throw PathNotAllowed(
                    "Only PNG .png screenshot files are allowed.");
            }
            if (!IsInsideAllowedRoot(candidate))
            {
                throw PathNotAllowed(
                    "filePath is outside every configured allowed root.");
            }

            AssertNoReparsePoints(candidate, false);
            bool exists = File.Exists(candidate);
            if (Directory.Exists(candidate))
            {
                throw PathNotAllowed("filePath must refer to a regular file.");
            }
            if (exists &&
                (File.GetAttributes(candidate) & FileAttributes.ReparsePoint) != 0)
            {
                throw PathNotAllowed(
                    "Reparse files are forbidden by the file policy.");
            }
            if (intent == FilePathIntent.Create && exists)
            {
                throw new BridgeFaultException(
                    "TARGET_EXISTS",
                    "The screenshot destination already exists; NX Codex never overwrites evidence files.",
                    false);
            }

            string parent = Path.GetDirectoryName(candidate);
            if (string.IsNullOrWhiteSpace(parent) || !Directory.Exists(parent))
            {
                throw PathNotAllowed(
                    "The destination directory does not exist.");
            }
            string canonical = Path.Combine(
                new DirectoryInfo(parent).FullName,
                Path.GetFileName(candidate));
            if (!IsInsideAllowedRoot(canonical))
            {
                throw PathNotAllowed(
                    "Canonical filePath escapes every configured allowed root.");
            }
            return canonical;
        }

        private bool IsInsideAllowedRoot(string candidate)
        {
            foreach (string root in allowedRoots)
            {
                if (string.Equals(
                    candidate,
                    root,
                    StringComparison.OrdinalIgnoreCase) ||
                    candidate.StartsWith(
                        root + Path.DirectorySeparatorChar,
                        StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
            return false;
        }

        private static string ValidateWindowsSyntax(
            string supplied,
            string label)
        {
            if (string.IsNullOrEmpty(supplied) ||
                supplied.Length > MaxPathLength)
            {
                throw PathNotAllowed(
                    label + " must be between 1 and 240 characters.");
            }
            if (supplied.StartsWith(@"\\", StringComparison.Ordinal) ||
                supplied.StartsWith("//", StringComparison.Ordinal) ||
                supplied.StartsWith(@"\\?\", StringComparison.Ordinal) ||
                supplied.StartsWith(@"\\.\", StringComparison.Ordinal) ||
                supplied.StartsWith(@"\??\", StringComparison.Ordinal))
            {
                throw PathNotAllowed(
                    label + " must be a local drive path; UNC and device paths are forbidden.");
            }
            if (supplied.Length < 3 ||
                !char.IsLetter(supplied[0]) ||
                supplied[1] != ':' ||
                (supplied[2] != '\\' && supplied[2] != '/'))
            {
                throw PathNotAllowed(
                    label + " must be an absolute local Windows path.");
            }
            if (supplied.IndexOf(':', 2) >= 0)
            {
                throw PathNotAllowed(
                    label + " must not contain an alternate data stream.");
            }

            string relative = supplied.Substring(3);
            string[] segments = relative.Split(
                new[] { '\\', '/' },
                StringSplitOptions.None);
            foreach (string segment in segments)
            {
                if (segment.Length == 0 ||
                    segment == "." ||
                    segment == ".." ||
                    segment.EndsWith(".", StringComparison.Ordinal) ||
                    segment.EndsWith(" ", StringComparison.Ordinal) ||
                    IsReservedDeviceName(segment))
                {
                    throw PathNotAllowed(
                        label + " contains a forbidden Windows path segment.");
                }
            }

            string full;
            try
            {
                full = Path.GetFullPath(supplied);
            }
            catch (Exception ex)
            {
                throw PathNotAllowed(
                    label + " could not be canonicalized: " + ex.Message);
            }
            return full;
        }

        private static bool IsReservedDeviceName(string segment)
        {
            string name = Path.GetFileNameWithoutExtension(segment);
            if (string.Equals(name, "CON", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(name, "PRN", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(name, "AUX", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(name, "NUL", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
            if (name.Length == 4)
            {
                string prefix = name.Substring(0, 3);
                char suffix = name[3];
                if (suffix >= '1' && suffix <= '9' &&
                    (string.Equals(
                        prefix,
                        "COM",
                        StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(
                        prefix,
                        "LPT",
                        StringComparison.OrdinalIgnoreCase)))
                {
                    return true;
                }
            }
            return false;
        }

        private static void AssertNoReparsePoints(
            string absolutePath,
            bool includeLeaf)
        {
            string root = Path.GetPathRoot(absolutePath);
            string relative = absolutePath.Substring(root.Length);
            string[] segments = relative.Split(
                new[] { Path.DirectorySeparatorChar },
                StringSplitOptions.RemoveEmptyEntries);
            int count = includeLeaf
                ? segments.Length
                : Math.Max(0, segments.Length - 1);
            string current = root;
            for (int index = 0; index < count; index++)
            {
                current = Path.Combine(current, segments[index]);
                if (!File.Exists(current) && !Directory.Exists(current))
                {
                    throw PathNotAllowed(
                        "A required path component does not exist.");
                }
                if ((File.GetAttributes(current) &
                     FileAttributes.ReparsePoint) != 0)
                {
                    throw PathNotAllowed(
                        "Symbolic links and directory junctions are forbidden by the file policy.");
                }
            }
        }

        private static void VerifyPolicyOwner(string file)
        {
            try
            {
                SecurityIdentifier owner = File.GetAccessControl(file)
                    .GetOwner(typeof(SecurityIdentifier))
                    as SecurityIdentifier;
                WindowsIdentity identity = WindowsIdentity.GetCurrent();
                if (owner == null ||
                    identity == null ||
                    identity.User == null ||
                    !owner.Equals(identity.User))
                {
                    throw PolicyInvalid(
                        "The policy file must be owned by the current Windows user.");
                }
            }
            catch (BridgeFaultException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw PolicyInvalid(
                    "The policy owner could not be verified: " + ex.Message);
            }
        }

        private static BridgeFaultException PathNotAllowed(string message)
        {
            return new BridgeFaultException(
                "PATH_NOT_ALLOWED",
                message,
                false);
        }

        private static BridgeFaultException PolicyInvalid(string message)
        {
            return new BridgeFaultException(
                "POLICY_INVALID",
                message,
                false);
        }
    }
}
