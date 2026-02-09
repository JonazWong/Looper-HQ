# Testing Infrastructure - Looper HQ Web App

This document describes the testing setup for the Looper HQ web application.

## Overview

The testing infrastructure uses:
- **Vitest** - Fast, TypeScript-native test runner
- **@testing-library/react** - React component testing utilities  
- **happy-dom** - Lightweight DOM implementation for Node.js

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test:ui

# Run tests with coverage
npm test:coverage
```

## Test Structure

```
__tests__/
├── __mocks__/          # Mock implementations
│   ├── auth.ts         # Auth mocks (sessions, users)
│   ├── prisma.ts       # Prisma client mocks
│   └── test-helpers.ts # Test utilities and factories
├── api/               # API route tests
│   ├── cases.test.ts
│   ├── invoices.test.ts
│   └── time-logs.test.ts
├── components/        # Component tests
│   ├── button.test.tsx
│   ├── card.test.tsx
│   └── badge.test.tsx
└── lib/              # Utility function tests
    └── utils.test.ts
```

## Test Coverage

### Utility Functions (`lib/utils.test.ts`)
✅ Currency formatting (HKD, USD)
✅ File size formatting (Bytes, KB, MB, GB)
✅ Hong Kong phone number formatting
✅ Date formatting (HK timezone, short format)
✅ Email validation
✅ HKID validation (format)
✅ Case number validation
✅ CSS class name merging

### API Routes

#### Cases API (`api/cases.test.ts`)
✅ Create new case with validation
✅ Generate sequential case numbers
✅ Validate required fields
✅ Validate enum values

#### Invoices API (`api/invoices.test.ts`)
✅ Create new invoice
✅ Generate sequential invoice numbers
✅ Validate amount (positive numbers)
✅ Require caseId and dueDate

#### Time Logs API (`api/time-logs.test.ts`)
✅ Create time log entry
✅ Create billable/non-billable logs
✅ Validate hours (positive numbers)
✅ Require description field

### UI Components

#### Button Component (`components/button.test.tsx`)
✅ Render all variants (default, destructive, outline, secondary, ghost, link)
✅ Render all sizes (sm, default, lg, icon)
✅ Handle disabled state
✅ Handle click events
✅ Support custom className
✅ Support type attribute

#### Card Component (`components/card.test.tsx`)
✅ Render card with header, content, footer
✅ Render card title and description
✅ Apply correct styles and classes
✅ Forward HTML attributes

#### Badge Component (`components/badge.test.tsx`)
✅ Render all variants (default, secondary, destructive, outline)
✅ Apply correct styles
✅ Support custom className
✅ Handle click events

## Mocking

### Prisma Client

```typescript
import { mockPrismaClient, resetMockPrisma } from '@/__tests__/__mocks__/prisma'

// In your test
vi.mock('@/lib/db', () => ({
  prisma: mockPrismaClient,
}))

beforeEach(() => {
  resetMockPrisma()
})

// Mock database operations
mockPrismaClient.case.findMany.mockResolvedValue([...])
mockPrismaClient.case.create.mockResolvedValue({...})
```

### Authentication

```typescript
import { mockSession, mockRequireAuth } from '@/__tests__/__mocks__/auth'

// Mock the auth module
vi.mock('@/lib/api/auth', () => ({
  requireAuth: mockRequireAuth,
}))

// The mock will return mockSession by default
```

### Test Helpers

```typescript
import {
  createMockRequest,
  parseResponse,
  createMockCase,
  createMockInvoice,
  createMockTimeLog,
} from '@/__tests__/__mocks__/test-helpers'

// Create a mock API request
const request = createMockRequest('POST', 'http://localhost:3000/api/cases', {
  body: { title: 'Test Case', ... },
  searchParams: { page: '1' },
})

// Parse response
const data = await parseResponse(response)

// Create mock data
const mockCase = createMockCase({ title: 'Custom Title' })
```

## Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
   ```typescript
   it('should create a case', async () => {
     // Arrange
     const mockData = createMockCase()
     mockPrismaClient.case.create.mockResolvedValue(mockData)
     
     // Act
     const response = await POST(request)
     
     // Assert
     expect(response.status).toBe(200)
   })
   ```

2. **Reset Mocks**: Always reset mocks between tests
   ```typescript
   beforeEach(() => {
     resetMockPrisma()
     vi.clearAllMocks()
   })
   ```

3. **Test Isolation**: Each test should be independent
   - Don't rely on test execution order
   - Clean up after each test
   - Use fresh mock data

4. **Meaningful Assertions**: Test behavior, not implementation
   ```typescript
   // Good
   expect(response.status).toBe(200)
   expect(data.data.caseNumber).toMatch(/^HK-\d{4}-\d{3}$/)
   
   // Avoid
   expect(mockPrismaClient.case.create).toHaveBeenCalledTimes(1)
   ```

5. **Mock External Dependencies**: Always mock:
   - Database (Prisma)
   - Authentication (NextAuth)
   - External APIs
   - File system

## Configuration

### `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

### `vitest.setup.ts`
- Configures @testing-library/react cleanup
- Mocks Next.js router
- Mocks NextAuth session

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Check path aliases in `vitest.config.ts`
   - Ensure all dependencies are installed

2. **Mock not working**
   - Place `vi.mock()` before imports
   - Use `vi.hoisted()` for factories if needed

3. **Tests timing out**
   - Check for unresolved promises
   - Ensure mocks are returning values

4. **DOM-related errors**
   - Verify `environment: 'happy-dom'` in config
   - Use `screen` queries from @testing-library/react

## Future Enhancements

- [ ] Add E2E tests with Playwright
- [ ] Increase code coverage to >80%
- [ ] Add visual regression tests
- [ ] Add performance benchmarks
- [ ] Add integration tests with real database
- [ ] Add API contract tests
