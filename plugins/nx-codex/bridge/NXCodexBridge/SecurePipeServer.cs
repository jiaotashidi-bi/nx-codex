using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Pipes;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace NXCodexBridge
{
    internal sealed class SecurePipeServer : IDisposable
    {
        private readonly BridgeSessionDescriptor descriptor;
        private readonly Func<BridgeRequest, BridgeResult> handler;
        private readonly SecurityIdentifier owner;
        private readonly HashSet<string> requestIds =
            new HashSet<string>(StringComparer.Ordinal);
        private readonly Queue<string> requestIdOrder = new Queue<string>();
        private readonly ManualResetEvent ready = new ManualResetEvent(false);
        private readonly object pipeLock = new object();
        private Thread thread;
        private NamedPipeServerStream activePipe;
        private volatile bool stopping;

        public SecurePipeServer(
            BridgeSessionDescriptor descriptor,
            Func<BridgeRequest, BridgeResult> handler)
        {
            this.descriptor = descriptor;
            this.handler = handler;
            WindowsIdentity identity = WindowsIdentity.GetCurrent();
            if (identity == null || identity.User == null)
            {
                throw new InvalidOperationException(
                    "Unable to determine the current Windows identity.");
            }
            owner = identity.User;
        }

        public void Start()
        {
            if (thread != null)
            {
                throw new InvalidOperationException("Pipe server is already running.");
            }

            thread = new Thread(Run)
            {
                IsBackground = true,
                Name = "NXCodexSecurePipeServer"
            };
            thread.Start();
            if (!ready.WaitOne(TimeSpan.FromSeconds(5)))
            {
                Stop();
                throw new InvalidOperationException(
                    "Named Pipe server did not become ready.");
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
                        BridgeAuditLog.Write(
                            null,
                            "server",
                            false,
                            "PIPE_SERVER_ERROR",
                            ex.Message,
                            0);
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
                descriptor.PipeName,
                PipeDirection.InOut,
                1,
                PipeTransmissionMode.Byte,
                PipeOptions.Asynchronous,
                Protocol.MaxRequestBytes,
                Protocol.MaxResponseBytes,
                security);
        }

        private void HandleOne(NamedPipeServerStream pipe)
        {
            Stopwatch stopwatch = Stopwatch.StartNew();
            BridgeRequest request = null;
            string responseRequestId = null;
            BridgeResponse response;

            try
            {
                string line = ReadLineWithLimit(pipe);
                responseRequestId = JsonCodec.TryExtractRequestId(line);
                request = JsonCodec.DeserializeRequest(line);
                ValidateRequest(request);
                RememberRequestId(request.RequestId);
                BridgeResult result = handler(request);
                response = new BridgeResponse
                {
                    ProtocolVersion = Protocol.Version,
                    RequestId = request.RequestId,
                    Ok = true,
                    Result = result,
                    Error = null,
                    DurationMs = ElapsedMilliseconds(stopwatch)
                };
            }
            catch (BridgeFaultException ex)
            {
                response = Failure(
                    request == null
                        ? responseRequestId ?? Guid.NewGuid().ToString()
                        : request.RequestId,
                    ex.Code,
                    ex.Message,
                    ex.Retryable,
                    stopwatch);
            }
            catch (Exception ex)
            {
                response = Failure(
                    request == null
                        ? responseRequestId ?? Guid.NewGuid().ToString()
                        : request.RequestId,
                    "INTERNAL_ERROR",
                    "The NX bridge encountered an internal error.",
                    false,
                    stopwatch);
                BridgeAuditLog.Write(
                    response.RequestId,
                    request == null ? "unknown" : request.Operation,
                    false,
                    "INTERNAL_ERROR",
                    ex.Message,
                    response.DurationMs);
            }

            string json = JsonCodec.SerializeResponse(response);
            byte[] bytes = Encoding.UTF8.GetBytes(json + "\n");
            if (bytes.Length > Protocol.MaxResponseBytes)
            {
                response = Failure(
                    response.RequestId,
                    "RESPONSE_TOO_LARGE",
                    "Bridge response exceeded the configured maximum.",
                    false,
                    stopwatch);
                bytes = Encoding.UTF8.GetBytes(
                    JsonCodec.SerializeResponse(response) + "\n");
            }

            pipe.Write(bytes, 0, bytes.Length);
            pipe.Flush();
            BridgeAuditLog.Write(
                response.RequestId,
                request == null ? "unknown" : request.Operation,
                response.Ok,
                response.Error == null ? null : response.Error.Code,
                null,
                response.DurationMs);
        }

        private void ValidateRequest(BridgeRequest request)
        {
            if (request == null ||
                !string.Equals(
                    request.ProtocolVersion,
                    Protocol.Version,
                    StringComparison.Ordinal))
            {
                throw new BridgeFaultException(
                    "PROTOCOL_MISMATCH",
                    "Unsupported bridge protocol version.",
                    false);
            }

            Guid parsedId;
            if (!Guid.TryParse(request.RequestId, out parsedId))
            {
                throw new BridgeFaultException(
                    "INVALID_REQUEST_ID",
                    "requestId must be a UUID.",
                    false);
            }
            if (!FixedTimeEquals(request.Token, descriptor.Token))
            {
                throw new BridgeFaultException(
                    "UNAUTHORIZED",
                    "Session token was rejected.",
                    false);
            }

            DateTimeOffset deadline;
            if (!DateTimeOffset.TryParse(request.DeadlineUtc, out deadline))
            {
                throw new BridgeFaultException(
                    "INVALID_DEADLINE",
                    "deadlineUtc must be an ISO-8601 timestamp.",
                    false);
            }
            DateTimeOffset now = DateTimeOffset.UtcNow;
            if (deadline <= now)
            {
                throw new BridgeFaultException(
                    "DEADLINE_EXCEEDED",
                    "Request deadline has expired.",
                    true);
            }
            if (deadline > now.AddMinutes(2))
            {
                throw new BridgeFaultException(
                    "INVALID_DEADLINE",
                    "Request deadline cannot be more than two minutes ahead.",
                    false);
            }
            if (requestIds.Contains(request.RequestId))
            {
                throw new BridgeFaultException(
                    "REPLAY_DETECTED",
                    "requestId has already been used.",
                    false);
            }
        }

        private void RememberRequestId(string requestId)
        {
            requestIds.Add(requestId);
            requestIdOrder.Enqueue(requestId);
            while (requestIdOrder.Count > 512)
            {
                requestIds.Remove(requestIdOrder.Dequeue());
            }
        }

        private static string ReadLineWithLimit(Stream stream)
        {
            using (MemoryStream buffer = new MemoryStream())
            {
                byte[] chunk = new byte[4096];
                while (buffer.Length <= Protocol.MaxRequestBytes)
                {
                    Task<int> read = stream.ReadAsync(chunk, 0, chunk.Length);
                    if (!read.Wait(TimeSpan.FromSeconds(5)))
                    {
                        throw new BridgeFaultException(
                            "READ_TIMEOUT",
                            "Client did not send a complete request in time.",
                            true);
                    }
                    if (read.Result == 0)
                    {
                        break;
                    }

                    int newline = Array.IndexOf(
                        chunk,
                        (byte)'\n',
                        0,
                        read.Result);
                    int count = newline < 0 ? read.Result : newline;
                    buffer.Write(chunk, 0, count);
                    if (newline >= 0)
                    {
                        return Encoding.UTF8.GetString(buffer.ToArray());
                    }
                }
            }

            throw new BridgeFaultException(
                "REQUEST_TOO_LARGE",
                "Request exceeded 64 KiB or did not end with a newline.",
                false);
        }

        private static bool FixedTimeEquals(string left, string right)
        {
            if (left == null || right == null)
            {
                return false;
            }
            byte[] leftBytes = Encoding.UTF8.GetBytes(left);
            byte[] rightBytes = Encoding.UTF8.GetBytes(right);
            int difference = leftBytes.Length ^ rightBytes.Length;
            int length = Math.Max(leftBytes.Length, rightBytes.Length);
            for (int index = 0; index < length; index++)
            {
                byte leftByte =
                    index < leftBytes.Length ? leftBytes[index] : (byte)0;
                byte rightByte =
                    index < rightBytes.Length ? rightBytes[index] : (byte)0;
                difference |= leftByte ^ rightByte;
            }
            return difference == 0;
        }

        private static BridgeResponse Failure(
            string requestId,
            string code,
            string message,
            bool retryable,
            Stopwatch stopwatch)
        {
            return new BridgeResponse
            {
                ProtocolVersion = Protocol.Version,
                RequestId = requestId,
                Ok = false,
                Result = null,
                Error = new BridgeError
                {
                    Code = code,
                    Message = message,
                    Retryable = retryable
                },
                DurationMs = ElapsedMilliseconds(stopwatch)
            };
        }

        private static int ElapsedMilliseconds(Stopwatch stopwatch)
        {
            return (int)Math.Min(int.MaxValue, stopwatch.ElapsedMilliseconds);
        }
    }

    internal static class BridgeAuditLog
    {
        private static readonly object SyncRoot = new object();

        public static void Write(
            string requestId,
            string operation,
            bool ok,
            string errorCode,
            string internalMessage,
            int durationMs)
        {
            try
            {
                string localAppData =
                    Environment.GetFolderPath(
                        Environment.SpecialFolder.LocalApplicationData);
                string directory = Path.Combine(localAppData, "NXCodex", "logs");
                Directory.CreateDirectory(directory);
                string path = Path.Combine(directory, "bridge-audit.tsv");
                string cleanInternal =
                    string.IsNullOrWhiteSpace(internalMessage)
                        ? string.Empty
                        : internalMessage.Replace('\t', ' ').Replace('\r', ' ').Replace('\n', ' ');
                string line = string.Join(
                    "\t",
                    DateTimeOffset.UtcNow.ToString("o"),
                    requestId ?? string.Empty,
                    operation ?? string.Empty,
                    ok ? "ok" : "error",
                    errorCode ?? string.Empty,
                    durationMs.ToString(),
                    cleanInternal);
                lock (SyncRoot)
                {
                    File.AppendAllText(path, line + Environment.NewLine);
                }
            }
            catch
            {
            }
        }
    }
}
