using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Web.Script.Serialization;

namespace NXCodexBridge
{
    internal static class JsonCodec
    {
        private static readonly HashSet<string> RootFields =
            new HashSet<string>(StringComparer.Ordinal)
            {
                "protocolVersion",
                "requestId",
                "operation",
                "token",
                "deadlineUtc",
                "arguments"
            };

        private static readonly HashSet<string> ArgumentFields =
            new HashSet<string>(StringComparer.Ordinal)
            {
                "length",
                "width",
                "height",
                "originX",
                "originY",
                "originZ",
                "profileWidth",
                "profileHeight",
                "centerX",
                "centerY",
                "planeZ",
                "sketchFeatureJournalIdentifier",
                "distance",
                "axisDirection",
                "axisOriginX",
                "axisOriginY",
                "axisOriginZ",
                "holeCenterX",
                "holeCenterY",
                "holeDiameter",
                "booleanOperation",
                "targetFeatureJournalIdentifier",
                "toolFeatureJournalIdentifier",
                "bodyFeatureJournalIdentifier",
                "filletRadius",
                "name",
                "transactionId",
                "filePath",
                "partUnits",
                "stepFormat",
                "plannedOperation",
                "maxDepth",
                "maxComponents",
                "maxSheets",
                "maxViews"
            };

        public static BridgeRequest DeserializeRequest(string json)
        {
            ValidateShape(json);
            try
            {
                return Deserialize<BridgeRequest>(json);
            }
            catch (BridgeFaultException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    "INVALID_REQUEST",
                    "JSON did not match the request contract: " + ex.Message,
                    false);
            }
        }

        public static string TryExtractRequestId(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return null;
            }

            try
            {
                JavaScriptSerializer parser = new JavaScriptSerializer
                {
                    MaxJsonLength = Protocol.MaxRequestBytes,
                    RecursionLimit = 16
                };
                IDictionary<string, object> root =
                    parser.DeserializeObject(json) as IDictionary<string, object>;
                if (root == null)
                {
                    return null;
                }

                object value;
                string requestId =
                    root.TryGetValue("requestId", out value) ? value as string : null;
                Guid parsedId;
                return Guid.TryParse(requestId, out parsedId) ? requestId : null;
            }
            catch
            {
                return null;
            }
        }

        public static string SerializeResponse(BridgeResponse response)
        {
            return Serialize(response);
        }

        public static string SerializeDescriptor(BridgeSessionDescriptor descriptor)
        {
            return Serialize(descriptor);
        }

        private static T Deserialize<T>(string json)
        {
            byte[] bytes = Encoding.UTF8.GetBytes(json);
            using (MemoryStream stream = new MemoryStream(bytes, false))
            {
                DataContractJsonSerializer serializer =
                    new DataContractJsonSerializer(
                        typeof(T),
                        new DataContractJsonSerializerSettings
                        {
                            MaxItemsInObjectGraph = 256
                        });
                object value = serializer.ReadObject(stream);
                if (!(value is T))
                {
                    throw new BridgeFaultException(
                        "INVALID_REQUEST",
                        "JSON did not match the expected request type.",
                        false);
                }
                return (T)value;
            }
        }

        private static string Serialize<T>(T value)
        {
            using (MemoryStream stream = new MemoryStream())
            {
                DataContractJsonSerializer serializer =
                    new DataContractJsonSerializer(
                        typeof(T),
                        new DataContractJsonSerializerSettings
                        {
                            MaxItemsInObjectGraph = 4096
                        });
                serializer.WriteObject(stream, value);
                return Encoding.UTF8.GetString(stream.ToArray());
            }
        }

        private static void ValidateShape(string json)
        {
            JavaScriptSerializer parser = new JavaScriptSerializer
            {
                MaxJsonLength = Protocol.MaxRequestBytes,
                RecursionLimit = 16
            };

            object parsed;
            try
            {
                parsed = parser.DeserializeObject(json);
            }
            catch (Exception ex)
            {
                throw new BridgeFaultException(
                    "INVALID_JSON",
                    "Request is not valid JSON: " + ex.Message,
                    false);
            }

            IDictionary<string, object> root =
                parsed as IDictionary<string, object>;
            if (root == null)
            {
                throw new BridgeFaultException(
                    "INVALID_REQUEST",
                    "Request root must be a JSON object.",
                    false);
            }

            RejectUnknownFields(root, RootFields, "request");
            object argumentsValue;
            if (!root.TryGetValue("arguments", out argumentsValue))
            {
                throw new BridgeFaultException(
                    "INVALID_REQUEST",
                    "Request arguments are required.",
                    false);
            }

            IDictionary<string, object> arguments =
                argumentsValue as IDictionary<string, object>;
            if (arguments == null)
            {
                throw new BridgeFaultException(
                    "INVALID_REQUEST",
                    "Request arguments must be a JSON object.",
                    false);
            }

            RejectUnknownFields(arguments, ArgumentFields, "arguments");
            foreach (KeyValuePair<string, object> entry in arguments)
            {
                if (entry.Value is IDictionary || entry.Value is IList)
                {
                    throw new BridgeFaultException(
                        "INVALID_REQUEST",
                        "Nested argument objects and arrays are not allowed.",
                        false);
                }
            }
        }

        private static void RejectUnknownFields(
            IDictionary<string, object> values,
            HashSet<string> allowed,
            string location)
        {
            foreach (string key in values.Keys)
            {
                if (!allowed.Contains(key))
                {
                    throw new BridgeFaultException(
                        "INVALID_REQUEST",
                        "Unknown " + location + " field: " + key,
                        false);
                }
            }
        }
    }
}
