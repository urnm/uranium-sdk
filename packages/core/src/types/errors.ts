// Import base error classes from @uranium/types
import {
  AuthenticationError,
  NetworkError,
  NotFoundError,
  UploadError,
  UraniumError,
  ValidationError,
} from "@uranium/types"

/**
 * Rate limit and quota exceeded errors
 */
export class LimitExceededError extends UraniumError {
  /** Limit that was exceeded */
  public readonly limit?: number
  /** Current value that exceeded the limit */
  public readonly current?: number
  /** When the limit resets (timestamp) */
  public readonly resetAt?: Date

  constructor(
    message: string = "Limit exceeded",
    code: string = "LIMIT_EXCEEDED",
    limit?: number,
    current?: number,
    resetAt?: Date,
    context?: Record<string, unknown>,
  ) {
    super(message, code, 429, context)
    this.name = "LimitExceededError"
    this.limit = limit
    this.current = current
    this.resetAt = resetAt
  }
}

/**
 * File upload errors
 * Re-exported from @uranium/types
 */
// UploadError is imported above and re-exported below

/**
 * Blockchain transaction errors
 */
export class BlockchainError extends UraniumError {
  /** Transaction hash if available */
  public readonly transactionHash?: string
  /** Contract address involved */
  public readonly contractAddress?: string

  constructor(
    message: string = "Blockchain transaction failed",
    code: string = "BLOCKCHAIN_ERROR",
    transactionHash?: string,
    contractAddress?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, code, 500, context)
    this.name = "BlockchainError"
    this.transactionHash = transactionHash
    this.contractAddress = contractAddress
  }
}

/**
 * Minting process errors
 */
export class MintingError extends UraniumError {
  /** Asset/file ID being minted */
  public readonly assetId?: string
  /** Current stage where error occurred */
  public readonly stage?: string

  constructor(
    message: string = "Minting failed",
    code: string = "MINTING_ERROR",
    assetId?: string,
    stage?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, code, 500, context)
    this.name = "MintingError"
    this.assetId = assetId
    this.stage = stage
  }
}

/**
 * Common error codes used across the SDK
 */
export enum ErrorCode {
  // Authentication errors (1xxx)
  AUTH_REQUIRED = "AUTH_REQUIRED",
  AUTH_INVALID = "AUTH_INVALID",
  AUTH_EXPIRED = "AUTH_EXPIRED",
  PERMISSION_DENIED = "PERMISSION_DENIED",

  // Validation errors (2xxx)
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_FIELD = "MISSING_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",
  VALUE_OUT_OF_RANGE = "VALUE_OUT_OF_RANGE",

  // Resource errors (3xxx)
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  CONFLICT = "CONFLICT",

  // Limit errors (4xxx)
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",

  // Upload errors (5xxx)
  UPLOAD_FAILED = "UPLOAD_FAILED",
  UPLOAD_TIMEOUT = "UPLOAD_TIMEOUT",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  CHUNK_UPLOAD_FAILED = "CHUNK_UPLOAD_FAILED",

  // Minting errors (6xxx)
  MINTING_FAILED = "MINTING_FAILED",
  METADATA_INVALID = "METADATA_INVALID",
  CONTRACT_NOT_FOUND = "CONTRACT_NOT_FOUND",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",

  // Blockchain errors (7xxx)
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  TRANSACTION_REVERTED = "TRANSACTION_REVERTED",
  GAS_ESTIMATION_FAILED = "GAS_ESTIMATION_FAILED",
  NETWORK_CONGESTION = "NETWORK_CONGESTION",

  // Network errors (8xxx)
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  CONNECTION_FAILED = "CONNECTION_FAILED",

  // Server errors (9xxx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  MAINTENANCE = "MAINTENANCE",

  // Unknown/Other
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Error code to HTTP status code mapping
 */
export const ERROR_CODE_TO_STATUS: Record<ErrorCode, number> = {
  // 401 - Authentication
  [ErrorCode.AUTH_REQUIRED]: 401,
  [ErrorCode.AUTH_INVALID]: 401,
  [ErrorCode.AUTH_EXPIRED]: 401,
  [ErrorCode.PERMISSION_DENIED]: 403,

  // 400 - Validation
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,
  [ErrorCode.VALUE_OUT_OF_RANGE]: 400,

  // 404/409 - Resources
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.CONFLICT]: 409,

  // 429 - Limits
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.QUOTA_EXCEEDED]: 429,
  [ErrorCode.FILE_TOO_LARGE]: 413,

  // 500 - Upload
  [ErrorCode.UPLOAD_FAILED]: 500,
  [ErrorCode.UPLOAD_TIMEOUT]: 408,
  [ErrorCode.INVALID_FILE_TYPE]: 400,
  [ErrorCode.CHUNK_UPLOAD_FAILED]: 500,

  // 500 - Minting
  [ErrorCode.MINTING_FAILED]: 500,
  [ErrorCode.METADATA_INVALID]: 400,
  [ErrorCode.CONTRACT_NOT_FOUND]: 404,
  [ErrorCode.INSUFFICIENT_BALANCE]: 402,

  // 500 - Blockchain
  [ErrorCode.TRANSACTION_FAILED]: 500,
  [ErrorCode.TRANSACTION_REVERTED]: 500,
  [ErrorCode.GAS_ESTIMATION_FAILED]: 500,
  [ErrorCode.NETWORK_CONGESTION]: 503,

  // 500 - Network
  [ErrorCode.NETWORK_ERROR]: 500,
  [ErrorCode.TIMEOUT]: 408,
  [ErrorCode.CONNECTION_FAILED]: 503,

  // 500 - Server
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.MAINTENANCE]: 503,

  // 500 - Unknown
  [ErrorCode.UNKNOWN_ERROR]: 500,
}

/**
 * Creates an appropriate error instance from an API error response
 */
export function createErrorFromResponse(
  _status: string,
  errorCode?: string | null,
  message?: string,
): UraniumError {
  const msg = message || "An error occurred"
  const code = errorCode || ErrorCode.UNKNOWN_ERROR

  // Map to specific error types based on code
  if (code.startsWith("AUTH_") || code === ErrorCode.PERMISSION_DENIED) {
    return new AuthenticationError(msg, code)
  }

  if (
    code.startsWith("INVALID_") ||
    code === ErrorCode.MISSING_FIELD ||
    code === ErrorCode.VALUE_OUT_OF_RANGE
  ) {
    return new ValidationError(msg, code)
  }

  if (code === ErrorCode.NOT_FOUND) {
    return new NotFoundError(msg, code)
  }

  if (
    code === ErrorCode.RATE_LIMIT_EXCEEDED ||
    code === ErrorCode.QUOTA_EXCEEDED ||
    code === ErrorCode.FILE_TOO_LARGE
  ) {
    return new LimitExceededError(msg, code)
  }

  if (code.startsWith("UPLOAD_") || code === ErrorCode.CHUNK_UPLOAD_FAILED) {
    return new UploadError(msg, code)
  }

  if (code.startsWith("MINTING_") || code === ErrorCode.METADATA_INVALID) {
    return new MintingError(msg, code)
  }

  if (code.startsWith("TRANSACTION_") || code.startsWith("GAS_")) {
    return new BlockchainError(msg, code)
  }

  if (
    code.startsWith("NETWORK_") ||
    code === ErrorCode.TIMEOUT ||
    code === ErrorCode.CONNECTION_FAILED
  ) {
    return new NetworkError(msg, code)
  }

  // Default to base UraniumError
  const statusCode = ERROR_CODE_TO_STATUS[code as ErrorCode] || 500
  return new UraniumError(msg, code, statusCode)
}

// Re-export base error classes from @uranium/types
export {
  AuthenticationError,
  isRetryableError,
  isUraniumError,
  NetworkError,
  NotFoundError,
  UploadError,
  UraniumError,
  ValidationError,
} from "@uranium/types"
