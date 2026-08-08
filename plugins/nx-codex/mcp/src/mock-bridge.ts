import { createHash, randomBytes, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";

import {
  BridgeRequestSchema,
  MAX_REQUEST_BYTES,
  PROTOCOL_VERSION,
  type BridgeRequest,
  type BridgeArguments,
  type AssemblyComponentNode,
  type BridgeResponse,
  type BridgeResult,
  type BridgeSession,
  type DraftingSheetNode,
  type DraftingViewNode,
} from "./protocol.js";
import { PathPolicyError } from "./errors.js";
import {
  validatePartPath,
  validatePngPath,
  validateStepPath,
} from "./path-policy.js";
import { selectVersionProfile } from "./version-adapter.js";
import {
  DeterministicFaultInjector,
  type DeterministicFault,
} from "./fault-injection.js";

async function removeTransientFile(filePath: string): Promise<void> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await rm(filePath, { force: true });
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? "";
      if (!["EBUSY", "EPERM"].includes(code) || attempt === 5) throw error;
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 25 * (attempt + 1));
      });
    }
  }
}

export type MockBridgeOptions = {
  sessionFile?: string;
  nxVersion?: string;
  application?: string;
  currentPart?: string;
  corruptSessionFile?: boolean;
  allowedRoots?: string[];
  licensedModules?: Partial<
    Record<"assembly" | "drafting" | "cae" | "cam", boolean>
  >;
  assemblyRoot?: MockAssemblyComponent | null;
  draftingSheets?: MockDraftingSheet[];
  faults?: readonly DeterministicFault[];
};

export type MockAssemblyComponent = {
  instanceName: string;
  displayName: string;
  prototypePartIdentifier: string;
  suppressed: boolean;
  loadState: "loaded" | "unloaded" | "unknown";
  representationMode: "Exact" | "Lightweight" | "None" | "Partial" | "Unknown";
  children?: MockAssemblyComponent[];
};

export type MockDraftingView = {
  journalIdentifier: string;
  name: string;
  scale: number;
  originX: number;
  originY: number;
  originZ: number;
  isOutOfDate: boolean;
  isBroken: boolean;
  isDecoration: boolean;
  isSlave: boolean;
};

export type MockDraftingSheet = {
  journalIdentifier: string;
  name: string;
  length: number;
  height: number;
  units: "Millimeters" | "Inches";
  projectionAngle: "FirstAngle" | "ThirdAngle";
  scaleNumerator: number;
  scaleDenominator: number;
  isOutOfDate: boolean;
  views?: MockDraftingView[];
};

type MockSolid = {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  surfaceArea: number;
  volume: number;
  centroidX: number;
  centroidY: number;
  centroidZ: number;
  axisAlignedBox?: boolean;
};

type MockBooleanOperation = "UNITE" | "SUBTRACT" | "INTERSECT";

type MockFeature = {
  kind:
    | "block"
    | "rectangleSketch"
    | "extrude"
    | "revolve"
    | "hole"
    | "boolean"
    | "fillet";
  transactionId: string;
  journalIdentifier: string;
  name: string;
  parentJournalIdentifiers?: string[];
  profile?: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    planeZ: number;
  };
  solid?: MockSolid;
  hole?: {
    centerX: number;
    centerY: number;
    diameter: number;
    targetJournalIdentifier: string;
    previousSolid: MockSolid;
  };
  boolean?: {
    targetJournalIdentifier: string;
    toolJournalIdentifier: string;
    previousTargetSolid: MockSolid;
    previousToolSolid: MockSolid;
  };
  fillet?: {
    targetJournalIdentifier: string;
    radius: number;
    previousSolid: MockSolid;
  };
};

type PendingMockAssemblyComponent = {
  component: MockAssemblyComponent;
  parentIndex: number;
  depth: number;
};

function boundedAssemblyText(value: string): string {
  return value.length <= 256 ? value : value.slice(0, 256);
}

function boundedAssemblyStructure(
  root: MockAssemblyComponent,
  maxDepth: number,
  maxComponents: number,
): {
  rootComponent: AssemblyComponentNode;
  components: AssemblyComponentNode[];
  componentCountComplete: boolean;
  depthTruncated: boolean;
  componentLimitTruncated: boolean;
  fingerprint: string;
} {
  const rootChildren = root.children ?? [];
  let depthTruncated = maxDepth === 0 && rootChildren.length > 0;
  let componentLimitTruncated = false;
  const rootComponent: AssemblyComponentNode = {
    index: 0,
    parentIndex: null,
    depth: 0,
    instanceName: boundedAssemblyText(root.instanceName),
    displayName: boundedAssemblyText(root.displayName),
    prototypePartIdentifier: boundedAssemblyText(root.prototypePartIdentifier),
    suppressed: root.suppressed,
    loadState: root.loadState,
    representationMode: root.representationMode,
    childCount: rootChildren.length,
    ...(depthTruncated ? { childrenTruncated: true } : {}),
  };
  const components: AssemblyComponentNode[] = [];
  const pending: PendingMockAssemblyComponent[] = [];

  const enqueue = (
    children: MockAssemblyComponent[],
    parentIndex: number,
    depth: number,
  ): boolean => {
    let truncated = false;
    for (const child of children) {
      if (components.length + pending.length >= maxComponents) {
        componentLimitTruncated = true;
        truncated = true;
        break;
      }
      pending.push({ component: child, parentIndex, depth });
    }
    return truncated;
  };

  if (maxDepth > 0 && enqueue(rootChildren, 0, 1)) {
    rootComponent.childrenTruncated = true;
  }

  while (pending.length > 0 && components.length < maxComponents) {
    const item = pending.shift();
    if (item === undefined) break;
    const children = item.component.children ?? [];
    const node: AssemblyComponentNode = {
      index: components.length + 1,
      parentIndex: item.parentIndex,
      depth: item.depth,
      instanceName: boundedAssemblyText(item.component.instanceName),
      displayName: boundedAssemblyText(item.component.displayName),
      prototypePartIdentifier: boundedAssemblyText(
        item.component.prototypePartIdentifier,
      ),
      suppressed: item.component.suppressed,
      loadState: item.component.loadState,
      representationMode: item.component.representationMode,
      childCount: children.length,
    };
    components.push(node);

    if (item.depth >= maxDepth && children.length > 0) {
      depthTruncated = true;
      node.childrenTruncated = true;
    } else if (children.length > 0 && enqueue(children, node.index, item.depth + 1)) {
      node.childrenTruncated = true;
    }
  }
  if (pending.length > 0) componentLimitTruncated = true;

  const componentCountComplete =
    !depthTruncated && !componentLimitTruncated;
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        rootComponent,
        components,
        depthTruncated,
        componentLimitTruncated,
      }),
      "utf8",
    )
    .digest("hex");
  return {
    rootComponent,
    components,
    componentCountComplete,
    depthTruncated,
    componentLimitTruncated,
    fingerprint,
  };
}

function boundedDraftingStructure(
  configuredSheets: MockDraftingSheet[],
  maxSheets: number,
  maxViews: number,
): {
  sheets: DraftingSheetNode[];
  views: DraftingViewNode[];
  sheetCount: number;
  viewCount: number;
  viewCountComplete: boolean;
  sheetLimitTruncated: boolean;
  viewLimitTruncated: boolean;
  fingerprint: string;
} {
  const returnedConfiguredSheets = configuredSheets.slice(0, maxSheets);
  const sheetLimitTruncated =
    returnedConfiguredSheets.length < configuredSheets.length;
  let viewLimitTruncated = false;
  let viewCount = 0;
  const sheets: DraftingSheetNode[] = [];
  const views: DraftingViewNode[] = [];

  for (const [sheetIndex, configuredSheet] of
    returnedConfiguredSheets.entries()) {
    const configuredViews = configuredSheet.views ?? [];
    viewCount += configuredViews.length;
    const remainingViews = Math.max(0, maxViews - views.length);
    const returnedConfiguredViews = configuredViews.slice(0, remainingViews);
    const viewsTruncated =
      returnedConfiguredViews.length < configuredViews.length;
    if (viewsTruncated) viewLimitTruncated = true;
    sheets.push({
      index: sheetIndex,
      journalIdentifier: configuredSheet.journalIdentifier.slice(0, 1024),
      name: configuredSheet.name.slice(0, 256),
      length: configuredSheet.length,
      height: configuredSheet.height,
      units: configuredSheet.units,
      projectionAngle: configuredSheet.projectionAngle,
      scaleNumerator: configuredSheet.scaleNumerator,
      scaleDenominator: configuredSheet.scaleDenominator,
      isOutOfDate: configuredSheet.isOutOfDate,
      viewCount: configuredViews.length,
      ...(viewsTruncated ? { viewsTruncated: true } : {}),
    });
    for (const configuredView of returnedConfiguredViews) {
      views.push({
        index: views.length,
        sheetIndex,
        journalIdentifier: configuredView.journalIdentifier.slice(0, 1024),
        name: configuredView.name.slice(0, 256),
        scale: configuredView.scale,
        originX: configuredView.originX,
        originY: configuredView.originY,
        originZ: configuredView.originZ,
        isOutOfDate: configuredView.isOutOfDate,
        isBroken: configuredView.isBroken,
        isDecoration: configuredView.isDecoration,
        isSlave: configuredView.isSlave,
      });
    }
  }

  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        sheetCount: configuredSheets.length,
        viewCount,
        viewCountComplete: !sheetLimitTruncated,
        sheets,
        views,
        sheetLimitTruncated,
        viewLimitTruncated,
      }),
      "utf8",
    )
    .digest("hex");
  return {
    sheets,
    views,
    sheetCount: configuredSheets.length,
    viewCount,
    viewCountComplete: !sheetLimitTruncated,
    sheetLimitTruncated,
    viewLimitTruncated,
    fingerprint,
  };
}

function success(
  request: BridgeRequest,
  result: BridgeResult,
  started: number,
): BridgeResponse {
  return {
    protocolVersion: PROTOCOL_VERSION,
    requestId: request.requestId,
    ok: true,
    result,
    error: null,
    durationMs: Date.now() - started,
  };
}

function failure(
  requestId: string,
  code: string,
  message: string,
  started: number,
  retryable = false,
): BridgeResponse {
  return {
    protocolVersion: PROTOCOL_VERSION,
    requestId,
    ok: false,
    result: null,
    error: { code, message, retryable },
    durationMs: Date.now() - started,
  };
}

function boxesHavePositiveOverlap(
  first: MockSolid,
  second: MockSolid,
): boolean {
  const tolerance = 1e-6;
  return (
    Math.min(first.maxX, second.maxX) - Math.max(first.minX, second.minX) >
      tolerance &&
    Math.min(first.maxY, second.maxY) - Math.max(first.minY, second.minY) >
      tolerance &&
    Math.min(first.maxZ, second.maxZ) - Math.max(first.minZ, second.minZ) >
      tolerance
  );
}

function booleanAxisAlignedSolids(
  target: MockSolid,
  tool: MockSolid,
  operation: MockBooleanOperation,
): MockSolid | null {
  const xs = [...new Set([target.minX, target.maxX, tool.minX, tool.maxX])].sort(
    (a, b) => a - b,
  );
  const ys = [...new Set([target.minY, target.maxY, tool.minY, tool.maxY])].sort(
    (a, b) => a - b,
  );
  const zs = [...new Set([target.minZ, target.maxZ, tool.minZ, tool.maxZ])].sort(
    (a, b) => a - b,
  );
  const occupied = new Set<string>();
  const key = (x: number, y: number, z: number) => `${x}:${y}:${z}`;
  let volume = 0;
  let firstMomentX = 0;
  let firstMomentY = 0;
  let firstMomentZ = 0;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < xs.length - 1; i += 1) {
    for (let j = 0; j < ys.length - 1; j += 1) {
      for (let k = 0; k < zs.length - 1; k += 1) {
        const x0 = xs[i];
        const x1 = xs[i + 1];
        const y0 = ys[j];
        const y1 = ys[j + 1];
        const z0 = zs[k];
        const z1 = zs[k + 1];
        if (
          x0 === undefined ||
          x1 === undefined ||
          y0 === undefined ||
          y1 === undefined ||
          z0 === undefined ||
          z1 === undefined
        ) {
          throw new Error("Strict fake Boolean partition was incomplete.");
        }
        const centerX = (x0 + x1) / 2;
        const centerY = (y0 + y1) / 2;
        const centerZ = (z0 + z1) / 2;
        const inTarget =
          centerX > target.minX &&
          centerX < target.maxX &&
          centerY > target.minY &&
          centerY < target.maxY &&
          centerZ > target.minZ &&
          centerZ < target.maxZ;
        const inTool =
          centerX > tool.minX &&
          centerX < tool.maxX &&
          centerY > tool.minY &&
          centerY < tool.maxY &&
          centerZ > tool.minZ &&
          centerZ < tool.maxZ;
        const included =
          operation === "UNITE"
            ? inTarget || inTool
            : operation === "SUBTRACT"
              ? inTarget && !inTool
              : inTarget && inTool;
        if (!included) continue;

        occupied.add(key(i, j, k));
        const cellVolume = (x1 - x0) * (y1 - y0) * (z1 - z0);
        volume += cellVolume;
        firstMomentX += centerX * cellVolume;
        firstMomentY += centerY * cellVolume;
        firstMomentZ += centerZ * cellVolume;
        minX = Math.min(minX, x0);
        minY = Math.min(minY, y0);
        minZ = Math.min(minZ, z0);
        maxX = Math.max(maxX, x1);
        maxY = Math.max(maxY, y1);
        maxZ = Math.max(maxZ, z1);
      }
    }
  }
  if (occupied.size === 0 || volume <= 0) return null;

  let surfaceArea = 0;
  for (const cellKey of occupied) {
    const indices = cellKey.split(":").map(Number);
    const i = indices[0];
    const j = indices[1];
    const k = indices[2];
    if (i === undefined || j === undefined || k === undefined) {
      throw new Error("Strict fake Boolean cell key was invalid.");
    }
    const x0 = xs[i];
    const x1 = xs[i + 1];
    const y0 = ys[j];
    const y1 = ys[j + 1];
    const z0 = zs[k];
    const z1 = zs[k + 1];
    if (
      x0 === undefined ||
      x1 === undefined ||
      y0 === undefined ||
      y1 === undefined ||
      z0 === undefined ||
      z1 === undefined
    ) {
      throw new Error("Strict fake Boolean surface partition was incomplete.");
    }
    const areaX = (y1 - y0) * (z1 - z0);
    const areaY = (x1 - x0) * (z1 - z0);
    const areaZ = (x1 - x0) * (y1 - y0);
    if (!occupied.has(key(i - 1, j, k))) surfaceArea += areaX;
    if (!occupied.has(key(i + 1, j, k))) surfaceArea += areaX;
    if (!occupied.has(key(i, j - 1, k))) surfaceArea += areaY;
    if (!occupied.has(key(i, j + 1, k))) surfaceArea += areaY;
    if (!occupied.has(key(i, j, k - 1))) surfaceArea += areaZ;
    if (!occupied.has(key(i, j, k + 1))) surfaceArea += areaZ;
  }

  const boundingVolume = (maxX - minX) * (maxY - minY) * (maxZ - minZ);
  return {
    minX,
    minY,
    minZ,
    maxX,
    maxY,
    maxZ,
    surfaceArea,
    volume,
    centroidX: firstMomentX / volume,
    centroidY: firstMomentY / volume,
    centroidZ: firstMomentZ / volume,
    axisAlignedBox: Math.abs(volume - boundingVolume) <= 1e-9,
  };
}

export class MockBridge {
  private readonly token = randomBytes(32).toString("base64url");
  private readonly pipeName = `nx-codex-${process.pid}-${randomBytes(6).toString("hex")}`;
  private readonly features: MockFeature[] = [];
  private readonly pendingTransactions: string[] = [];
  private readonly requestIds = new Set<string>();
  private readonly draftingSheets: MockDraftingSheet[];
  private currentPart: string | null = "mock-part.prt";
  private modified = false;
  private testDrawingTransactionId: string | null = null;
  private server: net.Server | null = null;
  private discoveryServer: net.Server | null = null;
  private readonly sessionFile: string;
  private readonly faultInjector: DeterministicFaultInjector;

  public constructor(private readonly options: MockBridgeOptions = {}) {
    this.currentPart = options.currentPart ?? "mock-part.prt";
    this.draftingSheets = (options.draftingSheets ?? []).map((sheet) => ({
      ...sheet,
      views: (sheet.views ?? []).map((view) => ({ ...view })),
    }));
    this.faultInjector = new DeterministicFaultInjector(options.faults ?? []);
    this.sessionFile =
      options.sessionFile ??
      path.join(
        os.tmpdir(),
        `nx-codex-mock-session-${process.pid}-${randomUUID()}.json`,
      );
  }

  public get descriptorPath(): string {
    return this.sessionFile;
  }

  public get faultEvents() {
    return this.faultInjector.events;
  }

  public get remainingFaultRuleIds(): readonly string[] {
    return this.faultInjector.remainingRuleIds;
  }

  public async start(): Promise<void> {
    if (process.platform !== "win32") {
      throw new Error("The mock Named Pipe bridge currently supports Windows only.");
    }
    if (this.server) {
      throw new Error("Mock bridge is already running.");
    }

    this.server = net.createServer((socket) => {
      let buffered = Buffer.alloc(0);

      socket.on("data", (chunk: Buffer) => {
        buffered = Buffer.concat([buffered, chunk]);
        if (buffered.byteLength > MAX_REQUEST_BYTES) {
          socket.end(
            `${JSON.stringify(
              failure(
                randomUUID(),
                "REQUEST_TOO_LARGE",
                "Request exceeded 64 KiB.",
                Date.now(),
              ),
            )}\n`,
          );
          return;
        }

        const newline = buffered.indexOf(0x0a);
        if (newline < 0) {
          return;
        }

        const line = buffered.subarray(0, newline).toString("utf8");
        void this.handleLine(line).then(async (response) => {
          const parsed = this.parseRequestForFaults(line);
          const afterFault =
            response?.ok === true && parsed !== undefined
              ? this.faultInjector.take(
                  "after_execution",
                  parsed.operation,
                  parsed.requestId,
                )
              : undefined;
          if (afterFault !== undefined) {
            const disposition = await this.applyFault(afterFault);
            if (disposition === null) {
              socket.destroy();
            }
            return;
          }
          if (response === null) {
            socket.destroy();
            return;
          }
          if (response === undefined) {
            // A modal-dialog/timeout fault deliberately leaves the pipe open.
            // The client owns the deadline and will close its side.
            return;
          }
          socket.end(`${JSON.stringify(response)}\n`);
        });
      });
    });

    await new Promise<void>((resolve, reject) => {
      this.server?.once("error", reject);
      this.server?.listen(`\\\\.\\pipe\\${this.pipeName}`, resolve);
    });

    const now = Date.now();
    const descriptor: BridgeSession = {
      protocolVersion: PROTOCOL_VERSION,
      pipeName: this.pipeName,
      token: this.token,
      processId: process.pid,
      createdUtc: new Date(now).toISOString(),
      expiresUtc: new Date(now + 8 * 60 * 60 * 1000).toISOString(),
    };
    if (this.options.corruptSessionFile) {
      this.discoveryServer = net.createServer((socket) => {
        let request = Buffer.alloc(0);
        socket.on("data", (chunk: Buffer) => {
          request = Buffer.concat([request, chunk]);
          const newline = request.indexOf(0x0a);
          if (newline < 0) {
            return;
          }
          if (
            request.subarray(0, newline).toString("ascii") ===
            "NX_CODEX_DISCOVER 1"
          ) {
            socket.end(`${JSON.stringify(descriptor)}\n`);
          } else {
            socket.destroy();
          }
        });
      });
      await new Promise<void>((resolve, reject) => {
        this.discoveryServer?.once("error", reject);
        this.discoveryServer?.listen(
          `\\\\.\\pipe\\nx-codex-discovery-${process.pid}`,
          resolve,
        );
      });
    }
    await mkdir(path.dirname(this.sessionFile), {
      recursive: true,
      mode: 0o700,
    });
    if (this.options.corruptSessionFile) {
      await writeFile(
        this.sessionFile,
        Buffer.from([0x88, 0x7d, 0x1c, 0x28, 0x00, 0xff]),
        { mode: 0o600 },
      );
    } else {
      await writeFile(this.sessionFile, JSON.stringify(descriptor), {
        encoding: "utf8",
        mode: 0o600,
      });
    }
  }

  public async stop(): Promise<void> {
    const server = this.server;
    this.server = null;
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    const discoveryServer = this.discoveryServer;
    this.discoveryServer = null;
    if (discoveryServer) {
      await new Promise<void>((resolve, reject) => {
        discoveryServer.close((error) =>
          error ? reject(error) : resolve(),
        );
      });
    }
    for (let attempt = 0; ; attempt++) {
      try {
        await rm(this.sessionFile, { force: true });
        break;
      } catch (error) {
        const code =
          error instanceof Error && "code" in error
            ? String(error.code)
            : "";
        if (
          attempt >= 9 ||
          !["EBUSY", "EPERM", "EACCES"].includes(code)
        ) {
          throw error;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, 50 * (attempt + 1)),
        );
      }
    }
  }

  private async handleLine(
    line: string,
  ): Promise<BridgeResponse | null | undefined> {
    const started = Date.now();
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      return failure(
        randomUUID(),
        "INVALID_JSON",
        "Request was not valid JSON.",
        started,
      );
    }

    const requestResult = BridgeRequestSchema.safeParse(parsed);
    if (!requestResult.success) {
      const requestId =
        typeof parsed === "object" &&
        parsed !== null &&
        "requestId" in parsed &&
        typeof parsed.requestId === "string"
          ? parsed.requestId
          : randomUUID();
      return failure(
        requestId,
        "INVALID_REQUEST",
        requestResult.error.issues[0]?.message ?? "Invalid request.",
        started,
      );
    }

    const request = requestResult.data;
    if (request.token !== this.token) {
      return failure(
        request.requestId,
        "UNAUTHORIZED",
        "Session token was rejected.",
        started,
      );
    }
    if (Date.parse(request.deadlineUtc) <= Date.now()) {
      return failure(
        request.requestId,
        "DEADLINE_EXCEEDED",
        "Request deadline has expired.",
        started,
      );
    }
    if (this.requestIds.has(request.requestId)) {
      return failure(
        request.requestId,
        "REPLAY_DETECTED",
        "requestId has already been used.",
        started,
      );
    }
    this.requestIds.add(request.requestId);

    const beforeFault = this.faultInjector.take(
      "before_execution",
      request.operation,
      request.requestId,
    );
    if (beforeFault !== undefined) {
      return await this.applyFault(beforeFault);
    }

    const nxOpenAssemblyVersion = this.options.nxVersion ?? "12.0.2.9";
    const versionProfile = selectVersionProfile(nxOpenAssemblyVersion);
    const base: BridgeResult = {
      connected: true,
      status:
        versionProfile.compatibilityStatus === "verified"
          ? "ready"
          : "compatibility-blocked",
      bridgeVersion: "1.0.0-rc.1+codex.rc1",
      protocolVersion: PROTOCOL_VERSION,
      nxVersion: nxOpenAssemblyVersion,
      nxOpenAssemblyVersion,
      adapterId: versionProfile.adapterId,
      adapterContractId: versionProfile.adapterContractId,
      compatibilityStatus: versionProfile.compatibilityStatus,
      processId: process.pid,
      dispatcher: "mock-main-thread",
    };
    const allowedRoots = this.options.allowedRoots ?? [
      path.dirname(this.sessionFile),
    ];

    try {
      if (!versionProfile.capabilities.includes(request.operation)) {
        return failure(
          request.requestId,
          "NX_VERSION_NOT_SUPPORTED",
          `Operation '${request.operation}' is unavailable because NXOpen assembly version ${nxOpenAssemblyVersion} has no verified typed adapter.`,
          started,
        );
      }
      switch (request.operation) {
        case "health":
          return success(request, base, started);
        case "get_capabilities":
          return success(
            request,
            {
              ...base,
              capabilities: [...versionProfile.capabilities],
              allowedRoots,
            },
            started,
          );
        case "get_session_state":
          return success(
            request,
            {
              ...base,
              application: this.options.application ?? "Modeling",
              ...(this.currentPart === null
                ? {}
                : {
                    workPart: this.currentPart,
                    displayPart: this.currentPart,
                  }),
              units: "Millimeters",
              modified: this.modified,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              solidBodyCount: this.solidBodyCount(),
            },
            started,
          );
        case "get_assembly_capability":
        case "get_drafting_capability":
        case "get_cae_capability":
        case "get_cam_capability": {
          const moduleName = request.operation
            .replace(/^get_/, "")
            .replace(/_capability$/, "") as
            | "assembly"
            | "drafting"
            | "cae"
            | "cam";
          if (moduleName === "cae") {
            return success(
              request,
              versionProfile.compatibilityStatus === "verified"
                ? {
                    available: true,
                    licensed: this.options.licensedModules?.cae ?? false,
                    applicationName: this.options.application ?? "Modeling",
                    adapterId: versionProfile.adapterId,
                    compatibilityStatus: versionProfile.compatibilityStatus,
                    unsupportedReason: "",
                  }
                : {
                    available: false,
                    licensed: false,
                    applicationName: this.options.application ?? "Modeling",
                    adapterId: versionProfile.adapterId,
                    compatibilityStatus: versionProfile.compatibilityStatus,
                    unsupportedReason: `NXOpen assembly version ${nxOpenAssemblyVersion} has no verified ${moduleName} capability adapter.`,
                  },
              started,
            );
          }
          return success(
            request,
            versionProfile.compatibilityStatus === "verified"
              ? {
                  ...base,
                  available: true,
                  licensed: this.options.licensedModules?.[moduleName] ?? false,
                  unsupportedReason: "",
                }
              : {
                  ...base,
                  available: false,
                  licensed: false,
                  unsupportedReason: `NXOpen assembly version ${nxOpenAssemblyVersion} has no verified ${moduleName} capability adapter.`,
                },
            started,
          );
        }
        case "get_assembly_structure": {
          const maxDepth = request.arguments.maxDepth ?? 8;
          const maxComponents = request.arguments.maxComponents ?? 128;
          const common = {
            ...base,
            application: "Modeling",
            ...(this.currentPart === null
              ? {}
              : {
                  workPart: this.currentPart,
                  displayPart: this.currentPart,
                }),
            units: "Millimeters",
            modified: this.modified,
            featureCount: this.features.length,
            bodyCount: this.solidBodyCount(),
            solidBodyCount: this.solidBodyCount(),
            maxDepth,
            maxComponents,
          } satisfies BridgeResult;
          if (this.options.licensedModules?.assembly !== true) {
            return success(
              request,
              {
                ...common,
                available: true,
                licensed: false,
                assemblyReadAvailable: false,
                unsupportedReason:
                  "No assembly license is active in the current NX session. No license was reserved or released, and the NX application was not changed.",
                components: [],
                componentCount: 0,
                returnedComponentCount: 0,
                componentCountComplete: false,
                assemblyStructureTruncated: false,
                depthTruncated: false,
                componentLimitTruncated: false,
                message:
                  "Strict fake failed closed before traversing the configured assembly fixture. This does not imply that the installation has no assembly entitlement.",
              },
              started,
            );
          }
          if (this.currentPart === null) {
            return success(
              request,
              {
                ...common,
                available: true,
                licensed: true,
                assemblyReadAvailable: false,
                unsupportedReason:
                  "No work part is loaded in the current NX session.",
                components: [],
                componentCount: 0,
                returnedComponentCount: 0,
                componentCountComplete: false,
                assemblyStructureTruncated: false,
                depthTruncated: false,
                componentLimitTruncated: false,
              },
              started,
            );
          }

          const root = this.options.assemblyRoot ?? null;
          if (root === null) {
            const fingerprint = createHash("sha256")
              .update("piece-part", "utf8")
              .digest("hex");
            return success(
              request,
              {
                ...common,
                available: true,
                licensed: true,
                assemblyReadAvailable: true,
                unsupportedReason: "",
                isAssembly: false,
                rootComponent: null,
                components: [],
                componentCount: 0,
                returnedComponentCount: 0,
                componentCountComplete: true,
                assemblyStructureTruncated: false,
                depthTruncated: false,
                componentLimitTruncated: false,
                assemblyStructureFingerprint: fingerprint,
                message:
                  "The strict fake work part is not an assembly; no components were returned.",
              },
              started,
            );
          }

          const structure = boundedAssemblyStructure(
            root,
            maxDepth,
            maxComponents,
          );
          return success(
            request,
            {
              ...common,
              available: true,
              licensed: true,
              assemblyReadAvailable: true,
              unsupportedReason: "",
              isAssembly: true,
              rootComponent: structure.rootComponent,
              components: structure.components,
              componentCount: structure.components.length,
              returnedComponentCount: structure.components.length,
              componentCountComplete: structure.componentCountComplete,
              assemblyStructureTruncated:
                structure.depthTruncated ||
                structure.componentLimitTruncated,
              depthTruncated: structure.depthTruncated,
              componentLimitTruncated:
                structure.componentLimitTruncated,
              assemblyStructureFingerprint: structure.fingerprint,
              message: structure.componentCountComplete
                ? "Strict fake returned the complete configured assembly tree within the requested limits without changing state."
                : "Strict fake returned a bounded assembly tree; componentCount is a lower bound because the requested limits truncated the fixture.",
            },
            started,
          );
        }
        case "get_drafting_structure": {
          const maxSheets = request.arguments.maxSheets ?? 32;
          const maxViews = request.arguments.maxViews ?? 128;
          const common = {
            ...base,
            application: this.options.application ?? "Modeling",
            ...(this.currentPart === null
              ? {}
              : {
                  workPart: this.currentPart,
                  displayPart: this.currentPart,
                }),
            units: "Millimeters",
            modified: this.modified,
            featureCount: this.features.length,
            bodyCount: this.solidBodyCount(),
            solidBodyCount: this.solidBodyCount(),
            maxSheets,
            maxViews,
          } satisfies BridgeResult;
          if (this.options.licensedModules?.drafting !== true) {
            return success(
              request,
              {
                ...common,
                available: true,
                licensed: false,
                draftingReadAvailable: false,
                unsupportedReason:
                  "No drafting license is active in the current NX session. No license was reserved or released, and the NX application was not changed.",
                sheets: [],
                views: [],
                sheetCount: 0,
                returnedSheetCount: 0,
                sheetCountComplete: false,
                viewCount: 0,
                returnedViewCount: 0,
                viewCountComplete: false,
                draftingStructureTruncated: false,
                sheetLimitTruncated: false,
                viewLimitTruncated: false,
                message:
                  "Strict fake failed closed before reading the configured drafting fixture. This does not imply that the installation has no drafting entitlement.",
              },
              started,
            );
          }
          if (this.currentPart === null) {
            return success(
              request,
              {
                ...common,
                available: true,
                licensed: true,
                draftingReadAvailable: false,
                unsupportedReason:
                  "No work part is loaded in the current NX session.",
                sheets: [],
                views: [],
                sheetCount: 0,
                returnedSheetCount: 0,
                sheetCountComplete: false,
                viewCount: 0,
                returnedViewCount: 0,
                viewCountComplete: false,
                draftingStructureTruncated: false,
                sheetLimitTruncated: false,
                viewLimitTruncated: false,
              },
              started,
            );
          }

          const structure = boundedDraftingStructure(
            this.draftingSheets,
            maxSheets,
            maxViews,
          );
          const truncated =
            structure.sheetLimitTruncated ||
            structure.viewLimitTruncated;
          return success(
            request,
            {
              ...common,
              available: true,
              licensed: true,
              draftingReadAvailable: true,
              unsupportedReason: "",
              hasDrawingSheets: structure.sheetCount > 0,
              sheets: structure.sheets,
              views: structure.views,
              sheetCount: structure.sheetCount,
              returnedSheetCount: structure.sheets.length,
              sheetCountComplete: true,
              viewCount: structure.viewCount,
              returnedViewCount: structure.views.length,
              viewCountComplete: structure.viewCountComplete,
              draftingStructureTruncated: truncated,
              sheetLimitTruncated: structure.sheetLimitTruncated,
              viewLimitTruncated: structure.viewLimitTruncated,
              draftingStructureFingerprint: structure.fingerprint,
              message: structure.sheetCount === 0
                ? "The strict fake work part has no drawing sheets; no drafting views were returned."
                : truncated
                  ? "Strict fake returned bounded drawing sheets and drafting views without changing state."
                  : "Strict fake returned all configured drawing sheets and drafting views without changing state.",
            },
            started,
          );
        }
        case "preflight_modeling": {
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "Open or create a part before preflighting geometry.",
              started,
            );
          }
          const preflightFailure = this.preflightFailure(request.arguments);
          if (preflightFailure !== undefined) {
            return failure(
              request.requestId,
              preflightFailure.code,
              preflightFailure.message,
              started,
            );
          }
          return success(
            request,
            {
              ...base,
              workPart: this.currentPart,
              displayPart: this.currentPart,
              units: "Millimeters",
              modified: this.modified,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              solidBodyCount: this.solidBodyCount(),
              preflightPassed: true,
              preflightId: `PF-${randomUUID()}`,
              preflightUtc: new Date().toISOString(),
              plannedOperation: request.arguments.plannedOperation,
              featureTreeFingerprint: this.featureTreeFingerprint(),
              featureTreeTotalCount: this.features.length,
              featureTreeReturnedCount: Math.min(this.features.length, 128),
              featureTreeTruncated: this.features.length > 128,
              message:
                "Strict-mock modeling preflight passed without executing the operation.",
            },
            started,
          );
        }
        case "get_feature_tree": {
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "Open or create a part before reading the feature tree.",
              started,
            );
          }
          const startIndex = Math.max(0, this.features.length - 128);
          const features = this.features.slice(startIndex).map((feature, offset) => ({
            index: startIndex + offset,
            journalIdentifier: feature.journalIdentifier,
            name: feature.name,
            featureType: this.mockFeatureType(feature),
            timestamp: startIndex + offset + 1,
            suppressed: false,
            parentJournalIdentifiers: feature.parentJournalIdentifiers ?? [],
          }));
          return success(
            request,
            {
              ...base,
              workPart: this.currentPart,
              displayPart: this.currentPart,
              units: "Millimeters",
              modified: this.modified,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              solidBodyCount: this.solidBodyCount(),
              featureTreeFingerprint: this.featureTreeFingerprint(),
              featureTreeTotalCount: this.features.length,
              featureTreeReturnedCount: features.length,
              featureTreeTruncated: this.features.length > features.length,
              features,
              message: "Read the strict-mock feature tree without modification.",
            },
            started,
          );
        }
        case "capture_screenshot": {
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "Open or create a part before capturing screenshot evidence.",
              started,
            );
          }
          if (request.arguments.filePath === undefined) {
            return failure(
              request.requestId,
              "INVALID_ARGUMENT",
              "filePath is required.",
              started,
            );
          }
          const filePath = await validatePngPath(
            request.arguments.filePath,
            "create",
            allowedRoots,
          );
          const staging = path.join(
            path.dirname(filePath),
            `.nx-codex-screenshot-staging-${randomUUID()}.png`,
          );
          const png = Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
            "base64",
          );
          await writeFile(staging, png, { flag: "wx" });
          try {
            await copyFile(staging, filePath, constants.COPYFILE_EXCL);
            await removeTransientFile(staging);
          } catch (error) {
            await removeTransientFile(staging);
            if (["EEXIST", "EPERM"].includes((error as NodeJS.ErrnoException).code ?? "")) {
              return failure(
                request.requestId,
                "TARGET_EXISTS",
                "The screenshot destination appeared during capture; no overwrite was performed.",
                started,
              );
            }
            throw error;
          }
          return success(
            request,
            {
              ...base,
              workPart: this.currentPart,
              displayPart: this.currentPart,
              units: "Millimeters",
              modified: this.modified,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              solidBodyCount: this.solidBodyCount(),
              filePath,
              captured: true,
              screenshotBytes: png.byteLength,
              screenshotSha256: createHash("sha256").update(png).digest("hex"),
              message:
                "Captured strict-mock no-overwrite PNG evidence without changing the part.",
            },
            started,
          );
        }
        case "new_part": {
          if (this.pendingTransactions.length > 0) {
            return failure(
              request.requestId,
              "PENDING_TRANSACTION",
              "Undo or save the current transaction before creating a new part.",
              started,
            );
          }
          if (request.arguments.filePath === undefined) {
            return failure(
              request.requestId,
              "INVALID_ARGUMENT",
              "filePath is required.",
              started,
            );
          }
          const filePath = await validatePartPath(
            request.arguments.filePath,
            "create",
            allowedRoots,
          );
          this.currentPart = filePath;
          this.features.splice(0);
          this.draftingSheets.splice(0);
          this.testDrawingTransactionId = null;
          this.pendingTransactions.splice(0);
          this.modified = true;
          return success(
            request,
            {
              ...base,
              filePath,
              workPart: filePath,
              displayPart: filePath,
              units: request.arguments.partUnits ?? "Millimeters",
              modified: true,
              featureCount: 0,
              bodyCount: 0,
              opened: true,
              saved: false,
              message: "Created a new unsaved mock part.",
            },
            started,
          );
        }
        case "open_part": {
          if (this.pendingTransactions.length > 0) {
            return failure(
              request.requestId,
              "PENDING_TRANSACTION",
              "Undo or save the current transaction before opening another part.",
              started,
            );
          }
          if (request.arguments.filePath === undefined) {
            return failure(
              request.requestId,
              "INVALID_ARGUMENT",
              "filePath is required.",
              started,
            );
          }
          const filePath = await validatePartPath(
            request.arguments.filePath,
            "open",
            allowedRoots,
          );
          this.currentPart = filePath;
          this.features.splice(0);
          this.draftingSheets.splice(0);
          this.testDrawingTransactionId = null;
          this.pendingTransactions.splice(0);
          this.modified = false;
          return success(
            request,
            {
              ...base,
              filePath,
              workPart: filePath,
              displayPart: filePath,
              units: "Millimeters",
              modified: false,
              featureCount: 0,
              bodyCount: 0,
              opened: true,
              loadWarnings: [],
              message: "Opened the mock part.",
            },
            started,
          );
        }
        case "save_as": {
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "Open or create a part before saving.",
              started,
            );
          }
          if (request.arguments.filePath === undefined) {
            return failure(
              request.requestId,
              "INVALID_ARGUMENT",
              "filePath is required.",
              started,
            );
          }
          const filePath = await validatePartPath(
            request.arguments.filePath,
            "create",
            allowedRoots,
          );
          await writeFile(
            filePath,
            JSON.stringify({
              strictFake: true,
              features: this.features.map((feature) => feature.name),
            }),
            { encoding: "utf8", flag: "wx" },
          );
          this.currentPart = filePath;
          this.modified = false;
          this.testDrawingTransactionId = null;
          this.pendingTransactions.splice(0);
          return success(
            request,
            {
              ...base,
              filePath,
              workPart: filePath,
              displayPart: filePath,
              modified: false,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              saved: true,
              opened: true,
              loadWarnings: [],
              message: "Saved the mock part without overwrite.",
            },
            started,
          );
        }
        case "close_part": {
          if (this.pendingTransactions.length > 0) {
            return failure(
              request.requestId,
              "PENDING_TRANSACTION",
              "Undo or save the current transaction before closing.",
              started,
            );
          }
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "There is no work part to close.",
              started,
            );
          }
          if (this.modified) {
            return failure(
              request.requestId,
              "UNSAVED_CHANGES",
              "The work part has unsaved changes.",
              started,
            );
          }
          const filePath = this.currentPart;
          this.currentPart = null;
          this.features.splice(0);
          this.draftingSheets.splice(0);
          this.testDrawingTransactionId = null;
          return success(
            request,
            {
              ...base,
              filePath,
              closed: true,
              modified: false,
              featureCount: 0,
              bodyCount: 0,
              message: "Closed the unmodified mock part.",
            },
            started,
          );
        }
        case "create_test_drawing": {
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "Open the protected copy before creating the test drawing.",
              started,
            );
          }
          const expectedPath = request.arguments.filePath === undefined
            ? undefined
            : await validatePartPath(
                request.arguments.filePath,
                "open",
                allowedRoots,
              );
          const currentCanonicalPath = await validatePartPath(
            this.currentPart,
            "open",
            allowedRoots,
          );
          if (
            expectedPath === undefined ||
            expectedPath.toLocaleLowerCase("en-US") !==
              currentCanonicalPath.toLocaleLowerCase("en-US")
          ) {
            return failure(
              request.requestId,
              "WORK_PART_MISMATCH",
              "The displayed work part does not exactly match expectedWorkPartPath.",
              started,
            );
          }
          if (
            this.options.application
              ?.toLocaleUpperCase("en-US")
              .includes("DRAFT") !== true
          ) {
            return failure(
              request.requestId,
              "DRAFTING_APPLICATION_NOT_ACTIVE",
              "Switch NX to Drafting before creating the test drawing.",
              started,
            );
          }
          if (this.options.licensedModules?.drafting !== true) {
            return failure(
              request.requestId,
              "DRAFTING_LICENSE_NOT_ACTIVE",
              "An already-active drafting license is required.",
              started,
            );
          }
          if (this.modified || this.pendingTransactions.length > 0) {
            return failure(
              request.requestId,
              this.modified
                ? "WORK_PART_ALREADY_MODIFIED"
                : "PENDING_TRANSACTION",
              "The protected test copy must be saved, unmodified, and have no pending transaction.",
              started,
            );
          }
          if (this.draftingSheets.length !== 0) {
            return failure(
              request.requestId,
              "EXISTING_DRAFTING_CONTENT",
              "The bounded test operation requires zero existing drawing sheets and views.",
              started,
            );
          }

          const transactionId = `TX-${randomUUID()}`;
          this.draftingSheets.push({
            journalIdentifier: "DRAWING_SHEET(TEST_A4)",
            name: "NX_CODEX_TEST_A4",
            length: 297,
            height: 210,
            units: "Millimeters",
            projectionAngle: "ThirdAngle",
            scaleNumerator: 1,
            scaleDenominator: 1,
            isOutOfDate: false,
            views: [
              {
                journalIdentifier: "DRAFTING_VIEW(TEST_BASE)",
                name: "WORK_VIEW@1",
                scale: 1,
                originX: 148.5,
                originY: 105,
                originZ: 0,
                isOutOfDate: false,
                isBroken: false,
                isDecoration: false,
                isSlave: false,
              },
            ],
          });
          this.testDrawingTransactionId = transactionId;
          this.pendingTransactions.push(transactionId);
          this.modified = true;

          const structure = boundedDraftingStructure(
            this.draftingSheets,
            1,
            1,
          );
          return success(
            request,
            {
              ...base,
              application: this.options.application ?? "Modeling",
              workPart: this.currentPart,
              displayPart: this.currentPart,
              units: "Millimeters",
              modified: true,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              solidBodyCount: this.solidBodyCount(),
              available: true,
              licensed: true,
              draftingReadAvailable: true,
              hasDrawingSheets: true,
              sheets: structure.sheets,
              views: structure.views,
              sheetCount: 1,
              returnedSheetCount: 1,
              sheetCountComplete: true,
              viewCount: 1,
              returnedViewCount: 1,
              viewCountComplete: true,
              draftingStructureTruncated: false,
              sheetLimitTruncated: false,
              viewLimitTruncated: false,
              maxSheets: 1,
              maxViews: 1,
              draftingStructureFingerprint: structure.fingerprint,
              transactionId,
              message:
                "Created one mock A4 test sheet and one base view using fixed ratio and placement requests. The work part was not saved or explicitly updated.",
            },
            started,
          );
        }
        case "create_block": {
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "Open or create a part before creating geometry.",
              started,
            );
          }
        const { length, width, height } = request.arguments;
        if (length === undefined || width === undefined || height === undefined) {
          return failure(
            request.requestId,
            "INVALID_ARGUMENT",
            "length, width, and height are required.",
            started,
          );
        }
        const transactionId = `TX-${randomUUID()}`;
        const index = this.features.length + 1;
        const feature: MockFeature = {
          kind: "block",
          transactionId,
          journalIdentifier: `BLOCK(${index})`,
          name: request.arguments.name ?? `BLOCK_${String(index).padStart(3, "0")}`,
          solid: {
            minX: request.arguments.originX ?? 0,
            minY: request.arguments.originY ?? 0,
            minZ: request.arguments.originZ ?? 0,
            maxX: (request.arguments.originX ?? 0) + length,
            maxY: (request.arguments.originY ?? 0) + width,
            maxZ: (request.arguments.originZ ?? 0) + height,
            surfaceArea: 2 * (length * width + length * height + width * height),
            volume: length * width * height,
            centroidX: (request.arguments.originX ?? 0) + length / 2,
            centroidY: (request.arguments.originY ?? 0) + width / 2,
            centroidZ: (request.arguments.originZ ?? 0) + height / 2,
            axisAlignedBox: true,
          },
        };
        this.features.push(feature);
        this.pendingTransactions.push(transactionId);
        this.modified = true;
        return success(
          request,
          {
            ...base,
            transactionId,
            featureJournalIdentifier: feature.journalIdentifier,
            featureName: feature.name,
            featureCount: this.features.length,
            bodyCount: this.solidBodyCount(),
            message: `Created ${length} x ${width} x ${height} mock block.`,
          },
          started,
        );
        }
        case "create_rectangle_sketch": {
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "Open or create a part before creating geometry.",
              started,
            );
          }
          const { profileWidth, profileHeight } = request.arguments;
          if (profileWidth === undefined || profileHeight === undefined) {
            return failure(
              request.requestId,
              "INVALID_ARGUMENT",
              "profileWidth and profileHeight are required.",
              started,
            );
          }
          const transactionId = `TX-${randomUUID()}`;
          const index = this.features.length + 1;
          const feature: MockFeature = {
            kind: "rectangleSketch",
            transactionId,
            journalIdentifier: `SKETCH(${index})`,
            name:
              request.arguments.name ??
              `SKETCH_${String(index).padStart(3, "0")}`,
            profile: {
              width: profileWidth,
              height: profileHeight,
              centerX: request.arguments.centerX ?? 0,
              centerY: request.arguments.centerY ?? 0,
              planeZ: request.arguments.planeZ ?? 0,
            },
          };
          this.features.push(feature);
          this.pendingTransactions.push(transactionId);
          this.modified = true;
          return success(
            request,
            {
              ...base,
              transactionId,
              featureJournalIdentifier: feature.journalIdentifier,
              featureName: feature.name,
              curveCount: 4,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              message: "Created a four-line mock rectangular sketch.",
            },
            started,
          );
        }
        case "extrude_sketch": {
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "Open or create a part before creating geometry.",
              started,
            );
          }
          const { sketchFeatureJournalIdentifier, distance } =
            request.arguments;
          if (
            sketchFeatureJournalIdentifier === undefined ||
            distance === undefined
          ) {
            return failure(
              request.requestId,
              "INVALID_ARGUMENT",
              "sketchFeatureJournalIdentifier and distance are required.",
              started,
            );
          }
          const sketch = this.features.find(
            (feature) =>
              feature.kind === "rectangleSketch" &&
              feature.journalIdentifier === sketchFeatureJournalIdentifier,
          );
          if (sketch?.profile === undefined) {
            return failure(
              request.requestId,
              "SKETCH_NOT_FOUND",
              "No sketch feature exactly matched the supplied journal identifier.",
              started,
            );
          }
          const profile = sketch.profile;
          const transactionId = `TX-${randomUUID()}`;
          const index = this.features.length + 1;
          const minX = profile.centerX - profile.width / 2;
          const minY = profile.centerY - profile.height / 2;
          const feature: MockFeature = {
            kind: "extrude",
            transactionId,
            journalIdentifier: `EXTRUDE(${index})`,
            name:
              request.arguments.name ??
              `EXTRUDE_${String(index).padStart(3, "0")}`,
            parentJournalIdentifiers: [sketch.journalIdentifier],
            solid: {
              minX,
              minY,
              minZ: profile.planeZ,
              maxX: minX + profile.width,
              maxY: minY + profile.height,
              maxZ: profile.planeZ + distance,
              surfaceArea:
                2 *
                (profile.width * profile.height +
                  profile.width * distance +
                  profile.height * distance),
              volume: profile.width * profile.height * distance,
              centroidX: profile.centerX,
              centroidY: profile.centerY,
              centroidZ: profile.planeZ + distance / 2,
              axisAlignedBox: true,
            },
          };
          this.features.push(feature);
          this.pendingTransactions.push(transactionId);
          this.modified = true;
          return success(
            request,
            {
              ...base,
              transactionId,
              featureJournalIdentifier: feature.journalIdentifier,
              featureName: feature.name,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              message: "Extruded the mock sketch as a new solid.",
            },
            started,
          );
        }
        case "revolve_sketch": {
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "Open or create a part before creating geometry.",
              started,
            );
          }
          const {
            sketchFeatureJournalIdentifier,
            axisDirection,
            axisOriginX,
            axisOriginY,
            axisOriginZ,
          } = request.arguments;
          if (
            sketchFeatureJournalIdentifier === undefined ||
            axisDirection === undefined ||
            axisOriginX === undefined ||
            axisOriginY === undefined ||
            axisOriginZ === undefined
          ) {
            return failure(
              request.requestId,
              "INVALID_ARGUMENT",
              "sketchFeatureJournalIdentifier, axisDirection, and all axis origin coordinates are required.",
              started,
            );
          }
          const sketch = this.features.find(
            (feature) =>
              feature.kind === "rectangleSketch" &&
              feature.journalIdentifier === sketchFeatureJournalIdentifier,
          );
          if (sketch?.profile === undefined) {
            return failure(
              request.requestId,
              "SKETCH_NOT_FOUND",
              "No sketch feature exactly matched the supplied journal identifier.",
              started,
            );
          }
          const profile = sketch.profile;
          if (Math.abs(axisOriginZ - profile.planeZ) > 1e-6) {
            return failure(
              request.requestId,
              "AXIS_NOT_IN_SKETCH_PLANE",
              "The full-revolution axis origin must lie on the sketch's absolute XY plane.",
              started,
            );
          }

          const minX = profile.centerX - profile.width / 2;
          const maxX = profile.centerX + profile.width / 2;
          const minY = profile.centerY - profile.height / 2;
          const maxY = profile.centerY + profile.height / 2;
          const revolvesAboutX = axisDirection === "WCS_X";
          const radialMinCoordinate = revolvesAboutX ? minY : minX;
          const radialMaxCoordinate = revolvesAboutX ? maxY : maxX;
          const radialAxisCoordinate = revolvesAboutX
            ? axisOriginY
            : axisOriginX;
          if (
            radialAxisCoordinate > radialMinCoordinate &&
            radialAxisCoordinate < radialMaxCoordinate
          ) {
            return failure(
              request.requestId,
              "PROFILE_CROSSES_AXIS",
              "The rectangular profile crosses the requested full-revolution axis.",
              started,
            );
          }

          const radialDistance1 = Math.abs(
            radialMinCoordinate - radialAxisCoordinate,
          );
          const radialDistance2 = Math.abs(
            radialMaxCoordinate - radialAxisCoordinate,
          );
          const innerRadius = Math.min(radialDistance1, radialDistance2);
          const outerRadius = Math.max(radialDistance1, radialDistance2);
          const axialLength = revolvesAboutX
            ? profile.width
            : profile.height;
          const annularArea =
            Math.PI *
            (outerRadius * outerRadius - innerRadius * innerRadius);
          const transactionId = `TX-${randomUUID()}`;
          const index = this.features.length + 1;
          const feature: MockFeature = {
            kind: "revolve",
            transactionId,
            journalIdentifier: `REVOLVE(${index})`,
            name:
              request.arguments.name ??
              `REVOLVE_${String(index).padStart(3, "0")}`,
            parentJournalIdentifiers: [sketch.journalIdentifier],
            solid: revolvesAboutX
              ? {
                  minX,
                  minY: axisOriginY - outerRadius,
                  minZ: profile.planeZ - outerRadius,
                  maxX,
                  maxY: axisOriginY + outerRadius,
                  maxZ: profile.planeZ + outerRadius,
                  surfaceArea:
                    2 *
                    Math.PI *
                    (axialLength * (outerRadius + innerRadius) +
                      outerRadius * outerRadius -
                      innerRadius * innerRadius),
                  volume: annularArea * axialLength,
                  centroidX: profile.centerX,
                  centroidY: axisOriginY,
                  centroidZ: profile.planeZ,
                  axisAlignedBox: false,
                }
              : {
                  minX: axisOriginX - outerRadius,
                  minY,
                  minZ: profile.planeZ - outerRadius,
                  maxX: axisOriginX + outerRadius,
                  maxY,
                  maxZ: profile.planeZ + outerRadius,
                  surfaceArea:
                    2 *
                    Math.PI *
                    (axialLength * (outerRadius + innerRadius) +
                      outerRadius * outerRadius -
                      innerRadius * innerRadius),
                  volume: annularArea * axialLength,
                  centroidX: axisOriginX,
                  centroidY: profile.centerY,
                  centroidZ: profile.planeZ,
                  axisAlignedBox: false,
                },
          };
          this.features.push(feature);
          this.pendingTransactions.push(transactionId);
          this.modified = true;
          return success(
            request,
            {
              ...base,
              transactionId,
              featureJournalIdentifier: feature.journalIdentifier,
              featureName: feature.name,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              message:
                "Revolved the mock sketch through 360 degrees as a new solid.",
            },
            started,
          );
        }
        case "create_simple_through_hole": {
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "Open or create a part before creating geometry.",
              started,
            );
          }
          const { holeCenterX, holeCenterY, holeDiameter } = request.arguments;
          if (
            holeCenterX === undefined ||
            holeCenterY === undefined ||
            holeDiameter === undefined
          ) {
            return failure(
              request.requestId,
              "INVALID_ARGUMENT",
              "holeCenterX, holeCenterY, and holeDiameter are required.",
              started,
            );
          }

          const solidFeatures = this.features.filter(
            (feature) => feature.solid !== undefined,
          );
          if (solidFeatures.length !== 1) {
            return failure(
              request.requestId,
              "HOLE_REQUIRES_ONE_SOLID_BODY",
              "A simple through hole requires exactly one solid body in the work part.",
              started,
            );
          }
          const targetFeature = solidFeatures[0];
          if (targetFeature === undefined) {
            throw new Error("Strict fake did not return the unique target feature.");
          }
          const targetSolid = targetFeature.solid;
          if (targetSolid === undefined) {
            throw new Error("Strict fake lost the selected target solid.");
          }
          const radius = holeDiameter / 2;
          const clearance = 1e-6;
          if (
            holeCenterX - radius <= targetSolid.minX + clearance ||
            holeCenterY - radius <= targetSolid.minY + clearance ||
            holeCenterX + radius >= targetSolid.maxX - clearance ||
            holeCenterY + radius >= targetSolid.maxY - clearance
          ) {
            return failure(
              request.requestId,
              "HOLE_CLEARANCE_OUTSIDE_FACE",
              "The requested hole circle does not fit strictly inside both selected planar face bounding boxes.",
              started,
            );
          }
          for (const feature of this.features) {
            if (feature.kind !== "hole" || feature.hole === undefined) {
              continue;
            }
            const separation = Math.hypot(
              feature.hole.centerX - holeCenterX,
              feature.hole.centerY - holeCenterY,
            );
            if (separation <= feature.hole.diameter / 2 + radius) {
              return failure(
                request.requestId,
                "HOLE_INTERSECTS_EXISTING_HOLE",
                "The requested simple hole intersects an existing mock hole.",
                started,
              );
            }
          }

          const bodyHeight = targetSolid.maxZ - targetSolid.minZ;
          if (bodyHeight <= 1e-6) {
            return failure(
              request.requestId,
              "HOLE_BODY_HEIGHT_INVALID",
              "The target body's absolute Z height is too small for a through hole.",
              started,
            );
          }
          const removedVolume = Math.PI * radius * radius * bodyHeight;
          const remainingVolume = targetSolid.volume - removedVolume;
          if (remainingVolume <= 0) {
            return failure(
              request.requestId,
              "HOLE_REMOVES_ENTIRE_BODY",
              "The requested hole would remove the entire mock solid.",
              started,
            );
          }

          const previousSolid: MockSolid = { ...targetSolid };
          targetFeature.solid = {
            ...targetSolid,
            surfaceArea:
              targetSolid.surfaceArea -
              2 * Math.PI * radius * radius +
              2 * Math.PI * radius * bodyHeight,
            volume: remainingVolume,
            centroidX:
              (targetSolid.centroidX * targetSolid.volume -
                holeCenterX * removedVolume) /
              remainingVolume,
            centroidY:
              (targetSolid.centroidY * targetSolid.volume -
                holeCenterY * removedVolume) /
              remainingVolume,
            centroidZ:
              (targetSolid.centroidZ * targetSolid.volume -
                ((targetSolid.minZ + targetSolid.maxZ) / 2) * removedVolume) /
              remainingVolume,
            axisAlignedBox: false,
          };

          const transactionId = `TX-${randomUUID()}`;
          const index = this.features.length + 1;
          const feature: MockFeature = {
            kind: "hole",
            transactionId,
            journalIdentifier: `SIMPLE_HOLE(${index})`,
            name:
              request.arguments.name ??
              `SIMPLE_THROUGH_HOLE_${String(index).padStart(3, "0")}`,
            parentJournalIdentifiers: [targetFeature.journalIdentifier],
            hole: {
              centerX: holeCenterX,
              centerY: holeCenterY,
              diameter: holeDiameter,
              targetJournalIdentifier: targetFeature.journalIdentifier,
              previousSolid,
            },
          };
          this.features.push(feature);
          this.pendingTransactions.push(transactionId);
          this.modified = true;
          return success(
            request,
            {
              ...base,
              transactionId,
              featureJournalIdentifier: feature.journalIdentifier,
              featureName: feature.name,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              message:
                "Created a semantic mock simple hole from the unique top face through the bottom face.",
            },
            started,
          );
        }
        case "boolean_bodies": {
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "Open or create a part before creating geometry.",
              started,
            );
          }
          const {
            booleanOperation,
            targetFeatureJournalIdentifier,
            toolFeatureJournalIdentifier,
          } = request.arguments;
          if (
            booleanOperation === undefined ||
            targetFeatureJournalIdentifier === undefined ||
            toolFeatureJournalIdentifier === undefined
          ) {
            return failure(
              request.requestId,
              "INVALID_ARGUMENT",
              "booleanOperation, targetFeatureJournalIdentifier, and toolFeatureJournalIdentifier are required.",
              started,
            );
          }
          if (
            targetFeatureJournalIdentifier === toolFeatureJournalIdentifier
          ) {
            return failure(
              request.requestId,
              "BOOLEAN_REQUIRES_DISTINCT_FEATURES",
              "Boolean target and tool feature identifiers must be different.",
              started,
            );
          }

          const targetSelection = this.features.find(
            (feature) =>
              feature.journalIdentifier === targetFeatureJournalIdentifier,
          );
          if (targetSelection === undefined) {
            return failure(
              request.requestId,
              "BOOLEAN_TARGET_FEATURE_NOT_FOUND",
              "No feature exactly matched the supplied journal identifier.",
              started,
            );
          }
          const toolSelection = this.features.find(
            (feature) =>
              feature.journalIdentifier === toolFeatureJournalIdentifier,
          );
          if (toolSelection === undefined) {
            return failure(
              request.requestId,
              "BOOLEAN_TOOL_FEATURE_NOT_FOUND",
              "No feature exactly matched the supplied journal identifier.",
              started,
            );
          }
          const targetFeature = this.currentSolidOwnerForFeature(targetSelection);
          const toolFeature = this.currentSolidOwnerForFeature(toolSelection);
          if (targetFeature === undefined || toolFeature === undefined) {
            return failure(
              request.requestId,
              "BOOLEAN_BODY_NOT_CURRENT",
              "A selected feature does not map to a current solid body.",
              started,
            );
          }
          if (targetFeature === toolFeature) {
            return failure(
              request.requestId,
              "BOOLEAN_REQUIRES_DISTINCT_BODIES",
              "Boolean target and tool features resolve to the same current solid body.",
              started,
            );
          }
          const targetSolid = targetFeature.solid;
          const toolSolid = toolFeature.solid;
          if (targetSolid === undefined || toolSolid === undefined) {
            throw new Error("Strict fake lost a selected Boolean solid.");
          }
          if (
            targetSolid.axisAlignedBox !== true ||
            toolSolid.axisAlignedBox !== true
          ) {
            return failure(
              request.requestId,
              "STRICT_FAKE_UNSUPPORTED_BOOLEAN_SOLID",
              "The strict fake only computes Boolean mass properties for axis-aligned rectangular solids.",
              started,
            );
          }
          if (!boxesHavePositiveOverlap(targetSolid, toolSolid)) {
            return failure(
              request.requestId,
              "BOOLEAN_BODIES_DO_NOT_OVERLAP",
              "The selected target and tool bodies do not have a positive-volume overlap.",
              started,
            );
          }

          const resultSolid = booleanAxisAlignedSolids(
            targetSolid,
            toolSolid,
            booleanOperation,
          );
          if (resultSolid === null) {
            return failure(
              request.requestId,
              "BOOLEAN_RESULT_BODY_COUNT_INVALID",
              "The Boolean operation did not return exactly one resultant body.",
              started,
            );
          }
          const previousTargetSolid: MockSolid = { ...targetSolid };
          const previousToolSolid: MockSolid = { ...toolSolid };
          targetFeature.solid = resultSolid;
          delete toolFeature.solid;

          const transactionId = `TX-${randomUUID()}`;
          const index = this.features.length + 1;
          const feature: MockFeature = {
            kind: "boolean",
            transactionId,
            journalIdentifier: `BOOLEAN(${index})`,
            name:
              request.arguments.name ??
              `${booleanOperation}_${String(index).padStart(3, "0")}`,
            parentJournalIdentifiers: [
              targetFeature.journalIdentifier,
              toolFeature.journalIdentifier,
            ],
            boolean: {
              targetJournalIdentifier: targetFeature.journalIdentifier,
              toolJournalIdentifier: toolFeature.journalIdentifier,
              previousTargetSolid,
              previousToolSolid,
            },
          };
          this.features.push(feature);
          this.pendingTransactions.push(transactionId);
          this.modified = true;
          return success(
            request,
            {
              ...base,
              transactionId,
              featureJournalIdentifier: feature.journalIdentifier,
              featureName: feature.name,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              message: `Completed the strict mock ${booleanOperation} Boolean and consumed one tool body.`,
            },
            started,
          );
        }
        case "fillet_vertical_edges": {
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "Open or create a part before creating geometry.",
              started,
            );
          }
          const { bodyFeatureJournalIdentifier, filletRadius } =
            request.arguments;
          if (
            bodyFeatureJournalIdentifier === undefined ||
            filletRadius === undefined
          ) {
            return failure(
              request.requestId,
              "INVALID_ARGUMENT",
              "bodyFeatureJournalIdentifier and filletRadius are required.",
              started,
            );
          }
          const selected = this.features.find(
            (feature) =>
              feature.journalIdentifier === bodyFeatureJournalIdentifier,
          );
          if (selected === undefined) {
            return failure(
              request.requestId,
              "FILLET_BODY_FEATURE_NOT_FOUND",
              "No feature exactly matched the supplied journal identifier.",
              started,
            );
          }
          const target = this.currentSolidOwnerForFeature(selected);
          if (target === undefined) {
            return failure(
              request.requestId,
              "FILLET_BODY_NOT_CURRENT",
              "The selected body feature does not map to a current solid body.",
              started,
            );
          }
          const targetSolid = target.solid;
          if (targetSolid === undefined) {
            throw new Error("Strict fake lost the selected fillet solid.");
          }
          if (targetSolid.axisAlignedBox !== true) {
            return failure(
              request.requestId,
              "STRICT_FAKE_UNSUPPORTED_FILLET_SOLID",
              "The strict fake only computes the four-vertical-edge fillet for an axis-aligned rectangular solid.",
              started,
            );
          }
          const sizeX = targetSolid.maxX - targetSolid.minX;
          const sizeY = targetSolid.maxY - targetSolid.minY;
          if (filletRadius >= Math.min(sizeX, sizeY) / 2 - 1e-6) {
            return failure(
              request.requestId,
              "FILLET_RADIUS_TOO_LARGE",
              "filletRadius must be strictly less than half the smaller exact absolute WCS X/Y body size.",
              started,
            );
          }

          const previousSolid: MockSolid = { ...targetSolid };
          const height = targetSolid.maxZ - targetSolid.minZ;
          const cornerFactor = 4 - Math.PI;
          target.solid = {
            ...targetSolid,
            surfaceArea:
              targetSolid.surfaceArea -
              2 * cornerFactor *
                (filletRadius * filletRadius + filletRadius * height),
            volume:
              targetSolid.volume -
              height * filletRadius * filletRadius * cornerFactor,
            axisAlignedBox: false,
          };

          const transactionId = `TX-${randomUUID()}`;
          const index = this.features.length + 1;
          const feature: MockFeature = {
            kind: "fillet",
            transactionId,
            journalIdentifier: `BLEND(${index})`,
            name:
              request.arguments.name ??
              `VERTICAL_EDGE_FILLET_${String(index).padStart(3, "0")}`,
            parentJournalIdentifiers: [target.journalIdentifier],
            fillet: {
              targetJournalIdentifier: target.journalIdentifier,
              radius: filletRadius,
              previousSolid,
            },
          };
          this.features.push(feature);
          this.pendingTransactions.push(transactionId);
          this.modified = true;
          return success(
            request,
            {
              ...base,
              transactionId,
              featureJournalIdentifier: feature.journalIdentifier,
              featureName: feature.name,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              message:
                "Created one strict-mock constant-radius blend on four validated vertical edges.",
            },
            started,
          );
        }
        case "measure_work_part": {
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "Open or create a part before measuring solid bodies.",
              started,
            );
          }
          const solids = this.features.flatMap((feature) =>
            feature.solid === undefined ? [] : [feature.solid],
          );
          if (solids.length === 0) {
            return failure(
              request.requestId,
              "NO_SOLID_BODY",
              "The mock work part contains no solid body to measure.",
              started,
            );
          }
          const volume = solids.reduce(
            (sum, solid) => sum + solid.volume,
            0,
          );
          return success(
            request,
            {
              ...base,
              workPart: this.currentPart,
              displayPart: this.currentPart,
              units: "Millimeters",
              modified: this.modified,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              solidBodyCount: this.solidBodyCount(),
              measuredBodyCount: solids.length,
              measurementUnits: "Millimeters",
              boundingBoxMinX: Math.min(...solids.map((solid) => solid.minX)),
              boundingBoxMinY: Math.min(...solids.map((solid) => solid.minY)),
              boundingBoxMinZ: Math.min(...solids.map((solid) => solid.minZ)),
              boundingBoxMaxX: Math.max(...solids.map((solid) => solid.maxX)),
              boundingBoxMaxY: Math.max(...solids.map((solid) => solid.maxY)),
              boundingBoxMaxZ: Math.max(...solids.map((solid) => solid.maxZ)),
              boundingBoxSizeX:
                Math.max(...solids.map((solid) => solid.maxX)) -
                Math.min(...solids.map((solid) => solid.minX)),
              boundingBoxSizeY:
                Math.max(...solids.map((solid) => solid.maxY)) -
                Math.min(...solids.map((solid) => solid.minY)),
              boundingBoxSizeZ:
                Math.max(...solids.map((solid) => solid.maxZ)) -
                Math.min(...solids.map((solid) => solid.minZ)),
              surfaceArea: solids.reduce(
                (sum, solid) => sum + solid.surfaceArea,
                0,
              ),
              volume,
              centroidX:
                solids.reduce(
                  (sum, solid) => sum + solid.centroidX * solid.volume,
                  0,
                ) / volume,
              centroidY:
                solids.reduce(
                  (sum, solid) => sum + solid.centroidY * solid.volume,
                  0,
                ) / volume,
              centroidZ:
                solids.reduce(
                  (sum, solid) => sum + solid.centroidZ * solid.volume,
                  0,
                ) / volume,
              message: "Measured mock solid bodies without modification.",
            },
            started,
          );
        }
        case "export_step": {
          if (this.currentPart === null) {
            return failure(
              request.requestId,
              "NO_WORK_PART",
              "Open or create a part before exporting STEP.",
              started,
            );
          }
          if (request.arguments.filePath === undefined) {
            return failure(
              request.requestId,
              "INVALID_ARGUMENT",
              "filePath is required.",
              started,
            );
          }
          const stepFormat = request.arguments.stepFormat ?? "AP214";
          if (!["AP203", "AP214", "AP242"].includes(stepFormat)) {
            return failure(
              request.requestId,
              "INVALID_ARGUMENT",
              "stepFormat must be AP203, AP214, or AP242.",
              started,
            );
          }
          const filePath = await validateStepPath(
            request.arguments.filePath,
            "create",
            allowedRoots,
          );
          const staging = path.join(
            path.dirname(filePath),
            `.nx-codex-step-staging-${randomUUID()}.stp`,
          );
          await writeFile(
            staging,
            [
              "ISO-10303-21;",
              "/* NX Codex strict fake STEP export */",
              `/* format=${stepFormat} features=${this.features.length} */`,
              "END-ISO-10303-21;",
              "",
            ].join("\n"),
            { encoding: "utf8", flag: "wx" },
          );
          try {
            await copyFile(staging, filePath, constants.COPYFILE_EXCL);
            await removeTransientFile(staging);
          } catch (error) {
            await removeTransientFile(staging);
            if (["EEXIST", "EPERM"].includes((error as NodeJS.ErrnoException).code ?? "")) {
              return failure(
                request.requestId,
                "TARGET_EXISTS",
                "The STEP destination appeared during export; no overwrite was performed.",
                started,
              );
            }
            throw error;
          }
          return success(
            request,
            {
              ...base,
              filePath,
              exported: true,
              stepFormat,
              workPart: this.currentPart,
              displayPart: this.currentPart,
              units: "Millimeters",
              modified: this.modified,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              message:
                "Exported the mock work part to a precise STEP file without modifying the part.",
            },
            started,
          );
        }
        case "undo_transaction": {
        const transactionId = request.arguments.transactionId;
        const latest =
          this.pendingTransactions[this.pendingTransactions.length - 1];
        if (latest !== transactionId) {
          return failure(
            request.requestId,
            latest === undefined
              ? "TRANSACTION_NOT_FOUND"
              : "TRANSACTION_NOT_LATEST",
            latest === undefined
              ? "Transaction is unknown or has already been undone."
              : "Only the latest transaction can be undone safely.",
            started,
          );
        }
        if (this.testDrawingTransactionId === transactionId) {
          this.draftingSheets.splice(0);
          this.testDrawingTransactionId = null;
          this.pendingTransactions.pop();
          this.modified = this.features.length > 0;
          return success(
            request,
            {
              ...base,
              transactionId,
              modified: this.modified,
              featureCount: this.features.length,
              bodyCount: this.solidBodyCount(),
              solidBodyCount: this.solidBodyCount(),
              message:
                "Test drawing transaction undone. The work part was not saved.",
            },
            started,
          );
        }
        const index = this.features.findIndex(
          (feature) => feature.transactionId === transactionId,
        );
        const feature = this.features[index];
        if (feature?.kind === "hole" && feature.hole !== undefined) {
          const target = this.features.find(
            (candidate) =>
              candidate.journalIdentifier ===
              feature.hole?.targetJournalIdentifier,
          );
          if (target === undefined) {
            throw new Error("Strict fake could not restore the hole target.");
          }
          target.solid = { ...feature.hole.previousSolid };
        }
        if (feature?.kind === "boolean" && feature.boolean !== undefined) {
          const target = this.features.find(
            (candidate) =>
              candidate.journalIdentifier ===
              feature.boolean?.targetJournalIdentifier,
          );
          const tool = this.features.find(
            (candidate) =>
              candidate.journalIdentifier ===
              feature.boolean?.toolJournalIdentifier,
          );
          if (target === undefined || tool === undefined) {
            throw new Error("Strict fake could not restore the Boolean bodies.");
          }
          target.solid = { ...feature.boolean.previousTargetSolid };
          tool.solid = { ...feature.boolean.previousToolSolid };
        }
        if (feature?.kind === "fillet" && feature.fillet !== undefined) {
          const target = this.features.find(
            (candidate) =>
              candidate.journalIdentifier ===
              feature.fillet?.targetJournalIdentifier,
          );
          if (target === undefined) {
            throw new Error("Strict fake could not restore the fillet target.");
          }
          target.solid = { ...feature.fillet.previousSolid };
        }
        this.features.splice(index, 1);
        this.pendingTransactions.pop();
        this.modified = this.features.length > 0;
        return success(
          request,
          {
            ...base,
            transactionId,
            featureCount: this.features.length,
            bodyCount: this.solidBodyCount(),
            message: "Transaction undone.",
          },
          started,
        );
        }
      }
    } catch (error) {
      if (error instanceof PathPolicyError) {
        return failure(
          request.requestId,
          error.code,
          error.message,
          started,
        );
      }
      return failure(
        request.requestId,
        "STRICT_FAKE_FAILURE",
        error instanceof Error ? error.message : "Unknown strict fake error.",
        started,
      );
    }
  }

  private parseRequestForFaults(line: string): BridgeRequest | undefined {
    try {
      const parsed: unknown = JSON.parse(line);
      const request = BridgeRequestSchema.safeParse(parsed);
      return request.success ? request.data : undefined;
    } catch {
      return undefined;
    }
  }

  private async applyFault(
    fault: DeterministicFault,
  ): Promise<null | undefined> {
    if (fault.delayMs !== undefined && fault.delayMs > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, fault.delayMs));
    }
    if (fault.kind === "disconnect") {
      return null;
    }
    if (fault.kind === "crash") {
      queueMicrotask(() => {
        void this.stop().catch(() => undefined);
      });
      return null;
    }
    return undefined;
  }

  private preflightFailure(
    args: BridgeArguments,
  ): { code: string; message: string } | undefined {
    const operation = args.plannedOperation;
    if (operation === undefined) {
      return { code: "INVALID_ARGUMENT", message: "plannedOperation is required." };
    }
    switch (operation) {
      case "create_block":
        return args.length === undefined ||
          args.width === undefined ||
          args.height === undefined ||
          args.originX === undefined ||
          args.originY === undefined ||
          args.originZ === undefined
          ? {
              code: "INVALID_ARGUMENT",
              message: "The complete block plan is required.",
            }
          : undefined;
      case "create_rectangle_sketch":
        return args.profileWidth === undefined ||
          args.profileHeight === undefined ||
          args.centerX === undefined ||
          args.centerY === undefined ||
          args.planeZ === undefined
          ? {
              code: "INVALID_ARGUMENT",
              message: "The complete rectangular-sketch plan is required.",
            }
          : undefined;
      case "extrude_sketch": {
        if (
          args.sketchFeatureJournalIdentifier === undefined ||
          args.distance === undefined
        ) {
          return {
            code: "INVALID_ARGUMENT",
            message: "The complete extrude plan is required.",
          };
        }
        const sketch = this.features.find(
          (feature) =>
            feature.kind === "rectangleSketch" &&
            feature.journalIdentifier === args.sketchFeatureJournalIdentifier,
        );
        return sketch === undefined
          ? {
              code: "SKETCH_NOT_FOUND",
              message:
                "No sketch feature exactly matched the supplied journal identifier.",
            }
          : undefined;
      }
      case "revolve_sketch": {
        if (
          args.sketchFeatureJournalIdentifier === undefined ||
          args.axisDirection === undefined ||
          args.axisOriginX === undefined ||
          args.axisOriginY === undefined ||
          args.axisOriginZ === undefined
        ) {
          return {
            code: "INVALID_ARGUMENT",
            message: "The complete revolve plan is required.",
          };
        }
        const sketch = this.features.find(
          (feature) =>
            feature.kind === "rectangleSketch" &&
            feature.journalIdentifier === args.sketchFeatureJournalIdentifier,
        );
        if (sketch?.profile === undefined) {
          return {
            code: "SKETCH_NOT_FOUND",
            message:
              "No sketch feature exactly matched the supplied journal identifier.",
          };
        }
        if (Math.abs(args.axisOriginZ - sketch.profile.planeZ) > 1e-6) {
          return {
            code: "AXIS_NOT_IN_SKETCH_PLANE",
            message:
              "The full-revolution axis origin must lie on the sketch plane.",
          };
        }
        const radialMinimum =
          args.axisDirection === "WCS_X"
            ? sketch.profile.centerY - sketch.profile.height / 2
            : sketch.profile.centerX - sketch.profile.width / 2;
        const radialMaximum =
          args.axisDirection === "WCS_X"
            ? sketch.profile.centerY + sketch.profile.height / 2
            : sketch.profile.centerX + sketch.profile.width / 2;
        const radialAxis =
          args.axisDirection === "WCS_X" ? args.axisOriginY : args.axisOriginX;
        return radialAxis > radialMinimum && radialAxis < radialMaximum
          ? {
              code: "PROFILE_CROSSES_AXIS",
              message: "The rectangular profile crosses the revolve axis.",
            }
          : undefined;
      }
      case "create_simple_through_hole": {
        if (
          args.holeCenterX === undefined ||
          args.holeCenterY === undefined ||
          args.holeDiameter === undefined
        ) {
          return {
            code: "INVALID_ARGUMENT",
            message: "The complete through-hole plan is required.",
          };
        }
        const solids = this.features.filter(
          (feature) => feature.solid !== undefined,
        );
        if (solids.length !== 1 || solids[0]?.solid === undefined) {
          return {
            code: "HOLE_REQUIRES_ONE_SOLID_BODY",
            message: "A simple through hole requires exactly one solid body.",
          };
        }
        const solid = solids[0].solid;
        const radius = args.holeDiameter / 2;
        return args.holeCenterX - radius <= solid.minX + 1e-6 ||
          args.holeCenterY - radius <= solid.minY + 1e-6 ||
          args.holeCenterX + radius >= solid.maxX - 1e-6 ||
          args.holeCenterY + radius >= solid.maxY - 1e-6
          ? {
              code: "HOLE_CLEARANCE_OUTSIDE_FACE",
              message:
                "The requested hole circle does not fit strictly inside both face bounds.",
            }
          : undefined;
      }
      case "boolean_bodies": {
        if (
          args.booleanOperation === undefined ||
          args.targetFeatureJournalIdentifier === undefined ||
          args.toolFeatureJournalIdentifier === undefined
        ) {
          return {
            code: "INVALID_ARGUMENT",
            message: "The complete Boolean plan is required.",
          };
        }
        if (
          args.targetFeatureJournalIdentifier ===
          args.toolFeatureJournalIdentifier
        ) {
          return {
            code: "BOOLEAN_REQUIRES_DISTINCT_FEATURES",
            message: "Boolean target and tool identifiers must differ.",
          };
        }
        const targetSelection = this.features.find(
          (feature) =>
            feature.journalIdentifier ===
            args.targetFeatureJournalIdentifier,
        );
        const toolSelection = this.features.find(
          (feature) =>
            feature.journalIdentifier === args.toolFeatureJournalIdentifier,
        );
        if (targetSelection === undefined || toolSelection === undefined) {
          return {
            code: "BOOLEAN_FEATURE_NOT_FOUND",
            message: "A selected Boolean feature was not found.",
          };
        }
        const target = this.currentSolidOwnerForFeature(targetSelection);
        const tool = this.currentSolidOwnerForFeature(toolSelection);
        if (
          target === undefined ||
          tool === undefined ||
          target === tool ||
          target.solid === undefined ||
          tool.solid === undefined
        ) {
          return {
            code: "BOOLEAN_BODY_NOT_CURRENT",
            message: "The selected Boolean bodies are not two current solids.",
          };
        }
        return boxesHavePositiveOverlap(target.solid, tool.solid)
          ? undefined
          : {
              code: "BOOLEAN_BODIES_DO_NOT_OVERLAP",
              message: "The selected bodies do not positively overlap.",
            };
      }
      case "fillet_vertical_edges": {
        if (
          args.bodyFeatureJournalIdentifier === undefined ||
          args.filletRadius === undefined
        ) {
          return {
            code: "INVALID_ARGUMENT",
            message: "The complete fillet plan is required.",
          };
        }
        const selected = this.features.find(
          (feature) =>
            feature.journalIdentifier === args.bodyFeatureJournalIdentifier,
        );
        const target =
          selected === undefined
            ? undefined
            : this.currentSolidOwnerForFeature(selected);
        if (target?.solid === undefined || target.solid.axisAlignedBox !== true) {
          return {
            code: "FILLET_BODY_NOT_CURRENT",
            message:
              "The selected fillet feature does not map to one supported current solid.",
          };
        }
        const sizeX = target.solid.maxX - target.solid.minX;
        const sizeY = target.solid.maxY - target.solid.minY;
        return args.filletRadius >= Math.min(sizeX, sizeY) / 2 - 1e-6
          ? {
              code: "FILLET_RADIUS_TOO_LARGE",
              message:
                "filletRadius must be less than half the smaller transverse size.",
            }
          : undefined;
      }
    }
  }

  private featureTreeFingerprint(): string {
    const canonical = this.features.map((feature, index) => ({
      index,
      journalIdentifier: feature.journalIdentifier,
      name: feature.name,
      featureType: this.mockFeatureType(feature),
      timestamp: index + 1,
      suppressed: false,
      parents: feature.parentJournalIdentifiers ?? [],
    }));
    return createHash("sha256")
      .update(JSON.stringify(canonical), "utf8")
      .digest("hex");
  }

  private mockFeatureType(feature: MockFeature): string {
    switch (feature.kind) {
      case "block":
        return "BLOCK";
      case "rectangleSketch":
        return "SKETCH";
      case "extrude":
        return "EXTRUDE";
      case "revolve":
        return "REVOLVE";
      case "hole":
        return "SIMPLE HOLE";
      case "boolean":
        return "BOOLEAN";
      case "fillet":
        return "BLEND";
    }
  }

  private solidBodyCount(): number {
    return this.features.filter((feature) => feature.solid !== undefined).length;
  }

  private currentSolidOwnerForFeature(
    selected: MockFeature,
  ): MockFeature | undefined {
    let current: MockFeature | undefined = selected;
    const visited = new Set<string>();
    while (current !== undefined && !visited.has(current.journalIdentifier)) {
      visited.add(current.journalIdentifier);
      if (current.solid !== undefined) return current;
      const parentIdentifier: string | undefined =
        current.kind === "hole"
          ? current.hole?.targetJournalIdentifier
          : current.kind === "boolean"
            ? current.boolean?.targetJournalIdentifier
            : current.kind === "fillet"
              ? current.fillet?.targetJournalIdentifier
            : undefined;
      if (parentIdentifier === undefined) return undefined;
      current = this.features.find(
        (feature) => feature.journalIdentifier === parentIdentifier,
      );
    }
    return undefined;
  }
}
