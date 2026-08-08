using System;

using NXOpen;

namespace NXCodexBridge
{
    public static class EntryPoint
    {
        private static readonly object SyncRoot = new object();
        private static Session session;
        private static NxUiDispatcher dispatcher;
        private static SessionDescriptorStore descriptorStore;
        private static SessionDiscoveryPipeServer discoveryServer;
        private static SecurePipeServer pipeServer;

        public static void Main(string[] args)
        {
            Start();
        }

        public static int Startup()
        {
            Start();
            return 0;
        }

        public static int GetUnloadOption(string dummy)
        {
            return (int)Session.LibraryUnloadOption.AtTermination;
        }

        public static void UnloadLibrary(string dummy)
        {
            Stop();
        }

        private static void Start()
        {
            lock (SyncRoot)
            {
                if (pipeServer != null)
                {
                    WriteListing("NX Codex bridge is already running.");
                    return;
                }

                try
                {
                    session = Session.GetSession();
                    dispatcher = new NxUiDispatcher();
                    NxOperationExecutor executor =
                        new NxOperationExecutor(session, dispatcher.Status);
                    descriptorStore = SessionDescriptorStore.Create();
                    discoveryServer = new SessionDiscoveryPipeServer(
                        descriptorStore.Descriptor);
                    pipeServer = new SecurePipeServer(
                        descriptorStore.Descriptor,
                        delegate(BridgeRequest request)
                        {
                            return dispatcher.Invoke(
                                delegate { return executor.Execute(request); },
                                TimeSpan.FromSeconds(5));
                        });
                    pipeServer.Start();
                    discoveryServer.Start();
                    descriptorStore.Publish();
                    WriteListing(
                        "NX Codex secure bridge started. Protocol " +
                        Protocol.Version +
                        ", PID " +
                        descriptorStore.Descriptor.ProcessId +
                        ".");
                }
                catch (Exception ex)
                {
                    BridgeAuditLog.Write(
                        null,
                        "bridge_startup",
                        false,
                        "STARTUP_ERROR",
                        ex.Message,
                        0);
                    WriteListing(
                        "NX Codex bridge failed to start: " + ex.Message);
                    StopUnsafe();
                    throw;
                }
            }
        }

        private static void Stop()
        {
            lock (SyncRoot)
            {
                StopUnsafe();
            }
        }

        private static void StopUnsafe()
        {
            if (pipeServer != null)
            {
                pipeServer.Dispose();
                pipeServer = null;
            }
            if (discoveryServer != null)
            {
                discoveryServer.Dispose();
                discoveryServer = null;
            }
            if (descriptorStore != null)
            {
                descriptorStore.Dispose();
                descriptorStore = null;
            }
            if (dispatcher != null)
            {
                dispatcher.Dispose();
                dispatcher = null;
            }
            WriteListing("NX Codex bridge stopped.");
            session = null;
        }

        private static void WriteListing(string message)
        {
            try
            {
                Session current = session ?? Session.GetSession();
                current.ListingWindow.Open();
                current.ListingWindow.WriteLine(message);
            }
            catch
            {
            }
        }
    }
}
