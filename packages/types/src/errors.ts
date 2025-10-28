/**
 * Base error class for all Uranium SDK errors
 * Extends the native Error class with additional context
 */
export class UraniumError extends Error {
  /** Error code for programmatic error handling */
  public readonly code: string
  /** HTTP status code if applicable */
  public readonly statusCode?: number
  /** Additional context data */
  public readonly context?: Record<string, unknown>

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = "UraniumError"
    this.code = code
    this.statusCode = statusCode
    this.context = context

    // Maintains proper stack trace for where error was thrown
    const ErrorConstructor = Error as unknown as {
      captureStackTrace?: (
        targetObject: object,
        constructorOpt?: { new (...args: unknown[]): unknown },
      ) => void
    }
    if (typeof ErrorConstructor.captureStackTrace === "function") {
      ErrorConstructor.captureStackTrace(
        this,
        this.constructor as { new (...args: unknown[]): unknown },
      )
    }
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthenticationError extends UraniumError {
  constructor(
    message: string = "Authentication failed",
    code: string = "AUTH_ERROR",
    statusCode: number = 401,
    context?: Record<string, unknown>,
  ) {
    super(message, code, statusCode, context)
    this.name = "AuthenticationError"
  }
}

/**
 * Input validation errors
 */
export class ValidationError extends UraniumError {
  /** Fields that failed validation */
  public readonly fields?: Record<string, string[]>

  constructor(
    message: string = "Validation failed",
    code: string = "VALIDATION_ERROR",
    fields?: Record<string, string[]>,
    context?: Record<string, unknown>,
  ) {
    super(message, code, 400, context)
    this.name = "ValidationError"
    this.fields = fields
  }
}

/**
 * Network and connectivity errors
 */
export class NetworkError extends UraniumError {
  /** Whether the request can be retried */
  public readonly isRetryable: boolean
  /** Original error if available */
  public readonly originalError?: Error

  constructor(
    message: string = "Network error occurred",
    code: string = "NETWORK_ERROR",
    isRetryable: boolean = true,
    originalError?: Error,
    context?: Record<string, unknown>,
  ) {
    super(message, code, undefined, context)
    this.name = "NetworkError"
    this.isRetryable = isRetryable
    this.originalError = originalError
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends UraniumError {
  /** Type of resource that was not found */
  public readonly resourceType?: string
  /** ID of the resource that was not found */
  public readonly resourceId?: string

  constructor(
    message: string = "Resource not found",
    code: string = "NOT_FOUND",
    resourceType?: string,
    resourceId?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, code, 404, context)
    this.name = "NotFoundError"
    this.resourceType = resourceType
    this.resourceId = resourceId
  }
}

/**
 * Upload operation errors
 */
export class UploadError extends UraniumError {
  /** Number of retry attempts made */
  public readonly retryAttempts?: number
  /** Original error if available */
  public readonly originalError?: Error

  constructor(
    message: string = "Upload failed",
    code: string = "UPLOAD_ERROR",
    retryAttempts?: number,
    originalError?: Error,
    context?: Record<string, unknown>,
  ) {
    super(message, code, undefined, context)
    this.name = "UploadError"
    this.retryAttempts = retryAttempts
    this.originalError = originalError
  }
}

/**
 * Type guard to check if an error is a UraniumError
 */
export function isUraniumError(error: unknown): error is UraniumError {
  return error instanceof UraniumError
}

/**
 * Type guard to check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return error.isRetryable
  }
  if (error instanceof UraniumError) {
    // Retry on rate limits, timeouts, and service unavailable
    return (
      error.statusCode === 429 ||
      error.statusCode === 408 ||
      error.statusCode === 503
    )
  }
  return false
}
