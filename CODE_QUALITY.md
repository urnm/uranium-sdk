# Code Quality Guide

This document covers code quality standards for the Uranium SDK project.

## Tools

We use **Biome** for linting and formatting (replaces ESLint + Prettier).

Configuration: `biome.json` in repository root.

## Running Quality Checks

### Check Code

```bash
# Check all files (no modifications)
bun run lint

# Auto-fix issues
bun run lint:fix

# Format only
bun run format
```

### Check Specific Package

```bash
cd packages/core
bun run lint
```

## Pre-Commit Checklist

Before committing:

```bash
# Run all checks
bun run lint && bun test && bun run build
```

Ensure:
- [ ] Linting passes
- [ ] Tests pass (926 tests)
- [ ] Build succeeds
- [ ] No `console.log` in production code

## Code Style

### Naming Conventions

```typescript
// Classes, interfaces, types, enums - PascalCase
class UraniumSDK {}
interface UserEntity {}
type ApiResponse = {}

// Functions, variables - camelCase
const getUserInfo = () => {}
const apiKey = "key"

// Constants - UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 100 * 1024 * 1024
const DEFAULT_TIMEOUT = 20000
```

### Key Rules

- **Indent**: 2 spaces
- **Quotes**: Double quotes (`"`)
- **Semicolons**: As needed (not everywhere)
- **TypeScript**: Strict mode enabled
- **Imports**: Auto-organized by Biome

## TypeScript Standards

```typescript
// ✅ Explicit return types for public APIs
export const getUser = async (id: string): Promise<UserEntity> => {
  return await api.get(`/users/${id}`)
}

// ✅ Avoid 'any'
const data: unknown = await api.get("/data")
if (isValidData(data)) {
  // properly typed now
}

// ✅ Use type guards
export function isUraniumError(error: unknown): error is UraniumError {
  return error instanceof UraniumError
}
```

## Testing

```bash
# Run tests
bun test

# With coverage
bun test --coverage

# Watch mode
bun test --watch
```

**Requirements:**
- Maintain 90%+ coverage
- Co-locate tests with source files (`*.test.ts`)
- Use descriptive test names

## Common Issues

### Unused Variables
```typescript
// Prefix with underscore if intentionally unused
const _unused = 123
```

### Missing Return Type
```typescript
// ❌ Bad
export const getUser = async (id) => { ... }

// ✅ Good
export const getUser = async (id: string): Promise<User> => { ... }
```

## IDE Setup

### VS Code

Install: [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)

`.vscode/settings.json`:
```json
{
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  }
}
```

## Resources

- [Biome Documentation](https://biomejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Bun Test Docs](https://bun.sh/docs/cli/test)

---

For detailed configuration, see `biome.json` in repository root.
