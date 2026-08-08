using System;
using System.IO;
using System.Reflection;
using System.Threading;

using NXOpen;

public class NXBridgeHostJournal
{
    public static void Main(string[] args)
    {
        if (args == null || (args.Length != 3 && args.Length != 4))
        {
            throw new ArgumentException(
                "Expected arguments: <bridge-dll> <stop-file> <status-file> [ReadOnly|CreatePart].");
        }

        string bridgeDll = Path.GetFullPath(args[0]);
        string stopFile = Path.GetFullPath(args[1]);
        string statusFile = Path.GetFullPath(args[2]);
        bool readOnly = args.Length == 4 &&
            string.Equals(args[3], "ReadOnly", StringComparison.Ordinal);
        Type entryPoint = null;
        Part smokePart = null;

        try
        {
            Session session = Session.GetSession();
            if (!readOnly)
            {
                smokePart = session.Parts.NewDisplay(
                    "NXCodexSmoke_" + Guid.NewGuid().ToString("N"),
                    Part.Units.Millimeters);
            }

            Assembly bridgeAssembly = Assembly.LoadFrom(bridgeDll);
            entryPoint = bridgeAssembly.GetType(
                "NXCodexBridge.EntryPoint",
                true);
            MethodInfo main = entryPoint.GetMethod(
                "Main",
                BindingFlags.Public | BindingFlags.Static);
            main.Invoke(null, new object[] { new string[0] });

            File.WriteAllText(statusFile, "ready");

            Type applicationType = null;
            foreach (Assembly loadedAssembly in
                AppDomain.CurrentDomain.GetAssemblies())
            {
                if (loadedAssembly.GetName().Name == "System.Windows.Forms")
                {
                    applicationType = loadedAssembly.GetType(
                        "System.Windows.Forms.Application",
                        true);
                    break;
                }
            }
            if (applicationType == null)
            {
                throw new InvalidOperationException(
                    "System.Windows.Forms was not loaded by the bridge.");
            }
            MethodInfo doEvents = applicationType.GetMethod(
                "DoEvents",
                BindingFlags.Public | BindingFlags.Static);
            DateTime deadline = DateTime.UtcNow.AddMinutes(2);
            while (!File.Exists(stopFile) && DateTime.UtcNow < deadline)
            {
                doEvents.Invoke(null, null);
                Thread.Sleep(10);
            }

            if (!File.Exists(stopFile))
            {
                throw new TimeoutException(
                    "The real-NX smoke test did not signal completion.");
            }
            File.WriteAllText(statusFile, "stopping");
        }
        catch (Exception ex)
        {
            File.WriteAllText(statusFile, "error" + Environment.NewLine + ex);
            throw;
        }
        finally
        {
            if (entryPoint != null)
            {
                try
                {
                    MethodInfo unload = entryPoint.GetMethod(
                        "UnloadLibrary",
                        BindingFlags.Public | BindingFlags.Static);
                    unload.Invoke(null, new object[] { string.Empty });
                }
                catch
                {
                }
            }

            if (smokePart != null)
            {
                try
                {
                    smokePart.Close(
                        BasePart.CloseWholeTree.False,
                        BasePart.CloseModified.CloseModified,
                        null);
                }
                catch
                {
                }
            }

            File.AppendAllText(
                statusFile,
                Environment.NewLine + "completed");
        }
    }

    public static int GetUnloadOption(string dummy)
    {
        return (int)Session.LibraryUnloadOption.Immediately;
    }
}
