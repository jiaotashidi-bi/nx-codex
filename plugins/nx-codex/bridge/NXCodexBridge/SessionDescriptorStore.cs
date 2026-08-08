using System;
using System.Diagnostics;
using System.IO;
using System.Security.AccessControl;
using System.Security.Cryptography;
using System.Security.Principal;

namespace NXCodexBridge
{
    internal sealed class SessionDescriptorStore : IDisposable
    {
        private readonly SecurityIdentifier owner;
        private string publishedJson;

        private SessionDescriptorStore(
            BridgeSessionDescriptor descriptor,
            string descriptorPath,
            SecurityIdentifier owner)
        {
            Descriptor = descriptor;
            DescriptorPath = descriptorPath;
            this.owner = owner;
        }

        public BridgeSessionDescriptor Descriptor { get; private set; }
        public string DescriptorPath { get; private set; }

        public static SessionDescriptorStore Create()
        {
            WindowsIdentity identity = WindowsIdentity.GetCurrent();
            if (identity == null || identity.User == null)
            {
                throw new InvalidOperationException(
                    "Unable to determine the current Windows security identifier.");
            }

            int processId = Process.GetCurrentProcess().Id;
            DateTimeOffset now = DateTimeOffset.UtcNow;
            BridgeSessionDescriptor descriptor = new BridgeSessionDescriptor
            {
                ProtocolVersion = Protocol.Version,
                PipeName = "nx-codex-" + processId + "-" + RandomHex(6),
                Token = RandomToken(),
                ProcessId = processId,
                CreatedUtc = now.ToString("o"),
                ExpiresUtc = now.AddHours(24).ToString("o")
            };

            string localAppData =
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string directory = Path.Combine(localAppData, "NXCodex", "sessions");
            SecureDirectory(directory, identity.User);
            string descriptorPath =
                Path.Combine(directory, processId.ToString() + ".json");

            return new SessionDescriptorStore(
                descriptor,
                descriptorPath,
                identity.User);
        }

        public void Publish()
        {
            string json = JsonCodec.SerializeDescriptor(Descriptor);
            File.WriteAllText(DescriptorPath, json);
            publishedJson = json;

            FileSecurity security = new FileSecurity();
            security.SetAccessRuleProtection(true, false);
            security.SetOwner(owner);
            security.AddAccessRule(
                new FileSystemAccessRule(
                    owner,
                    FileSystemRights.FullControl,
                    AccessControlType.Allow));
            File.SetAccessControl(DescriptorPath, security);
        }

        public void Dispose()
        {
            try
            {
                if (publishedJson != null && File.Exists(DescriptorPath))
                {
                    string currentJson = File.ReadAllText(DescriptorPath);
                    if (string.Equals(
                        currentJson,
                        publishedJson,
                        StringComparison.Ordinal))
                    {
                        File.Delete(DescriptorPath);
                    }
                }
            }
            catch
            {
            }
            finally
            {
                publishedJson = null;
            }
        }

        private static void SecureDirectory(
            string directory,
            SecurityIdentifier owner)
        {
            Directory.CreateDirectory(directory);
            DirectorySecurity security = new DirectorySecurity();
            security.SetAccessRuleProtection(true, false);
            security.SetOwner(owner);
            security.AddAccessRule(
                new FileSystemAccessRule(
                    owner,
                    FileSystemRights.FullControl,
                    InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit,
                    PropagationFlags.None,
                    AccessControlType.Allow));
            Directory.SetAccessControl(directory, security);
        }

        private static string RandomToken()
        {
            byte[] bytes = new byte[32];
            using (RandomNumberGenerator generator = RandomNumberGenerator.Create())
            {
                generator.GetBytes(bytes);
            }
            return Convert.ToBase64String(bytes);
        }

        private static string RandomHex(int byteCount)
        {
            byte[] bytes = new byte[byteCount];
            using (RandomNumberGenerator generator = RandomNumberGenerator.Create())
            {
                generator.GetBytes(bytes);
            }
            return BitConverter.ToString(bytes).Replace("-", string.Empty).ToLowerInvariant();
        }
    }
}
