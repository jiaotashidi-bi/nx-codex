using System;
using System.Reflection;
using System.Runtime.ExceptionServices;
using System.Threading;
using System.Windows.Forms;

namespace NXCodexBridge
{
    internal sealed class NxUiDispatcher : IDisposable
    {
        private readonly Control control;
        private readonly int ownerThreadId;

        public NxUiDispatcher()
        {
            ownerThreadId = Thread.CurrentThread.ManagedThreadId;
            control = new Control();
            control.CreateControl();
            if (!control.IsHandleCreated)
            {
                throw new InvalidOperationException(
                    "Unable to create the NX UI dispatch handle.");
            }
        }

        public string Status
        {
            get { return "winforms-main-thread"; }
        }

        public T Invoke<T>(Func<T> callback, TimeSpan queueTimeout)
        {
            if (callback == null)
            {
                throw new ArgumentNullException("callback");
            }
            if (Thread.CurrentThread.ManagedThreadId == ownerThreadId)
            {
                return callback();
            }

            using (DispatchWork<T> work = new DispatchWork<T>(callback))
            {
                try
                {
                    control.BeginInvoke(new Action(work.Execute));
                }
                catch (Exception ex)
                {
                    throw new BridgeFaultException(
                        "DISPATCH_UNAVAILABLE",
                        "NX UI dispatcher rejected the operation: " + ex.Message,
                        true);
                }

                if (!work.Started.WaitOne(queueTimeout))
                {
                    if (work.TryCancel())
                    {
                        throw new BridgeFaultException(
                            "NX_UI_BUSY",
                            "NX did not begin the operation before the queue deadline. The queued operation was cancelled.",
                            true);
                    }
                }

                work.Completed.WaitOne();
                if (work.Error != null)
                {
                    ExceptionDispatchInfo.Capture(work.Error).Throw();
                    throw new TargetInvocationException(
                        "NX UI operation failed.",
                        work.Error);
                }
                return work.Result;
            }
        }

        public void Dispose()
        {
            if (Thread.CurrentThread.ManagedThreadId == ownerThreadId)
            {
                control.Dispose();
                return;
            }

            try
            {
                control.BeginInvoke(new Action(control.Dispose));
            }
            catch
            {
            }
        }

        private sealed class DispatchWork<T> : IDisposable
        {
            private readonly object syncRoot = new object();
            private readonly Func<T> callback;
            private int state;

            public DispatchWork(Func<T> callback)
            {
                this.callback = callback;
                Started = new ManualResetEvent(false);
                Completed = new ManualResetEvent(false);
            }

            public ManualResetEvent Started { get; private set; }
            public ManualResetEvent Completed { get; private set; }
            public T Result { get; private set; }
            public Exception Error { get; private set; }

            public void Execute()
            {
                lock (syncRoot)
                {
                    if (state != 0)
                    {
                        return;
                    }
                    state = 1;
                    Started.Set();
                }

                try
                {
                    Result = callback();
                }
                catch (Exception ex)
                {
                    Error = ex;
                }
                finally
                {
                    lock (syncRoot)
                    {
                        state = 2;
                        Completed.Set();
                    }
                }
            }

            public bool TryCancel()
            {
                lock (syncRoot)
                {
                    if (state != 0)
                    {
                        return false;
                    }
                    state = 3;
                    Started.Set();
                    Completed.Set();
                    return true;
                }
            }

            public void Dispose()
            {
                Started.Dispose();
                Completed.Dispose();
            }
        }
    }
}
