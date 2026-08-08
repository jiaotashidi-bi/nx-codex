import net from "node:net";

import { writeAuditEvent } from "./audit.js";
import {
  BridgeOperationError,
  BridgeProtocolError,
  BridgeUnavailableError,
} from "./errors.js";
import {
  BridgeResponseSchema,
  CaeCapabilityResultSchema,
  MAX_RESPONSE_BYTES,
  createBridgeRequest,
  type BridgeArguments,
  type BridgeOperation,
  type BridgeResult,
} from "./protocol.js";
import { SessionLocator } from "./session-locator.js";

const DEFAULT_TIMEOUT_MS = 20_000;

function pipePath(pipeName: string): string {
  if (process.platform !== "win32") {
    throw new BridgeUnavailableError(
      "The NX live bridge currently supports Windows only.",
    );
  }
  return `\\\\.\\pipe\\${pipeName}`;
}

export class BridgeClient {
  public constructor(
    private readonly sessions = new SessionLocator(),
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  public async call(
    operation: BridgeOperation,
    args: BridgeArguments = {},
  ): Promise<BridgeResult> {
    const session = await this.sessions.discover();
    const request = createBridgeRequest(
      session,
      operation,
      args,
      this.timeoutMs,
    );
    const started = Date.now();

    try {
      const response = await this.exchange(
        pipePath(session.pipeName),
        `${JSON.stringify(request)}\n`,
        request.requestId,
      );
      if (!response.ok) {
        const error = response.error;
        if (!error) {
          throw new BridgeProtocolError(
            "NX bridge returned a failed response without an error payload.",
          );
        }
        throw new BridgeOperationError(
          error.code,
          error.message,
          error.retryable,
        );
      }
      if (!response.result) {
        throw new BridgeProtocolError(
          "NX bridge returned a successful response without a result.",
        );
      }
      let result: BridgeResult;
      try {
        result =
          operation === "get_cae_capability"
            ? CaeCapabilityResultSchema.parse(response.result)
            : response.result;
      } catch (error) {
        throw new BridgeProtocolError(
          `NX bridge returned an invalid ${operation} result: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        );
      }

      await writeAuditEvent({
        requestId: request.requestId,
        operation,
        ok: true,
        durationMs: Date.now() - started,
        bridgeProcessId: session.processId,
      });
      return result;
    } catch (error) {
      await writeAuditEvent({
        requestId: request.requestId,
        operation,
        ok: false,
        durationMs: Date.now() - started,
        bridgeProcessId: session.processId,
        errorCode:
          error instanceof BridgeOperationError
            ? error.code
            : error instanceof Error
              ? error.name
              : "UNKNOWN",
      });
      throw error;
    }
  }

  private async exchange(
    targetPipe: string,
    payload: string,
    expectedRequestId: string,
  ): Promise<ReturnType<typeof BridgeResponseSchema.parse>> {
    return await new Promise((resolve, reject) => {
      let settled = false;
      let buffered = Buffer.alloc(0);
      const socket = net.createConnection(targetPipe);

      const finish = (callback: () => void): void => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        callback();
      };

      const timer = setTimeout(() => {
        finish(() =>
          reject(
            new BridgeUnavailableError(
              `NX bridge did not respond within ${this.timeoutMs} ms.`,
            ),
          ),
        );
      }, this.timeoutMs);

      socket.once("connect", () => {
        socket.write(payload, "utf8");
      });

      socket.on("data", (chunk: Buffer) => {
        buffered = Buffer.concat([buffered, chunk]);
        if (buffered.byteLength > MAX_RESPONSE_BYTES) {
          finish(() =>
            reject(
              new BridgeProtocolError(
                "NX bridge response exceeded the maximum allowed size.",
              ),
            ),
          );
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
          const response = BridgeResponseSchema.parse(raw);
          if (response.requestId !== expectedRequestId) {
            throw new BridgeProtocolError(
              "NX bridge response request ID did not match the request.",
            );
          }
          finish(() => resolve(response));
        } catch (error) {
          finish(() =>
            reject(
              error instanceof BridgeProtocolError
                ? error
                : new BridgeProtocolError(
                    `NX bridge returned an invalid response: ${
                      error instanceof Error ? error.message : "unknown error"
                    }`,
                  ),
            ),
          );
        }
      });

      socket.once("error", (error) => {
        finish(() =>
          reject(
            new BridgeUnavailableError(
              `Unable to connect to the NX bridge: ${error.message}`,
            ),
          ),
        );
      });

      socket.once("end", () => {
        if (!settled) {
          finish(() =>
            reject(
              new BridgeProtocolError(
                "NX bridge closed the pipe before returning a response.",
              ),
            ),
          );
        }
      });
    });
  }
}
