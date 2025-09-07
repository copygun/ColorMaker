# Session E: How to Run Tests

## 🚀 Quick Start

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests with UI (Interactive)
```bash
npm run test:ui
```

## 📊 Test Commands

### Basic Test Execution
```bash
# Run all tests in watch mode
npm test

# Run tests once and exit
npx vitest run

# Run specific test file
npx vitest color.test.ts

# Run tests matching pattern
npx vitest --grep "Delta E"
```

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# Generate HTML coverage report
npx vitest run --coverage --reporter=html

# View coverage in browser
open coverage/index.html  # Mac/Linux
start coverage/index.html # Windows
```

### Debug Mode
```bash
# Run tests with detailed output
npx vitest run --reporter=verbose

# Run single test file in debug mode
npx vitest run src/core/domain/__tests__/color.test.ts --reporter=verbose
```

## 🎯 Specific Test Scenarios

### Run Domain Tests Only
```bash
npx vitest run src/core/domain/__tests__
```

### Run Service Tests Only
```bash
npx vitest run src/core/services/__tests__
```

### Run Failing Tests Only
```bash
npx vitest run --reporter=verbose --bail 1
```

### Run Tests by Name Pattern
```bash
# Run all validation tests
npx vitest run -t "validation"

# Run all Delta E tests
npx vitest run -t "Delta E"

# Run specific describe block
npx vitest run -t "Color Domain"
```

## 🔧 Configuration Options

### Environment Variables
```bash
# Run with different Node environment
NODE_ENV=test npm test

# Run with coverage thresholds check
npm run test:coverage
```

### Watch Mode Options
```bash
# Watch specific directory
npx vitest --watch src/core/domain

# Watch and run only changed tests
npx vitest --changed

# Watch with coverage
npx vitest --coverage --watch
```

## 📈 Validation Pipeline

### Full Validation (Recommended before commit)
```bash
npm run validate
```
This runs:
1. TypeScript type checking
2. ESLint linting
3. Prettier format check
4. Full test suite with coverage

### Individual Checks
```bash
# Type checking only
npm run typecheck

# Linting only
npm run lint

# Format check only
npm run format:check

# Tests only
npm test
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Issue: Tests failing with "Cannot find module"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Coverage not generating
```bash
# Install coverage provider explicitly
npm install --save-dev @vitest/coverage-v8@^1.6.1

# Run with explicit provider
npx vitest run --coverage --provider=v8
```

#### Issue: Tests running slowly
```bash
# Run in parallel (default)
npx vitest run --threads

# Limit concurrent tests
npx vitest run --maxConcurrency=2
```

#### Issue: Memory issues
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

## 📊 Current Test Status

### Summary (as of Session E completion)
```
Total Tests: 174
Passing: 159 (91.4%)
Failing: 15 (8.6%)
Duration: ~2 seconds
```

### Known Failing Tests
1. **Color Domain (5 failures)**
   - XYZ validation edge cases
   - RGB validation edge cases
   - Format precision differences

2. **Delta E Service (3 failures)**
   - E94 symmetry test
   - E00 known value test
   - Perceptual weighting test

3. **Color Mixing Service (5 failures)**
   - XYZ mixing precision
   - Kubelka-Munk extreme values
   - Ratio validation

4. **Settings Domain (1 failure)**
   - Immutability test

5. **Recipe Domain (1 failure)**
   - NaN edge case handling

### Fix Failing Tests
```bash
# Run only failing tests with details
npx vitest run --reporter=verbose --bail 1

# Update snapshots if needed
npx vitest run -u
```

## 🎨 Test UI

### Start Interactive Test UI
```bash
npm run test:ui
```
Then open: http://localhost:51204/__vitest__/

Features:
- Visual test explorer
- Real-time test results
- Coverage visualization
- Test history
- Filter and search

## 📝 Writing New Tests

### Test File Location
```
src/
  core/
    domain/
      __tests__/     # Domain tests here
        *.test.ts
    services/
      __tests__/     # Service tests here
        *.test.ts
```

### Test Template
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Component/Service Name', () => {
  beforeEach(() => {
    // Setup
  });

  describe('Feature/Method', () => {
    it('should do something', () => {
      // Arrange
      const input = /* ... */;
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

## 🚦 CI/CD Integration

### GitHub Actions (example)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run validate
      - uses: codecov/codecov-action@v2
        with:
          files: ./coverage/lcov.info
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Coverage Report](./coverage/index.html)
- [Test Plan](./E-test-plan.md)
- [File Manifest](./SESSION_E_MANIFEST.md)