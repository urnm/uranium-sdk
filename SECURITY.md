# Security Policy

## Supported Versions

We actively support the following versions of Uranium SDK with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

The Uranium takes security vulnerabilities seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by emailing:

**security@uranium.pro**

Include the following information in your report:

- Type of vulnerability (e.g., authentication bypass, XSS, injection, etc.)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Investigation**: Our team will investigate and validate the vulnerability
- **Updates**: We will keep you informed about the progress of addressing the vulnerability
- **Resolution**: We aim to fix critical vulnerabilities within 7 days and other vulnerabilities within 30 days
- **Disclosure**: We will coordinate with you on the timing and details of public disclosure

### Disclosure Policy

- We request that you give us reasonable time to address the vulnerability before making it public
- We will credit you for the discovery in our security advisory (unless you wish to remain anonymous)
- We will notify you when the vulnerability has been fixed

## Security Best Practices for SDK Users

### API Key Security

1. **Never commit API keys** to version control
   ```bash
   # Use environment variables
   URANIUM_API_KEY=your-api-key-here
   ```

2. **Use environment variables** for API keys
   ```typescript
   const sdk = new UraniumSDK({
     apiKey: process.env.URANIUM_API_KEY
   })
   ```

3. **Rotate API keys regularly** through the portal at https://portal.uranium.pro

4. **Use different API keys** for development, staging, and production

### File Upload Security

1. **Validate file types** before upload
   ```typescript
   const allowedTypes = ['image/png', 'image/jpeg', 'image/gif']
   if (!allowedTypes.includes(file.type)) {
     throw new Error('Invalid file type')
   }
   ```

2. **Enforce file size limits** (SDK default is 100 MB)
   ```typescript
   const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
   if (file.size > MAX_FILE_SIZE) {
     throw new Error('File too large')
   }
   ```

3. **Sanitize file names** to prevent directory traversal attacks

4. **Validate metadata** before submission
   ```typescript
   import { validateMetadata } from "@uranium/sdk"

   const result = validateMetadata(metadata)
   if (!result.success) {
     console.error(result.error)
   }
   ```

### Error Handling

1. **Don't expose sensitive data** in error messages to end users
   ```typescript
   try {
     await sdk.contracts.create(params)
   } catch (error) {
     if (isUraniumError(error)) {
       // Log full error for debugging
       console.error('Full error:', error)

       // Show user-friendly message
       showUserMessage('Failed to create collection. Please try again.')
     }
   }
   ```

2. **Log errors securely** - don't log API keys or sensitive user data

### Network Security

1. **Use HTTPS only** - The SDK enforces HTTPS by default

2. **Validate SSL certificates** - Don't disable SSL verification in production

3. **Set appropriate timeouts** to prevent hanging requests
   ```typescript
   const sdk = new UraniumSDK({
     apiKey: process.env.URANIUM_API_KEY,
     timeout: 20000 // 20 seconds
   })
   ```

### Content Security Policy (CSP)

If using the SDK in a browser application, configure CSP headers to allow connections to:

```
connect-src https://gw.urnm.pro https://*.amazonaws.com
```

### Dependency Security

1. **Keep dependencies updated** - Run `bun update` regularly

2. **Audit dependencies** - Run `bun audit` or `npm audit` periodically

3. **Use lockfiles** - Commit `bun.lockb` or `package-lock.json` to ensure consistent dependencies

## Known Security Considerations

### API Key Storage

- The SDK does not store API keys persistently
- It's the application's responsibility to securely store and manage API keys
- Consider using secure key management services for production applications

### Device ID

- The SDK generates and stores a device ID for analytics
- Device IDs are stored in browser localStorage or memory
- Device IDs do not contain sensitive information

### File Uploads

- Files are uploaded directly to S3 using presigned URLs
- The gateway does not handle file content directly (reducing attack surface)
- Presigned URLs are time-limited and single-use

## Security Updates

Security updates will be published as:
1. GitHub Security Advisories
2. New package versions on npm
3. Announcements in the CHANGELOG.md

Subscribe to repository releases or watch the repository to receive notifications about security updates.

## Scope

This security policy applies to:
- @uranium/sdk
- @uranium/react
- @uranium/types

It does not cover:
- Third-party dependencies (report to their respective maintainers)
- The Uranium backend services (report separately to security@uranium.pro)
- Applications built using the SDK (your application's security is your responsibility)

## Recognition

We appreciate the security research community. Security researchers who responsibly disclose vulnerabilities will be acknowledged in our security advisories (unless they prefer to remain anonymous).

## Questions?

If you have questions about this security policy, contact us at security@uranium.pro

---

**Last Updated**: 2025-10-28
