import {
  BridgeOperationSchema,
  type BridgeOperation,
} from "./protocol.js";

export type FaultPhase = "before_execution" | "after_execution";

export type FaultKind = "modal_dialog" | "disconnect" | "crash" | "timeout";

/**
 * A single deterministic fault. Rules are consumed strictly in array order;
 * a rule that does not match the current phase/operation is not skipped.
 * This makes a test fail loudly when the protocol executes a different API.
 */
export type DeterministicFault = {
  id: string;
  kind: FaultKind;
  phase: FaultPhase;
  operation?: BridgeOperation;
  delayMs?: number;
};

export type FaultEvent = {
  id: string;
  kind: FaultKind;
  phase: FaultPhase;
  operation: BridgeOperation;
  requestId: string;
};

export class DeterministicFaultInjector {
  private cursor = 0;
  private readonly eventsValue: FaultEvent[] = [];

  public constructor(private readonly rules: readonly DeterministicFault[]) {
    const ids = new Set<string>();
    for (const rule of rules) {
      if (
        typeof rule.id !== "string" ||
        rule.id.trim().length === 0 ||
        ids.has(rule.id)
      ) {
        throw new Error("Fault injection rule IDs must be non-empty and unique.");
      }
      ids.add(rule.id);
      if (!new Set(["before_execution", "after_execution"]).has(rule.phase)) {
        throw new Error("Fault injection phase is not supported.");
      }
      if (
        !new Set(["modal_dialog", "disconnect", "crash", "timeout"]).has(
          rule.kind,
        )
      ) {
        throw new Error("Fault injection kind is not supported.");
      }
      if (
        rule.operation !== undefined &&
        !BridgeOperationSchema.safeParse(rule.operation).success
      ) {
        throw new Error("Fault injection operation is not a bridge operation.");
      }
      if (
        rule.delayMs !== undefined &&
        (!Number.isSafeInteger(rule.delayMs) || rule.delayMs < 0)
      ) {
        throw new Error("Fault injection delayMs must be a non-negative integer.");
      }
    }
  }

  public take(
    phase: FaultPhase,
    operation: BridgeOperation,
    requestId: string,
  ): DeterministicFault | undefined {
    const rule = this.rules[this.cursor];
    if (
      rule === undefined ||
      rule.phase !== phase ||
      (rule.operation !== undefined && rule.operation !== operation)
    ) {
      return undefined;
    }

    this.cursor += 1;
    this.eventsValue.push({
      id: rule.id,
      kind: rule.kind,
      phase,
      operation,
      requestId,
    });
    return rule;
  }

  public get events(): readonly FaultEvent[] {
    return this.eventsValue;
  }

  public get remainingRuleIds(): readonly string[] {
    return this.rules.slice(this.cursor).map((rule) => rule.id);
  }
}
