using System;
using System.Diagnostics;
using System.IO;

namespace NXCodexBridge
{
    internal static class BridgeLifecycleContractTests
    {
        public static int Main()
        {
            TestUnpublishedDescriptorDoesNotDeleteExistingSession();
            TestPublishedDescriptorOwnsOnlyItsOwnFile();
            TestDuplicateDiscoveryServerFailsClearlyAndReleasesCleanly();
            Console.WriteLine("NX bridge lifecycle contract passed.");
            return 0;
        }

        private static void TestUnpublishedDescriptorDoesNotDeleteExistingSession()
        {
            string path = DescriptorPath();
            Directory.CreateDirectory(Path.GetDirectoryName(path));
            File.WriteAllText(path, "existing-session");
            try
            {
                using (SessionDescriptorStore store =
                    SessionDescriptorStore.Create())
                {
                }

                Require(File.Exists(path),
                    "An unpublished store deleted an existing descriptor.");
                Require(
                    File.ReadAllText(path) == "existing-session",
                    "An unpublished store changed an existing descriptor.");
            }
            finally
            {
                if (File.Exists(path))
                {
                    File.Delete(path);
                }
            }
        }

        private static void TestPublishedDescriptorOwnsOnlyItsOwnFile()
        {
            string path = DescriptorPath();
            using (SessionDescriptorStore store = SessionDescriptorStore.Create())
            {
                store.Publish();
                Require(File.Exists(path),
                    "A published descriptor was not created.");
            }
            Require(!File.Exists(path),
                "A store did not remove its own published descriptor.");
        }

        private static void TestDuplicateDiscoveryServerFailsClearlyAndReleasesCleanly()
        {
            BridgeSessionDescriptor descriptor = new BridgeSessionDescriptor
            {
                ProtocolVersion = Protocol.Version,
                PipeName = "unused",
                Token = "unused",
                ProcessId = Process.GetCurrentProcess().Id,
                CreatedUtc = DateTimeOffset.UtcNow.ToString("o"),
                ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(1).ToString("o")
            };

            using (SessionDiscoveryPipeServer first =
                new SessionDiscoveryPipeServer(descriptor))
            {
                first.Start();
                using (SessionDiscoveryPipeServer duplicate =
                    new SessionDiscoveryPipeServer(descriptor))
                {
                    bool rejected = false;
                    try
                    {
                        duplicate.Start();
                    }
                    catch (InvalidOperationException ex)
                    {
                        rejected =
                            ex.Message.IndexOf(
                                "Restart NX",
                                StringComparison.Ordinal) >= 0;
                    }
                    Require(rejected,
                        "A duplicate discovery server did not fail clearly.");
                }
            }

            using (SessionDiscoveryPipeServer replacement =
                new SessionDiscoveryPipeServer(descriptor))
            {
                replacement.Start();
            }
        }

        private static string DescriptorPath()
        {
            string localAppData = Environment.GetFolderPath(
                Environment.SpecialFolder.LocalApplicationData);
            return Path.Combine(
                localAppData,
                "NXCodex",
                "sessions",
                Process.GetCurrentProcess().Id + ".json");
        }

        private static void Require(bool condition, string message)
        {
            if (!condition)
            {
                throw new InvalidOperationException(message);
            }
        }
    }

    internal static class BridgeAuditLog
    {
        public static void Write(
            string requestId,
            string operation,
            bool ok,
            string errorCode,
            string internalMessage,
            int durationMs)
        {
        }
    }
}
