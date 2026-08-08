using System;
using System.IO;
using System.IO.Pipes;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace NXCodexBridge
{
    internal sealed class SessionDiscoveryPipeServer : IDisposable
    {
        private const string DiscoveryRequest = "NX_CODEX_DISCOVER 1";
        private const int MaxDiscoveryRequestBytes = 128;

        private readonly BridgeSessionDescriptor descriptor;
        private readonly SecurityIdentifier owner;
        private readonly ManualResetEvent ready = new ManualResetEvent(false);
        private readonly ManualResetEvent startupFailed =
            new ManualResetEvent(false);
        private readonly object pipeLock = new object();
        private Thread thread;
        private NamedPipeServerStream activePipe;
        private Exception startupException;
        private volatile bool stopping;

        public SessionDiscoveryPipeServer(BridgeSessionDescriptor descriptor)
        {
            this.descriptor = descriptor;
            WindowsIdentity identity = WindowsIdentity.GetCurrent();
            if (identity == null || identity.User == null)
            {
                throw new InvalidOperationException(
                    "Unable to determine the current Windows identity.");
            }
            owner = identity.User;
        }

        public static string PipeNameFor(int processId)
        {
            return "nx-codex-discovery-" + processId;
        }

        public void Start()
        {
            if (thread != null)
            {
                throw new InvalidOperationException(
                    "Session discovery pipe is already running.");
            }

            thread = new Thread(Run)
            {
                IsBackground = true,
                Name = "NXCodexSessionDiscoveryPipe"
            };
            thread.Start();
            int startupResult = WaitHandle.WaitAny(
                new WaitHandle[] { ready, startupFailed },
                TimeSpan.FromSeconds(5));
            if (startupResult == 1)
            {
                Exception failure = startupException;
                Stop();
                throw new InvalidOperationException(
                    "Another NX Codex bridge is already active in this NX " +
                    "process. Restart NX before loading a different bridge DLL.",
                    failure);
            }
            if (startupResult == WaitHandle.WaitTimeout)
            {
                Stop();
                throw new InvalidOperationException(
                    "Session discovery pipe did not become ready.");
            }
        }

        public void Stop()
        {
            stopping = true;
            lock (pipeLock)
            {
                if (activePipe != null)
                {
                    try
                    {
                        activePipe.Dispose();
                    }
                    catch
                    {
                    }
                }
            }
            if (thread != null && thread.IsAlive)
            {
                thread.Join(TimeSpan.FromSeconds(5));
            }
            thread = null;
        }

        public void Dispose()
        {
            Stop();
            ready.Dispose();
            startupFailed.Dispose();
        }

        private void Run()
        {
            bool first = true;
            while (!stopping)
            {
                try
                {
                    using (NamedPipeServerStream pipe = CreatePipe())
                    {
                        lock (pipeLock)
                        {
                            activePipe = pipe;
                        }
                        if (first)
                        {
                            first = false;
                            ready.Set();
                        }

                        pipe.WaitForConnection();
                        if (!stopping)
                        {
                            HandleOne(pipe);
                        }
                    }
                }
                catch (ObjectDisposedException)
                {
                    if (!stopping)
                    {
                        Thread.Sleep(100);
                    }
                }
                catch (Exception ex)
                {
                    if (!stopping)
                    {
                        if (first)
                        {
                            startupException = ex;
                            startupFailed.Set();
                        }
                        BridgeAuditLog.Write(
                            null,
                            "session_discovery",
                            false,
                            "DISCOVERY_PIPE_ERROR",
                            ex.Message,
                            0);
                        if (first)
                        {
                            return;
                        }
                        Thread.Sleep(250);
                    }
                }
                finally
                {
                    lock (pipeLock)
                    {
                        activePipe = null;
                    }
                }
            }
        }

        private NamedPipeServerStream CreatePipe()
        {
            PipeSecurity security = new PipeSecurity();
            security.SetAccessRuleProtection(true, false);
            security.SetOwner(owner);
            security.AddAccessRule(
                new PipeAccessRule(
                    owner,
                    PipeAccessRights.FullControl,
                    AccessControlType.Allow));

            return new NamedPipeServerStream(
                PipeNameFor(descriptor.ProcessId),
                PipeDirection.InOut,
                1,
                PipeTransmissionMode.Byte,
                PipeOptions.Asynchronous,
                MaxDiscoveryRequestBytes,
                Protocol.MaxResponseBytes,
                security);
        }

        private void HandleOne(NamedPipeServerStream pipe)
        {
            string request = ReadLine(pipe);
            if (request.EndsWith("\r", StringComparison.Ordinal))
            {
                request = request.Substring(0, request.Length - 1);
            }
            if (!string.Equals(
                request,
                DiscoveryRequest,
                StringComparison.Ordinal))
            {
                return;
            }

            string response = JsonCodec.SerializeDescriptor(descriptor) + "\n";
            byte[] bytes = Encoding.UTF8.GetBytes(response);
            if (bytes.Length > Protocol.MaxResponseBytes)
            {
                throw new InvalidOperationException(
                    "Session descriptor exceeded the response limit.");
            }
            pipe.Write(bytes, 0, bytes.Length);
            pipe.Flush();
        }

        private static string ReadLine(Stream stream)
        {
            using (MemoryStream buffer = new MemoryStream())
            {
                byte[] oneByte = new byte[1];
                while (buffer.Length <= MaxDiscoveryRequestBytes)
                {
                    Task<int> read = stream.ReadAsync(oneByte, 0, 1);
                    if (!read.Wait(TimeSpan.FromSeconds(5)))
                    {
                        throw new TimeoutException(
                            "Session discovery request timed out.");
                    }
                    if (read.Result == 0)
                    {
                        break;
                    }
                    if (oneByte[0] == (byte)'\n')
                    {
                        return Encoding.ASCII.GetString(buffer.ToArray());
                    }
                    buffer.WriteByte(oneByte[0]);
                }
            }

            throw new InvalidDataException(
                "Session discovery request was invalid or too large.");
        }
    }
}
