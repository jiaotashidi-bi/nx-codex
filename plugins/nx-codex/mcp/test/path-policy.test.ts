import assert from "node:assert/strict";
import {
  mkdtemp,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { PathPolicyError } from "../src/errors.js";
import {
  loadAllowedRoots,
  validatePartPath,
  validatePngPath,
  validateStepPath,
} from "../src/path-policy.js";

async function expectPolicyCode(
  action: () => Promise<unknown>,
  code: string,
): Promise<void> {
  await assert.rejects(
    action,
    (error: unknown) =>
      error instanceof PathPolicyError && error.code === code,
  );
}

test("file policy accepts only canonical .prt paths below an allowed root", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nx-codex-policy-"));
  context.after(async () => rm(root, { recursive: true, force: true }));

  const candidate = path.join(root, "safe-part.prt");
  const canonicalCandidate = path.join(
    await realpath(root),
    "safe-part.prt",
  );
  assert.equal(
    await validatePartPath(candidate, "create", [root]),
    canonicalCandidate,
  );

  await writeFile(candidate, "strict fake NX part");
  assert.equal(
    await validatePartPath(candidate, "open", [root]),
    canonicalCandidate,
  );
  await expectPolicyCode(
    () => validatePartPath(candidate, "create", [root]),
    "TARGET_EXISTS",
  );
});

test("file policy rejects traversal, sibling-prefix, UNC, ADS, device names, and non-PRT files", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nx-codex-policy-"));
  context.after(async () => rm(root, { recursive: true, force: true }));

  const attacks = [
    path.join(root, "..", "escape.prt"),
    `${root}-sibling\\escape.prt`,
    "\\\\server\\share\\escape.prt",
    "\\\\.\\pipe\\nx-codex\\escape.prt",
    "\\\\?\\C:\\escape.prt",
    "\\\\??\\C:\\escape.prt",
    `${root}\\part.prt:stream`,
    `${root}\\CON.prt`,
    `${root}\\AUX.prt`,
    `${root}\\NUL.prt`,
    `${root}\\COM1.prt`,
    `${root}\\LPT9.prt`,
    `${root}\\trailing.\\part.prt`,
    `${root}\\part.step`,
  ];
  for (const attack of attacks) {
    await expectPolicyCode(
      () => validatePartPath(attack, "create", [root]),
      "PATH_NOT_ALLOWED",
    );
  }
});

test("file policy accepts STEP exports but never an existing destination", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nx-codex-step-policy-"));
  context.after(async () => rm(root, { recursive: true, force: true }));

  const candidate = path.join(root, "safe-export.step");
  assert.equal(
    await validateStepPath(candidate, "create", [root]),
    path.join(await realpath(root), "safe-export.step"),
  );
  await writeFile(candidate, "existing STEP");
  await expectPolicyCode(
    () => validateStepPath(candidate, "create", [root]),
    "TARGET_EXISTS",
  );
  await expectPolicyCode(
    () => validateStepPath(path.join(root, "unsafe.prt"), "create", [root]),
    "PATH_NOT_ALLOWED",
  );
});

test("file policy accepts only new PNG screenshot evidence", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nx-codex-png-policy-"));
  context.after(async () => rm(root, { recursive: true, force: true }));

  const candidate = path.join(root, "verification.png");
  assert.equal(
    await validatePngPath(candidate, "create", [root]),
    path.join(await realpath(root), "verification.png"),
  );
  await writeFile(candidate, "existing PNG");
  await expectPolicyCode(
    () => validatePngPath(candidate, "create", [root]),
    "TARGET_EXISTS",
  );
  await expectPolicyCode(
    () => validatePngPath(path.join(root, "wrong.jpg"), "create", [root]),
    "PATH_NOT_ALLOWED",
  );
});

test("file policy rejects a missing open target and a junction escape", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nx-codex-policy-"));
  const outside = await mkdtemp(path.join(os.tmpdir(), "nx-codex-outside-"));
  context.after(async () => {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  });

  await expectPolicyCode(
    () => validatePartPath(path.join(root, "missing.prt"), "open", [root]),
    "FILE_NOT_FOUND",
  );

  const junction = path.join(root, "junction");
  try {
    await symlink(outside, junction, "junction");
  } catch {
    return;
  }
  await expectPolicyCode(
    () => validatePartPath(path.join(junction, "escape.prt"), "create", [root]),
    "PATH_NOT_ALLOWED",
  );
});

test("policy JSON is strict and rejects unknown fields", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nx-codex-policy-"));
  const policyFile = path.join(root, "policy.json");
  const previous = process.env.NX_CODEX_POLICY_FILE;
  process.env.NX_CODEX_POLICY_FILE = policyFile;
  context.after(async () => {
    if (previous === undefined) {
      delete process.env.NX_CODEX_POLICY_FILE;
    } else {
      process.env.NX_CODEX_POLICY_FILE = previous;
    }
    await rm(root, { recursive: true, force: true });
  });

  await writeFile(
    policyFile,
    JSON.stringify({
      version: 1,
      allowedRoots: [root],
      allowOverwrite: true,
    }),
  );
  await expectPolicyCode(() => loadAllowedRoots(), "POLICY_INVALID");
});
