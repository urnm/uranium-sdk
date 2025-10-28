import { describe, expect, test } from "bun:test"
import {
  AuthenticationError,
  BlockchainError,
  createErrorFromResponse,
  ERROR_CODE_TO_STATUS,
  ErrorCode,
  isRetryableError,
  isUraniumError,
  LimitExceededError,
  MintingError,
  NetworkError,
  NotFoundError,
  UploadError,
  UraniumError,
  ValidationError,
} from "./errors"

describe("Error Classes", () => {
  describe("LimitExceededError", () => {
    test("should create error with default values", () => {
      const error = new LimitExceededError()

      expect(error).toBeInstanceOf(LimitExceededError)
      expect(error).toBeInstanceOf(UraniumError)
      expect(error.name).toBe("LimitExceededError")
      expect(error.message).toBe("Limit exceeded")
      expect(error.code).toBe("LIMIT_EXCEEDED")
      expect(error.statusCode).toBe(429)
    })

    test("should create error with custom values", () => {
      const resetDate = new Date("2024-12-31")
      const error = new LimitExceededError(
        "Custom limit exceeded",
        "RATE_LIMIT",
        100,
        150,
        resetDate,
        { userId: "123" },
      )

      expect(error.message).toBe("Custom limit exceeded")
      expect(error.code).toBe("RATE_LIMIT")
      expect(error.limit).toBe(100)
      expect(error.current).toBe(150)
      expect(error.resetAt).toBe(resetDate)
      expect(error.context).toEqual({ userId: "123" })
      expect(error.statusCode).toBe(429)
    })

    test("should be instance of UraniumError", () => {
      const error = new LimitExceededError()
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(UraniumError)
    })
  })

  describe("BlockchainError", () => {
    test("should create error with default values", () => {
      const error = new BlockchainError()

      expect(error).toBeInstanceOf(BlockchainError)
      expect(error).toBeInstanceOf(UraniumError)
      expect(error.name).toBe("BlockchainError")
      expect(error.message).toBe("Blockchain transaction failed")
      expect(error.code).toBe("BLOCKCHAIN_ERROR")
      expect(error.statusCode).toBe(500)
    })

    test("should create error with transaction details", () => {
      const error = new BlockchainError(
        "Transaction reverted",
        "TX_REVERT",
        "0xabc123",
        "0xdef456",
        { reason: "insufficient gas" },
      )

      expect(error.message).toBe("Transaction reverted")
      expect(error.code).toBe("TX_REVERT")
      expect(error.transactionHash).toBe("0xabc123")
      expect(error.contractAddress).toBe("0xdef456")
      expect(error.context).toEqual({ reason: "insufficient gas" })
      expect(error.statusCode).toBe(500)
    })

    test("should be instance of UraniumError", () => {
      const error = new BlockchainError()
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(UraniumError)
    })
  })

  describe("MintingError", () => {
    test("should create error with default values", () => {
      const error = new MintingError()

      expect(error).toBeInstanceOf(MintingError)
      expect(error).toBeInstanceOf(UraniumError)
      expect(error.name).toBe("MintingError")
      expect(error.message).toBe("Minting failed")
      expect(error.code).toBe("MINTING_ERROR")
      expect(error.statusCode).toBe(500)
    })

    test("should create error with asset details", () => {
      const error = new MintingError(
        "Metadata validation failed",
        "METADATA_ERROR",
        "asset-123",
        "upload",
        { field: "title" },
      )

      expect(error.message).toBe("Metadata validation failed")
      expect(error.code).toBe("METADATA_ERROR")
      expect(error.assetId).toBe("asset-123")
      expect(error.stage).toBe("upload")
      expect(error.context).toEqual({ field: "title" })
      expect(error.statusCode).toBe(500)
    })

    test("should be instance of UraniumError", () => {
      const error = new MintingError()
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(UraniumError)
    })
  })
})

describe("ErrorCode enum", () => {
  test("should have authentication error codes", () => {
    expect(ErrorCode.AUTH_REQUIRED).toBe("AUTH_REQUIRED")
    expect(ErrorCode.AUTH_INVALID).toBe("AUTH_INVALID")
    expect(ErrorCode.AUTH_EXPIRED).toBe("AUTH_EXPIRED")
    expect(ErrorCode.PERMISSION_DENIED).toBe("PERMISSION_DENIED")
  })

  test("should have validation error codes", () => {
    expect(ErrorCode.INVALID_INPUT).toBe("INVALID_INPUT")
    expect(ErrorCode.MISSING_FIELD).toBe("MISSING_FIELD")
    expect(ErrorCode.INVALID_FORMAT).toBe("INVALID_FORMAT")
    expect(ErrorCode.VALUE_OUT_OF_RANGE).toBe("VALUE_OUT_OF_RANGE")
  })

  test("should have resource error codes", () => {
    expect(ErrorCode.NOT_FOUND).toBe("NOT_FOUND")
    expect(ErrorCode.ALREADY_EXISTS).toBe("ALREADY_EXISTS")
    expect(ErrorCode.CONFLICT).toBe("CONFLICT")
  })
})

describe("ERROR_CODE_TO_STATUS mapping", () => {
  test("should map authentication errors to correct status codes", () => {
    expect(ERROR_CODE_TO_STATUS[ErrorCode.AUTH_REQUIRED]).toBe(401)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.AUTH_INVALID]).toBe(401)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.AUTH_EXPIRED]).toBe(401)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.PERMISSION_DENIED]).toBe(403)
  })

  test("should map validation errors to 400", () => {
    expect(ERROR_CODE_TO_STATUS[ErrorCode.INVALID_INPUT]).toBe(400)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.MISSING_FIELD]).toBe(400)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.INVALID_FORMAT]).toBe(400)
  })

  test("should map resource errors correctly", () => {
    expect(ERROR_CODE_TO_STATUS[ErrorCode.NOT_FOUND]).toBe(404)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.ALREADY_EXISTS]).toBe(409)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.CONFLICT]).toBe(409)
  })

  test("should map limit errors correctly", () => {
    expect(ERROR_CODE_TO_STATUS[ErrorCode.RATE_LIMIT_EXCEEDED]).toBe(429)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.QUOTA_EXCEEDED]).toBe(429)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.FILE_TOO_LARGE]).toBe(413)
  })

  test("should map upload errors correctly", () => {
    expect(ERROR_CODE_TO_STATUS[ErrorCode.UPLOAD_FAILED]).toBe(500)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.UPLOAD_TIMEOUT]).toBe(408)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.INVALID_FILE_TYPE]).toBe(400)
  })

  test("should map blockchain errors to 500", () => {
    expect(ERROR_CODE_TO_STATUS[ErrorCode.TRANSACTION_FAILED]).toBe(500)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.TRANSACTION_REVERTED]).toBe(500)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.GAS_ESTIMATION_FAILED]).toBe(500)
  })

  test("should map network errors to 500/503", () => {
    expect(ERROR_CODE_TO_STATUS[ErrorCode.NETWORK_ERROR]).toBe(500)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.TIMEOUT]).toBe(408)
    expect(ERROR_CODE_TO_STATUS[ErrorCode.CONNECTION_FAILED]).toBe(503)
  })
})

describe("createErrorFromResponse", () => {
  test("should create AuthenticationError for AUTH_ codes", () => {
    const error = createErrorFromResponse(
      "error",
      "AUTH_REQUIRED",
      "Auth required",
    )

    expect(error).toBeInstanceOf(AuthenticationError)
    expect(error.message).toBe("Auth required")
    expect(error.code).toBe("AUTH_REQUIRED")
  })

  test("should create AuthenticationError for PERMISSION_DENIED", () => {
    const error = createErrorFromResponse(
      "error",
      "PERMISSION_DENIED",
      "Access denied",
    )

    expect(error).toBeInstanceOf(AuthenticationError)
    expect(error.message).toBe("Access denied")
  })

  test("should create ValidationError for INVALID_ codes", () => {
    const error = createErrorFromResponse(
      "error",
      "INVALID_INPUT",
      "Invalid data",
    )

    expect(error).toBeInstanceOf(ValidationError)
    expect(error.message).toBe("Invalid data")
  })

  test("should create ValidationError for MISSING_FIELD", () => {
    const error = createErrorFromResponse(
      "error",
      "MISSING_FIELD",
      "Field required",
    )

    expect(error).toBeInstanceOf(ValidationError)
    expect(error.message).toBe("Field required")
  })

  test("should create ValidationError for VALUE_OUT_OF_RANGE", () => {
    const error = createErrorFromResponse(
      "error",
      "VALUE_OUT_OF_RANGE",
      "Value too large",
    )

    expect(error).toBeInstanceOf(ValidationError)
    expect(error.message).toBe("Value too large")
  })

  test("should create NotFoundError for NOT_FOUND code", () => {
    const error = createErrorFromResponse(
      "error",
      "NOT_FOUND",
      "Resource not found",
    )

    expect(error).toBeInstanceOf(NotFoundError)
    expect(error.message).toBe("Resource not found")
  })

  test("should create LimitExceededError for RATE_LIMIT_EXCEEDED", () => {
    const error = createErrorFromResponse(
      "error",
      "RATE_LIMIT_EXCEEDED",
      "Too many requests",
    )

    expect(error).toBeInstanceOf(LimitExceededError)
    expect(error.message).toBe("Too many requests")
  })

  test("should create LimitExceededError for QUOTA_EXCEEDED", () => {
    const error = createErrorFromResponse(
      "error",
      "QUOTA_EXCEEDED",
      "Quota exceeded",
    )

    expect(error).toBeInstanceOf(LimitExceededError)
    expect(error.message).toBe("Quota exceeded")
  })

  test("should create LimitExceededError for FILE_TOO_LARGE", () => {
    const error = createErrorFromResponse(
      "error",
      "FILE_TOO_LARGE",
      "File too large",
    )

    expect(error).toBeInstanceOf(LimitExceededError)
    expect(error.message).toBe("File too large")
  })

  test("should create UploadError for UPLOAD_ codes", () => {
    const error = createErrorFromResponse(
      "error",
      "UPLOAD_FAILED",
      "Upload failed",
    )

    expect(error).toBeInstanceOf(UploadError)
    expect(error.message).toBe("Upload failed")
  })

  test("should create UploadError for CHUNK_UPLOAD_FAILED", () => {
    const error = createErrorFromResponse(
      "error",
      "CHUNK_UPLOAD_FAILED",
      "Chunk failed",
    )

    expect(error).toBeInstanceOf(UploadError)
    expect(error.message).toBe("Chunk failed")
  })

  test("should create MintingError for MINTING_ codes", () => {
    const error = createErrorFromResponse(
      "error",
      "MINTING_FAILED",
      "Minting failed",
    )

    expect(error).toBeInstanceOf(MintingError)
    expect(error.message).toBe("Minting failed")
  })

  test("should create MintingError for METADATA_INVALID", () => {
    const error = createErrorFromResponse(
      "error",
      "METADATA_INVALID",
      "Invalid metadata",
    )

    expect(error).toBeInstanceOf(MintingError)
    expect(error.message).toBe("Invalid metadata")
  })

  test("should create BlockchainError for TRANSACTION_ codes", () => {
    const error = createErrorFromResponse(
      "error",
      "TRANSACTION_FAILED",
      "Transaction failed",
    )

    expect(error).toBeInstanceOf(BlockchainError)
    expect(error.message).toBe("Transaction failed")
  })

  test("should create BlockchainError for GAS_ codes", () => {
    const error = createErrorFromResponse(
      "error",
      "GAS_ESTIMATION_FAILED",
      "Gas estimation failed",
    )

    expect(error).toBeInstanceOf(BlockchainError)
    expect(error.message).toBe("Gas estimation failed")
  })

  test("should create NetworkError for NETWORK_ codes", () => {
    const error = createErrorFromResponse(
      "error",
      "NETWORK_ERROR",
      "Network error",
    )

    expect(error).toBeInstanceOf(NetworkError)
    expect(error.message).toBe("Network error")
  })

  test("should create NetworkError for TIMEOUT", () => {
    const error = createErrorFromResponse("error", "TIMEOUT", "Request timeout")

    expect(error).toBeInstanceOf(NetworkError)
    expect(error.message).toBe("Request timeout")
  })

  test("should create NetworkError for CONNECTION_FAILED", () => {
    const error = createErrorFromResponse(
      "error",
      "CONNECTION_FAILED",
      "Connection failed",
    )

    expect(error).toBeInstanceOf(NetworkError)
    expect(error.message).toBe("Connection failed")
  })

  test("should create base UraniumError for unknown code", () => {
    const error = createErrorFromResponse(
      "error",
      "CUSTOM_ERROR",
      "Custom error",
    )

    expect(error).toBeInstanceOf(UraniumError)
    expect(error.message).toBe("Custom error")
    expect(error.code).toBe("CUSTOM_ERROR")
  })

  test("should use default message when not provided", () => {
    const error = createErrorFromResponse("error")

    expect(error.message).toBe("An error occurred")
  })

  test("should use UNKNOWN_ERROR when errorCode is null", () => {
    const error = createErrorFromResponse("error", null, "Some error")

    expect(error.code).toBe("UNKNOWN_ERROR")
  })

  test("should map statusCode correctly for known errors", () => {
    const error = createErrorFromResponse("error", "AUTH_REQUIRED")

    expect(error.statusCode).toBe(401)
  })

  test("should default to 500 for unknown error codes", () => {
    const error = createErrorFromResponse("error", "UNKNOWN_CODE")

    expect(error.statusCode).toBe(500)
  })
})

describe("Error helper functions", () => {
  test("isUraniumError should identify Uranium errors", () => {
    const uraniumError = new UraniumError("test")
    const regularError = new Error("test")

    expect(isUraniumError(uraniumError)).toBe(true)
    expect(isUraniumError(regularError)).toBe(false)
  })

  test("isRetryableError should identify retryable errors", () => {
    const networkError = new NetworkError("Network failed")
    const authError = new AuthenticationError("Auth failed")

    expect(isRetryableError(networkError)).toBe(true)
    expect(isRetryableError(authError)).toBe(false)
  })
})
