# Session E: Unit Testing Implementation Plan

## 🎯 Objective
코어 로직부터 단위 테스트를 도입하여 안정적인 테스트 기반 구축

## 📊 Current Status
- **Test Framework**: Vitest v1.6.1 with coverage support
- **Test Files Created**: 7 comprehensive test suites
- **Test Count**: 174 total tests (159 passing, 15 failing)
- **Success Rate**: 91.4%

## 🗂️ Test Coverage Scope

### Core Domain Tests
1. **color.test.ts** (18 tests)
   - Lab/XYZ/RGB color validation
   - Color equality comparison with tolerance
   - Format and parse functions
   - Edge cases: null, undefined, invalid values

2. **ink.test.ts** (29 tests)
   - Ink entity validation
   - TAC (Total Area Coverage) limit testing
   - Ratio validation with tolerance
   - Concentration levels (40%, 70%, 100%)
   - Business rules integration

3. **recipe.test.ts** (27 tests)
   - Recipe state machine transitions
   - Quality evaluation rules (excellent, good, acceptable, poor)
   - Correction workflow scenarios
   - Business rules for state transitions

4. **settings.test.ts** (24 tests)
   - Configuration validation
   - Default settings integrity
   - Feature flags testing
   - Printer profiles and TAC limits

5. **correction.test.ts** (18 tests)
   - Correction suggestion validation
   - History tracking
   - Complete workflow scenarios
   - Confidence scoring validation

### Core Services Tests
6. **deltaE.test.ts** (24 tests)
   - Delta E76, E94, E00, CMC calculations
   - Known color pair validations
   - Performance benchmarks
   - Symmetry and consistency checks

7. **colorMixing.test.ts** (34 tests)
   - Lab/XYZ conversion round-trip tests
   - Color mixing algorithms (Lab, XYZ, Kubelka-Munk)
   - Ink concentration interpolation
   - Ink mixture calculations

## 📈 Coverage Strategy

### Target Coverage
```yaml
thresholds:
  branches: 60%     # Decision paths coverage
  functions: 70%    # Function coverage
  lines: 70%        # Line coverage
  statements: 70%   # Statement coverage
```

### Priority Areas
1. **Critical Path**: Color calculations, Delta E, mixing algorithms
2. **Business Logic**: Recipe state machines, validation rules
3. **Data Integrity**: Ink ratios, TAC limits, color validation

### Excluded from Coverage
- UI components (will be covered by E2E tests)
- Legacy HTML files
- Test files themselves
- Type definition files

## 🧪 Testing Patterns

### Test Structure
```typescript
describe('Domain/Service', () => {
  describe('Feature/Method', () => {
    it('should handle happy path', () => {});
    it('should handle edge cases', () => {});
    it('should validate business rules', () => {});
    it('should handle errors gracefully', () => {});
  });
});
```

### Edge Cases Covered
- Boundary values (0, max, negative)
- Null/undefined inputs
- Empty arrays/objects
- Invalid data formats
- NaN and Infinity values
- Floating point precision issues

### Performance Testing
- Color conversion operations < 1ms
- Mixing operations for 10 colors < 0.5ms
- 300 mixing operations < 50ms total

## 🚦 Quality Gates

### Test Execution
- All tests must pass before merge
- Coverage thresholds must be met
- No console errors in tests
- Performance benchmarks must pass

### CI Integration
```yaml
test:
  - npm run typecheck
  - npm run lint
  - npm run test:coverage
  - Generate LCOV report for badges
```

## 📋 Test Maintenance

### Best Practices
1. **Isolation**: Each test independent and repeatable
2. **Clarity**: Clear test names describing behavior
3. **Completeness**: Cover success and failure paths
4. **Performance**: Fast execution (< 2s total)
5. **Maintainability**: Use helper functions for common setups

### Documentation
- Each test file includes purpose comments
- Complex calculations documented with references
- Known values explained with sources

## 🔄 Next Steps

### Immediate
1. Fix remaining 15 failing tests (mostly precision/tolerance issues)
2. Generate full coverage report
3. Add coverage badges to README

### Future Enhancements
1. Add integration tests for service interactions
2. Add E2E tests for critical user workflows
3. Add visual regression tests for UI components
4. Add performance regression tests

## 📊 Metrics

### Current Test Results
```
Test Files:  7 total (2 passed, 5 with failures)
Tests:       174 total (159 passed, 15 failed)
Duration:    ~2 seconds
Success Rate: 91.4%
```

### Known Issues
1. Delta E calculations need tolerance adjustments
2. Color format tests expect different precision
3. XYZ mixing tests have minor floating-point differences
4. Some edge case validations too strict

## 🎯 Success Criteria

✅ Test framework configured and running
✅ Core domain logic covered
✅ Core services tested
✅ Business rules validated
✅ Performance benchmarks included
⏳ Coverage thresholds met (pending minor fixes)
⏳ CI integration ready (LCOV configured)

## 📝 Rationale

### Why Vitest?
- Modern, fast test runner
- Native TypeScript support
- Compatible with Vite build system
- Excellent IDE integration
- Built-in coverage support

### Why Start with Core Logic?
- Highest value for stability
- Critical business logic
- Foundation for other layers
- Easy to test in isolation

### Why 60-70% Initial Coverage?
- Realistic starting point
- Focus on critical paths first
- Room for incremental improvement
- Balance between coverage and velocity