# Publishing Uranium SDK

Practical guide for releasing new versions to npm.

---

## Quick Start

Typical release (patch/minor version):

```bash
# 1. Verify everything works
bun run clean && bun run build && bun test

# 2. Update versions (e.g., 0.1.0 → 0.1.1)
# Edit version manually in three package.json files:
# - packages/types/package.json
# - packages/core/package.json
# - packages/react/package.json

# 3. Update CHANGELOG.md
# Add section with new version and list of changes

# 4. Dry run (optional but recommended)
cd packages/types && bun publish --dry-run && cd ../..
cd packages/core && bun publish --dry-run && cd ../..
cd packages/react && bun publish --dry-run && cd ../..

# 5. Publish (in correct order!)
cd packages/types && bun publish --access public && cd ../..
cd packages/core && bun publish --access public && cd ../..
cd packages/react && bun publish --access public && cd ../..

# 6. Git tag
git add .
git commit -m "chore: release v0.1.1"
git tag v0.1.1
git push origin main --tags

# 7. Create GitHub Release
# https://github.com/urnm/uranium-sdk/releases/new
```

**Important**: Publishing order matters! types → sdk → react.

> `bun publish` automatically converts `workspace:*` to actual versions. No manual conversion needed!

---

## Versioning

Choose the right version bump:

- **Patch** (0.1.0 → 0.1.1): Bug fixes, backwards compatible
- **Minor** (0.1.0 → 0.2.0): New features, backwards compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes

Update version in **all three** package.json files simultaneously (keep versions synchronized).

---

## Pre-Release Checklist

Before publishing, verify:

- [ ] All tests pass: `bun test`
- [ ] Lint is clean: `bun run lint`
- [ ] Build succeeds: `bun run build`
- [ ] Versions updated in all three package.json files
- [ ] CHANGELOG.md updated with new version
- [ ] Logged into npm: `npm whoami` (should show your username)
- [ ] Git working directory is clean

---

## Scenarios

### Regular release (patch/minor)

See Quick Start above.

### Pre-release (alpha/beta)

For test versions, use tags:

```bash
# Version: 0.2.0-alpha.1
cd packages/types && bun publish --access public --tag alpha && cd ../..
cd packages/core && bun publish --access public --tag alpha && cd ../..
cd packages/react && bun publish --access public --tag alpha && cd ../..

# Users will install with:
# bun add @uranium/sdk@alpha
```

### Major version (breaking changes)

1. Update version to x.0.0 (e.g., 1.0.0)
2. In CHANGELOG.md, clearly mark **BREAKING CHANGES**
3. Publish as usual
4. Create detailed GitHub Release describing breaking changes

---

## Common Issues

### "You do not have permission to publish"

```bash
npm login  # Login to npm
npm whoami # Verify logged in
```

### "This operation requires a one-time password"

If 2FA is enabled (and it should be!):

```bash
# Option 1: Enter OTP when prompted (recommended)
bun publish --access public

# Option 2: Provide OTP directly
bun publish --access public --otp 123456
```

### "version 0.1.0 is already published"

You already published this version. Bump the version and try again.

### "prepublishOnly script failed"

```bash
# Run manually to see the error
bun run prepublishOnly

# This runs: lint → build → test
# Fix whatever failed
```

### Published with a bug, what now?

**DON'T** unpublish! Instead:

```bash
# 1. Fix the bug
# 2. Bump patch version (0.1.0 → 0.1.1)
# 3. Publish fixed version
# 4. Deprecate old version
npm deprecate @uranium/sdk@0.1.0 "Bug in upload. Use 0.1.1+"
```

---

## After Publishing

1. Check packages on npm:
   - https://www.npmjs.com/package/@uranium/types
   - https://www.npmjs.com/package/@uranium/sdk
   - https://www.npmjs.com/package/@uranium/react

2. Create GitHub Release: https://github.com/urnm/uranium-sdk/releases/new
   - Tag: v0.1.1
   - Title: v0.1.1
   - Description: copy section from CHANGELOG.md

3. Verify installation works:
   ```bash
   mkdir /tmp/test-uranium && cd /tmp/test-uranium
   bun init -y
   bun add @uranium/sdk @uranium/react
   ```

---

## Useful Commands

```bash
# Check current version on npm
npm view @uranium/sdk version

# List all published versions
npm view @uranium/sdk versions

# Check dist-tags
npm view @uranium/sdk dist-tags

# Preview what will be published (dry run)
bun publish --dry-run

# Deprecate a version
npm deprecate @uranium/sdk@0.1.0 "Reason here"
```

---

## Notes

- `bun publish` automatically runs `prepublishOnly` (lint + build + test)
- `bun publish` automatically converts `workspace:*` → actual versions
- If 2FA is enabled (and it should be), you'll need OTP
- npm registry may take a few minutes to update after publishing

---

**Last Updated**: 2025-10-28
