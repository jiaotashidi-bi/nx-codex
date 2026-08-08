import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { type TestContext } from "node:test";

import { BridgeClient } from "../src/bridge-client.js";
import {
  MockBridge,
  type MockAssemblyComponent,
} from "../src/mock-bridge.js";
import { SessionLocator } from "../src/session-locator.js";

const assemblyFixture: MockAssemblyComponent = {
  instanceName: "ROOT",
  displayName: "mock-assembly",
  prototypePartIdentifier: "mock-assembly.prt",
  suppressed: false,
  loadState: "loaded",
  representationMode: "Exact",
  children: [
    {
      instanceName: "SUBASSEMBLY_A",
      displayName: "subassembly-a",
      prototypePartIdentifier: "subassembly-a.prt",
      suppressed: false,
      loadState: "loaded",
      representationMode: "Exact",
      children: [
        {
          instanceName: "BOLT_1",
          displayName: "bolt",
          prototypePartIdentifier: "bolt.prt",
          suppressed: false,
          loadState: "loaded",
          representationMode: "Lightweight",
        },
        {
          instanceName: "BOLT_2",
          displayName: "bolt",
          prototypePartIdentifier: "bolt.prt",
          suppressed: false,
          loadState: "loaded",
          representationMode: "Lightweight",
        },
      ],
    },
    {
      instanceName: "PLATE_B",
      displayName: "plate",
      prototypePartIdentifier: "plate.prt",
      suppressed: true,
      loadState: "unloaded",
      representationMode: "None",
    },
  ],
};

async function withAssemblyBridge(
  context: TestContext,
  licensed: boolean,
): Promise<BridgeClient> {
  const tempDirectory = await mkdtemp(
    path.join(os.tmpdir(), "nx-codex-assembly-read-"),
  );
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({
    sessionFile,
    licensedModules: { assembly: licensed },
    assemblyRoot: assemblyFixture,
  });
  await bridge.start();
  context.after(async () => {
    await bridge.stop();
    await rm(tempDirectory, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 50,
    });
  });
  return new BridgeClient(new SessionLocator(sessionFile), 5_000);
}

test("strict fake returns a stable, complete, read-only assembly hierarchy", async (context) => {
  const client = await withAssemblyBridge(context, true);
  const before = await client.call("get_session_state");
  const first = await client.call("get_assembly_structure", {
    maxDepth: 8,
    maxComponents: 128,
  });
  const second = await client.call("get_assembly_structure", {
    maxDepth: 8,
    maxComponents: 128,
  });
  const after = await client.call("get_session_state");

  assert.equal(first.adapterId, "nx12.0.2.9");
  assert.equal(first.unsupportedReason, "");
  assert.equal(first.assemblyReadAvailable, true);
  assert.equal(first.isAssembly, true);
  assert.equal(first.rootComponent?.index, 0);
  assert.equal(first.rootComponent?.childCount, 2);
  assert.equal(first.componentCount, 4);
  assert.equal(first.returnedComponentCount, 4);
  assert.equal(first.componentCountComplete, true);
  assert.equal(first.assemblyStructureTruncated, false);
  assert.deepEqual(
    first.components?.map((component) => ({
      index: component.index,
      parentIndex: component.parentIndex,
      depth: component.depth,
      instanceName: component.instanceName,
      prototype: component.prototypePartIdentifier,
      suppressed: component.suppressed,
      loadState: component.loadState,
    })),
    [
      {
        index: 1,
        parentIndex: 0,
        depth: 1,
        instanceName: "SUBASSEMBLY_A",
        prototype: "subassembly-a.prt",
        suppressed: false,
        loadState: "loaded",
      },
      {
        index: 2,
        parentIndex: 0,
        depth: 1,
        instanceName: "PLATE_B",
        prototype: "plate.prt",
        suppressed: true,
        loadState: "unloaded",
      },
      {
        index: 3,
        parentIndex: 1,
        depth: 2,
        instanceName: "BOLT_1",
        prototype: "bolt.prt",
        suppressed: false,
        loadState: "loaded",
      },
      {
        index: 4,
        parentIndex: 1,
        depth: 2,
        instanceName: "BOLT_2",
        prototype: "bolt.prt",
        suppressed: false,
        loadState: "loaded",
      },
    ],
  );
  assert.match(first.assemblyStructureFingerprint ?? "", /^[a-f0-9]{64}$/);
  assert.equal(
    second.assemblyStructureFingerprint,
    first.assemblyStructureFingerprint,
  );
  assert.deepEqual(
    {
      modified: after.modified,
      featureCount: after.featureCount,
      bodyCount: after.bodyCount,
    },
    {
      modified: before.modified,
      featureCount: before.featureCount,
      bodyCount: before.bodyCount,
    },
  );
});

test("strict fake enforces depth and component return limits", async (context) => {
  const client = await withAssemblyBridge(context, true);

  const depthLimited = await client.call("get_assembly_structure", {
    maxDepth: 1,
    maxComponents: 128,
  });
  assert.equal(depthLimited.componentCount, 2);
  assert.equal(depthLimited.depthTruncated, true);
  assert.equal(depthLimited.componentLimitTruncated, false);
  assert.equal(depthLimited.componentCountComplete, false);
  assert.equal(depthLimited.components?.[0]?.childrenTruncated, true);

  const countLimited = await client.call("get_assembly_structure", {
    maxDepth: 8,
    maxComponents: 2,
  });
  assert.equal(countLimited.componentCount, 2);
  assert.equal(countLimited.componentLimitTruncated, true);
  assert.equal(countLimited.assemblyStructureTruncated, true);
  assert.equal(countLimited.componentCountComplete, false);
  assert.equal(countLimited.components?.length, 2);
});

test("strict fake fails closed when no assembly license is active", async (context) => {
  const client = await withAssemblyBridge(context, false);
  const before = await client.call("get_session_state");
  const result = await client.call("get_assembly_structure", {
    maxDepth: 8,
    maxComponents: 128,
  });
  const after = await client.call("get_session_state");

  assert.equal(result.adapterId, "nx12.0.2.9");
  assert.equal(result.assemblyReadAvailable, false);
  assert.equal(result.licensed, false);
  assert.match(result.unsupportedReason ?? "", /No assembly license is active/);
  assert.deepEqual(result.components, []);
  assert.equal(result.componentCount, 0);
  assert.equal(result.assemblyStructureFingerprint, undefined);
  assert.deepEqual(
    {
      modified: after.modified,
      featureCount: after.featureCount,
      bodyCount: after.bodyCount,
    },
    {
      modified: before.modified,
      featureCount: before.featureCount,
      bodyCount: before.bodyCount,
    },
  );
});
