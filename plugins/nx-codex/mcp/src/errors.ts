export class BridgeUnavailableError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "BridgeUnavailableError";
  }
}

export class BridgeProtocolError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "BridgeProtocolError";
  }
}

export class BridgeOperationError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;

  public constructor(code: string, message: string, retryable: boolean) {
    super(message);
    this.name = "BridgeOperationError";
    this.code = code;
    this.retryable = retryable;
  }
}

export class PathPolicyError extends Error {
  public readonly code: string;

  public constructor(code: string, message: string) {
    super(message);
    this.name = "PathPolicyError";
    this.code = code;
  }
}

export function publicErrorMessage(error: unknown): string {
  if (error instanceof BridgeOperationError) {
    return `${error.code}: ${error.message}`;
  }
  if (
    error instanceof BridgeUnavailableError ||
    error instanceof BridgeProtocolError
  ) {
    return error.message;
  }
  if (error instanceof PathPolicyError) {
    return `${error.code}: ${error.message}`;
  }
  return "The NX bridge returned an unexpected internal error.";
}
