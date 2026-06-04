# Security Best Practices & Migration Guide

## Overview

This document outlines the security enhancements implemented in Looper HQ, including TypeScript strict mode, ESLint security rules, API security middleware, and Git pre-commit hooks.

## 1. TypeScript Strict Mode

### What Changed
- **Target**: Updated to ES2022 for modern JavaScript features
- **Strict Mode**: Enabled with the following strict options:
  - `strict: true` - Enables all strict type checking options
  - `forceConsistentCasingInFileNames: true`
  - `skipLibCheck: true` - Skips type checking of declaration files

### Benefits
- Type safety across all packages
- Early detection of null/undefined errors
- Better IDE support and autocomplete
- Improved code quality and maintainability

### Migration Steps

1. **Update tsconfig.json**
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "strict": true,
       "forceConsistentCasingInFileNames": true
     }
   }
   ```

2. **Fix type errors**
   - Run `tsc --noEmit` to identify type errors
   - Add explicit type annotations where needed
   - Use `unknown` instead of `any` when necessary
   - Add null checks for potentially null values

## 2. ESLint Configuration

### Rules Enabled
- `@typescript-eslint/explicit-function-return-types` - All functions must have explicit return types
- `@typescript-eslint/no-explicit-any` - Disallow `any` type
- `@typescript-eslint/no-unused-vars` - Flag unused variables (with `_` prefix exception)
- `@typescript-eslint/strict-boolean-expressions` - Strict boolean type checking
- `security/detect-unsafe-regex` - Flag potentially unsafe regex patterns

### Running ESLint

```bash
# Check for linting errors
pnpm lint

# Fix auto-fixable errors
pnpm exec eslint --fix .

# Check specific file
pnpm exec eslint apps/web/lib/my-file.ts
```

## 3. Prettier Code Formatting

### Configuration
- **Print Width**: 100 characters
- **Tabs**: Spaces (2 width)
- **Quotes**: Single quotes
- **Trailing Commas**: ES5 compatible
- **Line Ending**: LF (Unix)

### Running Prettier

```bash
# Check formatting
pnpm exec prettier --check .

# Format files
pnpm exec prettier --write .

# Format specific directory
pnpm exec prettier --write apps/web/
```

## 4. API Security Enhancements

### Security Headers Middleware
Automatically adds security headers to all responses:
- **Content-Security-Policy (CSP)** - Restricts script and resource loading
- **Strict-Transport-Security (HSTS)** - Forces HTTPS
- **X-Content-Type-Options** - Prevents MIME type sniffing
- **X-Frame-Options** - Prevents clickjacking
- **Referrer-Policy** - Controls referrer information
- **Permissions-Policy** - Restricts browser features

### Rate Limiting
Implemented in-memory rate limiting middleware:
```typescript
import { rateLimit } from '@/lib/security/rate-limit';

export const GET = rateLimit(100, 60000)(handler);
```

### Authentication & Authorization
Authentication utilities:
```typescript
import { requireAuth, requireRole } from '@/lib/security/auth';

// Require authentication
const user = await requireAuth(request);

// Require specific role
const admin = await requireRole(request, ['admin', 'moderator']);
```

### Input Validation
Validation schema system:
```typescript
import { validateInput, ValidationPatterns } from '@/lib/security/validation';

const schema = {
  email: {
    required: true,
    pattern: ValidationPatterns.email,
  },
  age: {
    required: true,
    type: 'number',
    min: 0,
    max: 150,
  },
};

const errors = validateInput(body, schema);
if (errors.length > 0) {
  // Handle validation errors
}
```

### Standardized Error Responses
All API errors return consistent format:
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { ... }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Error classes available:
- `ValidationError` (400)
- `AuthenticationError` (401)
- `AuthorizationError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `RateLimitError` (429)
- `InternalServerError` (500)

## 5. Git Pre-commit Hooks (Husky)

### Installation
```bash
pnpm exec husky install
```

### Hooks Configured

#### pre-commit
Runs `lint-staged`:
- Lints staged TypeScript/JavaScript files
- Formats staged files with Prettier
- Checks formatting of JSON and Markdown files

#### post-merge
Runs TypeScript type checking:
- Ensures code compiles after merging
- Catches type errors early

### Committing Code
```bash
# Stage changes
git add .

# Commit (pre-commit hook runs automatically)
git commit -m "feat: add new feature"

# Pre-commit hooks will:
# 1. Run ESLint on staged files
# 2. Run Prettier on staged files
# 3. Prevent commit if lint/format fails
```

## 6. GitHub Actions CI/CD

### Workflows

#### Quality Checks (`quality-checks.yml`)
Runs on push to main/develop and all PRs:
- **ESLint**: Code quality checks
- **TypeScript**: Type checking
- **Prettier**: Format verification
- **Security**: ESLint security plugin checks
- **Build**: Ensures project builds successfully

## Implementation Checklist

- [x] TypeScript strict mode enabled
- [x] ESLint configured with @typescript-eslint rules
- [x] Prettier configured for code formatting
- [x] Security headers middleware implemented
- [x] Rate limiting middleware added
- [x] Authentication utilities created
- [x] Input validation system implemented
- [x] Standardized API response format
- [x] Custom error classes defined
- [x] Husky git hooks configured
- [x] lint-staged configured
- [x] GitHub Actions workflows created

## Troubleshooting

### ESLint Errors

**Issue**: "ESLint: React version not detected"
```bash
# Solution: Install React ESLint plugin
pnpm add -D eslint-plugin-react
```

**Issue**: "Cannot find module" errors
```bash
# Solution: Rebuild node_modules
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Pre-commit Hook Issues

**Issue**: "Husky not found"
```bash
# Solution: Reinstall Husky
pnpm exec husky install
```

**Issue**: "Permission denied" on hook files
```bash
# Solution: Make files executable (Unix)
chmod +x .husky/pre-commit
chmod +x .husky/post-merge
```

### TypeScript Compilation Errors

**Issue**: Strict mode type errors
- Add explicit type annotations
- Use `as unknown as Type` carefully (with caution)
- Consider enabling specific strict options individually

## Security Best Practices

1. **Always validate user input** - Use the validation system
2. **Never log sensitive data** - Exclude passwords, tokens, PII
3. **Use HTTPS everywhere** - HSTS header enforces this
4. **Implement rate limiting** - Protect against brute force attacks
5. **Set secure headers** - CSP prevents injection attacks
6. **Use environment variables** - Never hardcode secrets
7. **Keep dependencies updated** - Run `pnpm audit` regularly
8. **Review security headers** - Test with security.headers.com

## References

- [TypeScript Handbook - Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [ESLint TypeScript Plugin](https://typescript-eslint.io/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [OWASP Security Best Practices](https://owasp.org/)

## Support

For questions or issues related to security implementation:
1. Check the troubleshooting section
2. Review relevant documentation
3. Create an issue with detailed description
