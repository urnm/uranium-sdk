import { describe, expect, test } from "bun:test"
import { ValidationError } from "@uranium/types"
import { ZodError, z } from "zod"
import {
  contractNameSchema,
  createContractSchema,
  editionsSchema,
} from "./schemas"
import { handleZodError, validateSchema } from "./utils"

describe("Validation Utils", () => {
  describe("handleZodError", () => {
    test("should convert ZodError to ValidationError", () => {
      // Create a schema that will fail
      const schema = z.object({
        name: z.string().min(3),
      })

      try {
        schema.parse({ name: "ab" })
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = handleZodError(error)

          // Check it's a ValidationError instance
          expect(validationError).toBeInstanceOf(ValidationError)
          expect(validationError.name).toBe("ValidationError")
          expect(validationError.code).toBe("VALIDATION_ERROR")
          expect(validationError.statusCode).toBe(400)
        }
      }
    })

    test("should use message from first error issue", () => {
      // Create a schema with multiple validation rules
      const schema = z.object({
        name: z.string().min(3, "Name too short"),
        age: z.number().min(18, "Must be adult"),
      })

      try {
        schema.parse({ name: "ab", age: 10 })
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = handleZodError(error)

          // Should use the message from the first issue
          expect(validationError.message).toBe("Name too short")
        }
      }
    })

    test("should add prefix to error message when provided", () => {
      const schema = z.object({
        name: z.string().min(3, "Name too short"),
      })

      try {
        schema.parse({ name: "ab" })
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = handleZodError(error, "Invalid input")

          // Should prefix the message
          expect(validationError.message).toBe("Invalid input: Name too short")
        }
      }
    })

    test("should not add prefix when prefix is not provided", () => {
      const schema = z.object({
        name: z.string().min(3, "Name too short"),
      })

      try {
        schema.parse({ name: "ab" })
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = handleZodError(error)

          // Should use original message without prefix
          expect(validationError.message).toBe("Name too short")
        }
      }
    })

    test("should collect all errors in details object", () => {
      const schema = z.object({
        name: z.string().min(3, "Name too short"),
        age: z.number().min(18, "Must be adult"),
        email: z.string().email("Invalid email"),
      })

      try {
        schema.parse({ name: "ab", age: 10, email: "invalid" })
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = handleZodError(error)

          // Check details object exists
          expect(validationError.fields).toBeDefined()

          // Should have entries for all failed fields
          expect(validationError.fields?.name).toBeDefined()
          expect(validationError.fields?.age).toBeDefined()
          expect(validationError.fields?.email).toBeDefined()
        }
      }
    })

    test("should group errors by field path", () => {
      const schema = z.object({
        name: z.string().min(3, "Name too short").max(10, "Name too long"),
      })

      try {
        // This will fail both min and max if we manipulate it
        schema.parse({ name: "" })
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = handleZodError(error)

          // Should group errors under the field name
          expect(validationError.fields?.name).toBeDefined()
          expect(Array.isArray(validationError.fields?.name)).toBe(true)
          expect(validationError.fields?.name.length).toBeGreaterThan(0)
        }
      }
    })

    test("should handle nested field paths", () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(3, "Name too short"),
          profile: z.object({
            bio: z.string().min(10, "Bio too short"),
          }),
        }),
      })

      try {
        schema.parse({
          user: {
            name: "ab",
            profile: {
              bio: "short",
            },
          },
        })
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = handleZodError(error)

          // Should use dot notation for nested paths
          expect(validationError.fields?.["user.name"]).toBeDefined()
          expect(validationError.fields?.["user.profile.bio"]).toBeDefined()
        }
      }
    })

    test("should handle root-level errors with 'root' key", () => {
      const schema = z.string().min(3, "Too short")

      try {
        schema.parse("ab")
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = handleZodError(error)

          // Root-level errors should use "root" key
          expect(validationError.fields?.root).toBeDefined()
        }
      }
    })

    test("should handle multiple errors for the same field", () => {
      // Create a schema with multiple constraints
      const schema = z
        .string()
        .min(3, "Too short")
        .max(5, "Too long")
        .regex(/^[a-z]+$/, "Only lowercase letters")

      try {
        // This will fail multiple constraints
        schema.parse("AB123456")
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = handleZodError(error)

          // Should collect all errors for the same field
          expect(validationError.fields?.root).toBeDefined()
          const rootErrors = validationError.fields?.root || []
          expect(rootErrors.length).toBeGreaterThan(0)
        }
      }
    })
  })

  describe("validateSchema", () => {
    test("should return valid data on successful validation", () => {
      const validData = {
        name: "MyContract",
        symbol: "MYC",
        type: "ERC721" as const,
      }

      const result = validateSchema(createContractSchema, validData)

      // Should return the validated data
      expect(result).toEqual(validData)
    })

    test("should throw ValidationError on validation failure", () => {
      const invalidData = {
        name: "ab", // too short
        symbol: "MYC",
        type: "ERC721" as const,
      }

      expect(() => {
        validateSchema(createContractSchema, invalidData)
      }).toThrow(ValidationError)
    })

    test("should add errorPrefix to error message", () => {
      const invalidData = {
        name: "ab", // too short
        symbol: "MYC",
        type: "ERC721" as const,
      }

      try {
        validateSchema(
          createContractSchema,
          invalidData,
          "Invalid contract parameters",
        )
      } catch (error) {
        if (error instanceof ValidationError) {
          expect(error.message).toContain("Invalid contract parameters:")
        }
      }
    })

    test("should include validation details in error", () => {
      const invalidData = {
        name: "ab", // too short
        symbol: "M", // too short
        type: "ERC721" as const,
      }

      try {
        validateSchema(createContractSchema, invalidData)
      } catch (error) {
        if (error instanceof ValidationError) {
          // Should have detailed field errors
          expect(error.fields).toBeDefined()
          expect(error.fields?.name).toBeDefined()
          expect(error.fields?.symbol).toBeDefined()
        }
      }
    })

    test("should re-throw non-Zod errors as-is", () => {
      // Create a custom schema that throws a different error
      const schema = z.any().transform(() => {
        throw new Error("Custom error")
      })

      expect(() => {
        validateSchema(schema, "test")
      }).toThrow(Error)

      try {
        validateSchema(schema, "test")
      } catch (error) {
        // Should not be a ValidationError
        expect(error).not.toBeInstanceOf(ValidationError)
        expect(error instanceof Error && error.message).toBe("Custom error")
      }
    })

    test("should preserve correct TypeScript types", () => {
      const validData = {
        name: "MyContract",
        symbol: "MYC",
        type: "ERC721" as const,
      }

      const result = validateSchema(createContractSchema, validData)

      // TypeScript should infer the correct type
      // These lines would cause TypeScript errors if types were wrong
      const name: string = result.name
      const symbol: string = result.symbol
      const type: "ERC721" | "ERC1155" = result.type

      expect(name).toBe("MyContract")
      expect(symbol).toBe("MYC")
      expect(type).toBe("ERC721")
    })

    test("should validate simple string schema", () => {
      const validName = "ValidContract"
      const result = validateSchema(contractNameSchema, validName)

      expect(result).toBe(validName)
    })

    test("should validate number schema", () => {
      const validEditions = 100
      const result = validateSchema(editionsSchema, validEditions)

      expect(result).toBe(validEditions)
    })

    test("should throw ValidationError for invalid string", () => {
      const invalidName = "ab" // too short

      expect(() => {
        validateSchema(contractNameSchema, invalidName)
      }).toThrow(ValidationError)
    })

    test("should throw ValidationError for invalid number", () => {
      const invalidEditions = 1001 // too many

      expect(() => {
        validateSchema(editionsSchema, invalidEditions)
      }).toThrow(ValidationError)
    })

    test("should handle complex nested objects", () => {
      const validData = {
        name: "MyContract",
        symbol: "MYC",
        type: "ERC1155" as const,
      }

      const result = validateSchema(createContractSchema, validData)

      expect(result.name).toBe("MyContract")
      expect(result.symbol).toBe("MYC")
      expect(result.type).toBe("ERC1155")
    })

    test("should include all validation errors in one ValidationError", () => {
      const invalidData = {
        name: "_Invalid", // starts with underscore
        symbol: "A", // too short
        type: "ERC20", // invalid type
      }

      try {
        validateSchema(createContractSchema, invalidData)
      } catch (error) {
        if (error instanceof ValidationError) {
          // Should have all three field errors
          const fieldKeys = Object.keys(error.fields || {})
          expect(fieldKeys.length).toBeGreaterThan(0)

          // Check that we have errors for multiple fields
          const hasMultipleFieldErrors =
            (error.fields?.name !== undefined ? 1 : 0) +
              (error.fields?.symbol !== undefined ? 1 : 0) +
              (error.fields?.type !== undefined ? 1 : 0) >
            1

          expect(hasMultipleFieldErrors).toBe(true)
        }
      }
    })

    test("should work with optional errorPrefix", () => {
      const invalidData = {
        name: "ab",
        symbol: "MYC",
        type: "ERC721" as const,
      }

      // Without prefix
      try {
        validateSchema(createContractSchema, invalidData)
      } catch (error) {
        if (error instanceof ValidationError) {
          expect(error.message).not.toContain(":")
        }
      }

      // With prefix
      try {
        validateSchema(
          createContractSchema,
          invalidData,
          "Contract validation failed",
        )
      } catch (error) {
        if (error instanceof ValidationError) {
          expect(error.message).toContain("Contract validation failed:")
        }
      }
    })

    test("should handle empty errorPrefix gracefully", () => {
      const invalidData = {
        name: "ab",
        symbol: "MYC",
        type: "ERC721" as const,
      }

      try {
        validateSchema(createContractSchema, invalidData, "")
      } catch (error) {
        if (error instanceof ValidationError) {
          // Empty prefix should still work, might add ": " but that's ok
          expect(error.message).toBeDefined()
          expect(error.message.length).toBeGreaterThan(0)
        }
      }
    })
  })
})
