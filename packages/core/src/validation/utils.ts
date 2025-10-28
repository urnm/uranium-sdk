/**
 * Validation Utilities
 *
 * Helper functions for handling Zod validation errors and providing
 * consistent error messages across the SDK.
 *
 * @module @uranium/sdk/validation/utils
 */

import { ValidationError } from "@uranium/types"
import { ZodError, type ZodSchema } from "zod"

/**
 * Convert ZodError to ValidationError with formatted messages
 *
 * @param error - ZodError from schema validation
 * @param prefix - Optional prefix for error message
 * @returns ValidationError with formatted message
 */
export const handleZodError = (
  error: ZodError,
  prefix?: string,
): ValidationError => {
  // Get the first error for the main message
  const firstIssue = error.issues[0]

  if (!firstIssue) {
    // Fallback if no issues (should never happen with ZodError)
    const message = prefix
      ? `${prefix}: Validation failed`
      : "Validation failed"
    return new ValidationError(message, "VALIDATION_ERROR")
  }

  // Build error message
  const _field = firstIssue.path.join(".")
  const message = prefix
    ? `${prefix}: ${firstIssue.message}`
    : firstIssue.message

  // Build validation details object
  const details: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "root"
    if (!details[path]) {
      details[path] = []
    }
    details[path].push(issue.message)
  }

  return new ValidationError(message, "VALIDATION_ERROR", details)
}

/**
 * Validate data against a Zod schema and throw ValidationError on failure
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param errorPrefix - Optional prefix for error messages
 * @returns Validated data (with proper typing)
 * @throws ValidationError if validation fails
 *
 * @example
 * ```typescript
 * const validated = validateSchema(
 *   createContractSchema,
 *   params,
 *   "Invalid contract parameters"
 * );
 * ```
 */
export const validateSchema = <T>(
  schema: ZodSchema<T>,
  data: unknown,
  errorPrefix?: string,
): T => {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof ZodError) {
      throw handleZodError(error, errorPrefix)
    }
    // Re-throw non-Zod errors
    throw error
  }
}
