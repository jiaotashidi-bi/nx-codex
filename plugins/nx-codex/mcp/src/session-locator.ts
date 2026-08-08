import { readFile, readdir, stat } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";

import {
  BridgeSessionSchema,
  type BridgeSession,
} from "./protocol.js";
import { BridgeUnavailableError } from "./errors.js";

export type LocatedSession = BridgeSession & {
  sessionFile: string;
};

const MAX_SESSION_FILE_BYTES = 8 * 1024;
const DISCOVERY_TIMEOUT_MS = 5_000;
const DISCOVERY_REQUEST = "NX_CODEX_DISCOVER 1\n";

function defaultSessionDirectory(): string {
  const localAppData =
    process.env.LOCALAPPDATA ??
    path.join(os.homedir(), "AppData", "Local");
  return path.join(localAppData, "NXCodex", "sessions");
}

function isProcessAlive(processId: number): boolean {
  try {
    process.kill(processId, 0);
    return true;
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    return code === "EPERM";
  }
}

async function readSessionFile(filePath: string): Promise<LocatedSession | null> {
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return null;
    }

    if (fileStat.size <= MAX_SESSION_FILE_BYTES) {
      try {
        const parsed: unknown = JSON.parse(await readFile(filePath, "utf8"));
        const session = validateLiveSession(parsed);
        if (session) {
          return { ...session, sessionFile: filePath };
        }
      } catch {
        // Enterprise DLP can encrypt files written by the NX process. The
        // same-user ACL discovery pipe is the non-file fallback.
      }
    }

    const processId = processIdFromSessionFile(filePath);
    if (processId === null || !isProcessAlive(processId)) {
      return null;
    }
    return await discoverThroughPipe(processId, filePath);
  } catch {
    return null;
  }
}

function validateLiveSession(value: unknown): BridgeSession | null {
  const parsed = BridgeSessionSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }
  const session = parsed.data;
  if (
    Date.parse(session.expiresUtc) <= Date.now() ||
    !isProcessAlive(session.processId)
  ) {
    return null;
  }
  return session;
}

function processIdFromSessionFile(filePath: string): number | null {
  const match = /^([1-9][0-9]*)\.json$/i.exec(path.basename(filePath));
  if (!match?.[1]) {
    return null;
  }
  const processId = Number(match[1]);
  return Number.isSafeInteger(processId) ? processId : null;
}

async function discoverThroughPipe(
  processId: number,
  sessionFile: string,
): Promise<LocatedSession | null> {
  if (process.platform !== "win32") {
    return null;
  }

  const target = `\\\\.\\pipe\\nx-codex-discovery-${processId}`;
  return await new Promise((resolve) => {
    let settled = false;
    let buffered = Buffer.alloc(0);
    const socket = net.createConnection(target);

    const finish = (session: LocatedSession | null): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(session);
    };

    const timer = setTimeout(() => finish(null), DISCOVERY_TIMEOUT_MS);
    socket.once("connect", () => socket.write(DISCOVERY_REQUEST, "ascii"));
    socket.on("data", (chunk: Buffer) => {
      buffered = Buffer.concat([buffered, chunk]);
      if (buffered.byteLength > MAX_SESSION_FILE_BYTES) {
        finish(null);
        return;
      }
      const newline = buffered.indexOf(0x0a);
      if (newline < 0) {
        return;
      }
      try {
        const raw: unknown = JSON.parse(
          buffered.subarray(0, newline).toString("utf8"),
        );
        const session = validateLiveSession(raw);
        finish(
          session?.processId === processId
            ? { ...session, sessionFile }
            : null,
        );
      } catch {
        finish(null);
      }
    });
    socket.once("error", () => finish(null));
    socket.once("end", () => finish(null));
  });
}

export class SessionLocator {
  public constructor(
    private readonly explicitFile = process.env.NX_CODEX_SESSION_FILE,
    private readonly sessionDirectory = defaultSessionDirectory(),
  ) {}

  public async discover(): Promise<LocatedSession> {
    if (this.explicitFile) {
      const resolved = path.resolve(this.explicitFile);
      const session = await readSessionFile(resolved);
      if (session) {
        return session;
      }
      throw new BridgeUnavailableError(
        `NX bridge session file is invalid or stale: ${resolved}`,
      );
    }

    let names: string[];
    try {
      names = await readdir(this.sessionDirectory);
    } catch {
      throw new BridgeUnavailableError(
        "No NX bridge session was found. Start Siemens NX and load NXCodexBridge.dll.",
      );
    }

    const candidates = (
      await Promise.all(
        names
          .filter((name) => name.endsWith(".json"))
          .map((name) =>
            readSessionFile(path.join(this.sessionDirectory, name)),
          ),
      )
    ).filter((session): session is LocatedSession => session !== null);

    candidates.sort(
      (left, right) =>
        Date.parse(right.createdUtc) - Date.parse(left.createdUtc),
    );

    const selected = candidates[0];
    if (!selected) {
      throw new BridgeUnavailableError(
        "No live NX bridge session was found. Start Siemens NX and load NXCodexBridge.dll.",
      );
    }
    return selected;
  }
}
