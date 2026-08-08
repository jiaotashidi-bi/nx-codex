using System;

namespace NXCodexBridge
{
    internal static class JsonCodecContractTests
    {
        public static int Main()
        {
            string requestId = Guid.NewGuid().ToString();
            string prefix =
                "{\"protocolVersion\":\"1.0\",\"requestId\":\"" +
                requestId +
                "\",\"operation\":\"preflight_modeling\",\"token\":\"" +
                new string('a', 43) +
                "\",\"deadlineUtc\":\"2026-08-03T12:00:00.000Z\",\"arguments\":";
            string validJson =
                prefix +
                "{\"plannedOperation\":\"create_block\",\"length\":50," +
                "\"width\":30,\"height\":10,\"originX\":-25," +
                "\"originY\":-15,\"originZ\":0}}";

            BridgeRequest request = JsonCodec.DeserializeRequest(validJson);
            if (!string.Equals(request.RequestId, requestId, StringComparison.Ordinal) ||
                request.Arguments == null ||
                !string.Equals(
                    request.Arguments.PlannedOperation,
                    "create_block",
                    StringComparison.Ordinal))
            {
                throw new InvalidOperationException(
                    "Preflight request did not round-trip through the C# codec.");
            }

            string invalidJson = prefix + "{\"unexpected\":true}}";
            if (!string.Equals(
                JsonCodec.TryExtractRequestId(invalidJson),
                requestId,
                StringComparison.Ordinal))
            {
                throw new InvalidOperationException(
                    "A valid requestId was not preserved for an invalid request.");
            }

            try
            {
                JsonCodec.DeserializeRequest(invalidJson);
                throw new InvalidOperationException(
                    "Unknown argument fields were not rejected.");
            }
            catch (BridgeFaultException ex)
            {
                if (!string.Equals(ex.Code, "INVALID_REQUEST", StringComparison.Ordinal))
                {
                    throw;
                }
            }

            Console.WriteLine("NX bridge JSON codec contract passed.");
            return 0;
        }
    }
}
