import { lstat, readFile, realpath } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { z } from "zod/v4";

import { PathPolicyError } from "./errors.js";

const MAX_POLICY_BYTES = 16 * 1024;
const MAX_PATH_LENGTH = 240;
const RESERVED_DEVICE_NAME =
  /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

const PolicySchema = z
  .object({
    version: z.literal(1),
    allowedRoots: z
      .array(z.string().min(3).max(MAX_PATH_LENGTH))
      .min(1)
      .max(8),
  })
  .strict();

export type FilePathIntent = "open" | "create";

export type ExportPathIntent = "create";

export function policyFilePath(): string {
  const configured = process.env.NX_CODEX_POLICY_FILE;
  if (configured) {
    return path.win32.normalize(configured);
  }
  const localAppData =
    process.env.LOCALAPPDATA ??
    path.win32.join(os.homedir(), "AppData", "Local");
  return path.win32.join(localAppData, "NXCodex", "policy.json");
}

function rejectUnsafeWindowsSyntax(value: string, label: string): string {
  if (value.length === 0 || value.length > MAX_PATH_LENGTH) {
    throw new PathPolicyError(
      "PATH_NOT_ALLOWED",
      `${label} must be between 1 and ${MAX_PATH_LENGTH} characters.`,
    );
  }
  if (
    value.startsWith("\\\\") ||
    value.startsWith("//") ||
    /^\\\\[.?]\\/.test(value) ||
    /^\\\?\?\\/.test(value)
  ) {
    throw new PathPolicyError(
      "PATH_NOT_ALLOWED",
      `${label} must be a local drive path; UNC and device paths are forbidden.`,
    );
  }
  if (!/^[A-Za-z]:[\\/]/.test(value) || !path.win32.isAbsolute(value)) {
    throw new PathPolicyError(
      "PATH_NOT_ALLOWED",
      `${label} must be an absolute local Windows path.`,
    );
  }
  if (value.slice(2).includes(":")) {
    throw new PathPolicyError(
      "PATH_NOT_ALLOWED",
      `${label} must not contain an alternate data stream.`,
    );
  }

  const segments = value.slice(3).split(/[\\/]/);
  for (const segment of segments) {
    if (segment === "" || segment === "." || segment === "..") {
      throw new PathPolicyError(
        "PATH_NOT_ALLOWED",
        `${label} contains an empty or relative path segment.`,
      );
    }
    if (/[. ]$/.test(segment) || RESERVED_DEVICE_NAME.test(segment)) {
      throw new PathPolicyError(
        "PATH_NOT_ALLOWED",
        `${label} contains a forbidden Windows path segment.`,
      );
    }
  }
  return path.win32.normalize(value);
}

async function assertNoReparsePoints(
  absolutePath: string,
  includeLeaf: boolean,
): Promise<void> {
  const parsed = path.win32.parse(absolutePath);
  const relativeSegments = absolutePath
    .slice(parsed.root.length)
    .split("\\")
    .filter(Boolean);
  const count = includeLeaf
    ? relativeSegments.length
    : Math.max(0, relativeSegments.length - 1);
  let current = parsed.root;

  for (let index = 0; index < count; index += 1) {
    current = path.win32.join(current, relativeSegments[index]!);
    let info;
    try {
      info = await lstat(current);
    } catch {
      throw new PathPolicyError(
        "PATH_NOT_ALLOWED",
        `Path component does not exist: ${current}`,
      );
    }
    if (info.isSymbolicLink()) {
      throw new PathPolicyError(
        "PATH_NOT_ALLOWED",
        "Symbolic links and directory junctions are forbidden by the file policy.",
      );
    }
  }
}

function isWithinRoot(candidate: string, root: string): boolean {
  const normalizedCandidate = candidate.toLocaleLowerCase("en-US");
  const normalizedRoot = root.toLocaleLowerCase("en-US");
  return (
    normalizedCandidate === normalizedRoot ||
    normalizedCandidate.startsWith(`${normalizedRoot}\\`)
  );
}

export async function loadAllowedRoots(): Promise<string[]> {
  const file = policyFilePath();
  let text: string;
  try {
    const bytes = await readFile(file);
    if (bytes.byteLength > MAX_POLICY_BYTES) {
      throw new PathPolicyError(
        "POLICY_INVALID",
        "NX Codex file policy exceeds 16 KiB.",
      );
    }
    text = bytes.toString("utf8");
  } catch (error) {
    if (error instanceof PathPolicyError) {
      throw error;
    }
    throw new PathPolicyError(
      "POLICY_UNAVAILABLE",
      `NX Codex file policy is unavailable at ${file}. Run configure-file-policy.ps1 first.`,
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new PathPolicyError(
      "POLICY_INVALID",
      "NX Codex file policy is not valid JSON.",
    );
  }
  const policy = PolicySchema.safeParse(raw);
  if (!policy.success) {
    throw new PathPolicyError(
      "POLICY_INVALID",
      `NX Codex file policy is invalid: ${policy.error.issues[0]?.message ?? "unknown validation error"}`,
    );
  }

  const roots: string[] = [];
  for (const configuredRoot of policy.data.allowedRoots) {
    const root = rejectUnsafeWindowsSyntax(configuredRoot, "Allowed root");
    await assertNoReparsePoints(root, true);
    try {
      await realpath(root);
    } catch {
      throw new PathPolicyError(
        "POLICY_INVALID",
        `Allowed root does not exist or cannot be resolved: ${root}`,
      );
    }
    roots.push(root.replace(/[\\]+$/, ""));
  }
  return [...new Set(roots.map((root) => root.toLocaleLowerCase("en-US")))].map(
    (lowerRoot) =>
      roots.find(
        (root) => root.toLocaleLowerCase("en-US") === lowerRoot,
      )!,
  );
}

export async function validatePartPath(
  suppliedPath: string,
  intent: FilePathIntent,
  configuredRoots?: string[],
): Promise<string> {
  const candidate = rejectUnsafeWindowsSyntax(suppliedPath, "filePath");
  if (path.win32.extname(candidate).toLocaleLowerCase("en-US") !== ".prt") {
    throw new PathPolicyError(
      "PATH_NOT_ALLOWED",
      "Only Siemens NX .prt files are allowed.",
    );
  }

  const roots = configuredRoots ?? (await loadAllowedRoots());
  await assertNoReparsePoints(candidate, false);
  let exists = false;
  try {
    const info = await lstat(candidate);
    exists = true;
    if (info.isSymbolicLink() || !info.isFile()) {
      throw new PathPolicyError(
        "PATH_NOT_ALLOWED",
        "filePath must refer to a regular, non-reparse file.",
      );
    }
  } catch (error) {
    if (error instanceof PathPolicyError) {
      throw error;
    }
  }

  if (intent === "open" && !exists) {
    throw new PathPolicyError(
      "FILE_NOT_FOUND",
      "The requested NX part does not exist.",
    );
  }
  if (intent === "create" && exists) {
    throw new PathPolicyError(
      "TARGET_EXISTS",
      "The destination already exists; NX Codex never overwrites a part.",
    );
  }

  const parent = path.win32.dirname(candidate);
  let canonicalParent: string;
  try {
    canonicalParent = path.win32.normalize(await realpath(parent));
  } catch {
    throw new PathPolicyError(
      "PATH_NOT_ALLOWED",
      "The destination directory does not exist or cannot be resolved.",
    );
  }
  const canonicalCandidate = path.win32.join(
    canonicalParent,
    path.win32.basename(candidate),
  );
  const canonicalRoots = await Promise.all(
    roots.map(async (root) => path.win32.normalize(await realpath(root))),
  );
  if (
    !canonicalRoots.some((root) =>
      isWithinRoot(canonicalCandidate, root),
    )
  ) {
    throw new PathPolicyError(
      "PATH_NOT_ALLOWED",
      "Canonical filePath escapes every configured allowed root.",
    );
  }
  return canonicalCandidate;
}

/**
 * Validate a STEP export destination using the same no-traversal, no-reparse,
 * allowed-root policy as native NX part files.  STEP is an output-only path:
 * existing destinations are never accepted.
 */
export async function validateStepPath(
  suppliedPath: string,
  intent: ExportPathIntent = "create",
  configuredRoots?: string[],
): Promise<string> {
  const candidate = rejectUnsafeWindowsSyntax(suppliedPath, "filePath");
  const extension = path.win32.extname(candidate).toLocaleLowerCase("en-US");
  if (extension !== ".stp" && extension !== ".step") {
    throw new PathPolicyError(
      "PATH_NOT_ALLOWED",
      "Only STEP .stp or .step export files are allowed.",
    );
  }

  const roots = configuredRoots ?? (await loadAllowedRoots());
  await assertNoReparsePoints(candidate, false);
  let exists = false;
  try {
    const info = await lstat(candidate);
    exists = true;
    if (info.isSymbolicLink() || !info.isFile()) {
      throw new PathPolicyError(
        "PATH_NOT_ALLOWED",
        "filePath must refer to a regular, non-reparse file.",
      );
    }
  } catch (error) {
    if (error instanceof PathPolicyError) {
      throw error;
    }
  }
  if (intent === "create" && exists) {
    throw new PathPolicyError(
      "TARGET_EXISTS",
      "The STEP destination already exists; NX Codex never overwrites exports.",
    );
  }

  const parent = path.win32.dirname(candidate);
  let canonicalParent: string;
  try {
    canonicalParent = path.win32.normalize(await realpath(parent));
  } catch {
    throw new PathPolicyError(
      "PATH_NOT_ALLOWED",
      "The destination directory does not exist or cannot be resolved.",
    );
  }
  const canonicalCandidate = path.win32.join(
    canonicalParent,
    path.win32.basename(candidate),
  );
  const canonicalRoots = await Promise.all(
    roots.map(async (root) => path.win32.normalize(await realpath(root))),
  );
  if (!canonicalRoots.some((root) => isWithinRoot(canonicalCandidate, root))) {
    throw new PathPolicyError(
      "PATH_NOT_ALLOWED",
      "Canonical filePath escapes every configured allowed root.",
    );
  }
  return canonicalCandidate;
}

/** Validate a no-overwrite PNG evidence destination below an allowed root. */
export async function validatePngPath(
  suppliedPath: string,
  intent: ExportPathIntent = "create",
  configuredRoots?: string[],
): Promise<string> {
  const candidate = rejectUnsafeWindowsSyntax(suppliedPath, "filePath");
  if (path.win32.extname(candidate).toLocaleLowerCase("en-US") !== ".png") {
    throw new PathPolicyError(
      "PATH_NOT_ALLOWED",
      "Only PNG .png screenshot files are allowed.",
    );
  }

  const roots = configuredRoots ?? (await loadAllowedRoots());
  await assertNoReparsePoints(candidate, false);
  let exists = false;
  try {
    const info = await lstat(candidate);
    exists = true;
    if (info.isSymbolicLink() || !info.isFile()) {
      throw new PathPolicyError(
        "PATH_NOT_ALLOWED",
        "filePath must refer to a regular, non-reparse file.",
      );
    }
  } catch (error) {
    if (error instanceof PathPolicyError) throw error;
  }
  if (intent === "create" && exists) {
    throw new PathPolicyError(
      "TARGET_EXISTS",
      "The screenshot destination already exists; NX Codex never overwrites evidence files.",
    );
  }

  const parent = path.win32.dirname(candidate);
  let canonicalParent: string;
  try {
    canonicalParent = path.win32.normalize(await realpath(parent));
  } catch {
    throw new PathPolicyError(
      "PATH_NOT_ALLOWED",
      "The destination directory does not exist or cannot be resolved.",
    );
  }
  const canonicalCandidate = path.win32.join(
    canonicalParent,
    path.win32.basename(candidate),
  );
  const canonicalRoots = await Promise.all(
    roots.map(async (root) => path.win32.normalize(await realpath(root))),
  );
  if (!canonicalRoots.some((root) => isWithinRoot(canonicalCandidate, root))) {
    throw new PathPolicyError(
      "PATH_NOT_ALLOWED",
      "Canonical filePath escapes every configured allowed root.",
    );
  }
  return canonicalCandidate;
}
