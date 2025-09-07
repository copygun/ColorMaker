# Session F: Error Handling and Safety Guidelines

## 📋 Overview

Session F implements comprehensive error handling, input validation, and user experience safety features for the WonLabel Color Maker application. This document outlines the policies, message guidelines, and implementation examples.

## 🎯 Core Principles

### 1. User-Developer Message Separation
- **User Messages**: Clear, actionable, non-technical Korean messages
- **Developer Messages**: Technical details with error codes and stack traces
- **Context Preservation**: Full error context for debugging

### 2. Graceful Degradation
- **Fallback Values**: Safe defaults when operations fail
- **Recovery Strategies**: Automatic retry for transient failures
- **Offline Support**: Cached data and offline-first design

### 3. Accessibility First
- **WCAG Compliance**: AA level minimum, AAA preferred
- **Screen Reader Support**: ARIA labels and live regions
- **Keyboard Navigation**: Full keyboard accessibility

## 🛡️ Error Handling Architecture

### Error Types Hierarchy

```typescript
AppError (Base)
├── ValidationError    // Input validation failures
├── CalculationError   // Color calculation errors
├── NetworkError       // API and network issues
├── PermissionError    // Access control violations
├── SystemError        // Browser/system issues
└── BusinessError      // Business logic violations
```

### Error Severity Levels

| Level | Description | User Impact | Action Required |
|-------|-------------|-------------|-----------------|
| LOW | Informational | None | Log only |
| MEDIUM | User awareness needed | Minor | Show notification |
| HIGH | User action required | Major | Show error dialog |
| CRITICAL | System cannot continue | Blocking | Error boundary + reload |

## 📝 Error Message Guidelines

### Message Structure

#### User Messages (Korean)
```typescript
{
  INVALID_COLOR: '입력하신 색상 값이 올바르지 않습니다.',
  TAC_EXCEEDED: 'TAC 한계를 초과했습니다. 잉크 양을 줄여주세요.',
  NETWORK_OFFLINE: '인터넷 연결을 확인해주세요.',
  REQUIRED_FIELD: '필수 입력 항목입니다.'
}
```

#### Developer Messages (English)
```typescript
{
  INVALID_COLOR: 'Invalid color value: {value}',
  TAC_EXCEEDED: 'TAC limit exceeded: {tac} > {limit}',
  NETWORK_OFFLINE: 'Network offline detected',
  REQUIRED_FIELD: 'Required field missing: {field}'
}
```

### Message Tone Guidelines

1. **User Messages**
   - Polite and respectful Korean
   - Avoid technical jargon
   - Provide clear next steps
   - Use positive framing when possible

2. **Developer Messages**
   - Technical and precise
   - Include relevant data
   - Follow consistent format
   - Include error codes

## 🔧 Implementation Components

### 1. Error Factory (`errorFactory.ts`)
Central error creation with message templates and context interpolation.

```typescript
// Example usage
const error = ErrorFactory.validation('INVALID_COLOR', {
  value: userInput,
  field: 'labColor'
});
```

### 2. Error Handler (`errorHandler.ts`)
Global error handling with recovery strategies and telemetry.

```typescript
// Example usage
errorHandler.handle(error);
// or
await errorHandler.handleAsync(async () => {
  // risky operation
}, fallbackValue);
```

### 3. Input Validator (`inputValidator.ts`)
Comprehensive input validation with sanitization.

```typescript
// Example usage
const result = InputValidator.validateLabColor(userInput);
if (!result.valid) {
  // Handle validation errors
  result.errors.forEach(error => errorHandler.handle(error));
}
```

### 4. UI Guards

#### Error Boundary (`ErrorBoundary.tsx`)
React error boundary for component-level error isolation.

```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <YourComponent />
</ErrorBoundary>
```

#### Network Guard (`NetworkGuard.tsx`)
Network status monitoring with offline fallback.

```typescript
<NetworkGuard>
  <OnlineOnlyComponent />
</NetworkGuard>
```

#### Accessibility Guard (`AccessibilityGuard.tsx`)
WCAG compliance checking and accessibility alerts.

```typescript
<AccessibilityGuard wcagLevel="AA">
  <ColorPicker />
</AccessibilityGuard>
```

### 5. Toast Notifications (`Toast.tsx`)
User-friendly notifications with accessibility support.

```typescript
const { showError, showSuccess } = useToast();
showError(error);
showSuccess('작업이 완료되었습니다.');
```

### 6. Logger (`logger.ts`)
Lightweight logging with telemetry hooks.

```typescript
logger.info('User action', { action: 'colorSelected' });
logger.error('Calculation failed', error);
logger.track('feature_used', 'color_mixing');
```

## 🚨 Common Error Scenarios

### 1. Invalid Color Input
**Trigger**: User enters invalid Lab values
**Handling**:
- Sanitize input automatically
- Show inline validation error
- Prevent form submission
- Suggest valid range

### 2. TAC Limit Exceeded
**Trigger**: Total ink coverage > 300%
**Handling**:
- Show warning toast
- Highlight problematic inks
- Suggest reduction options
- Block recipe creation

### 3. Network Offline
**Trigger**: Internet connection lost
**Handling**:
- Show offline banner
- Enable offline mode
- Queue operations for sync
- Auto-retry when online

### 4. Low Color Contrast
**Trigger**: WCAG contrast check fails
**Handling**:
- Show accessibility warning
- Suggest alternative colors
- Provide contrast ratio
- Offer color adjustment tools

## 📊 Telemetry Events

### Error Tracking
```typescript
{
  event: 'error_occurred',
  properties: {
    error_code: 'INVALID_COLOR',
    error_category: 'validation',
    error_severity: 'medium',
    component: 'ColorPicker'
  }
}
```

### Performance Metrics
```typescript
{
  event: 'performance_measure',
  metrics: {
    color_calculation_ms: 15,
    delta_e_computation_ms: 8,
    ui_render_ms: 32
  }
}
```

### User Actions
```typescript
{
  event: 'user_action',
  properties: {
    action: 'color_mixed',
    ink_count: 3,
    success: true
  }
}
```

## 🔄 Recovery Strategies

### 1. Retry Strategy
For transient network errors:
- Exponential backoff (1s, 2s, 4s, 8s)
- Maximum 3 retries
- User notification on final failure

### 2. Fallback Strategy
For non-critical failures:
- Use cached values
- Provide default values
- Graceful feature degradation

### 3. Fail Strategy
For critical errors:
- Show error boundary
- Log to telemetry
- Offer page reload
- Contact support option

## ✅ Testing Checklist

### Unit Tests
- [ ] Error factory creates correct error types
- [ ] Input validators handle edge cases
- [ ] Sanitizers clean malicious input
- [ ] Logger respects configuration

### Integration Tests
- [ ] Error boundary catches React errors
- [ ] Toast notifications display correctly
- [ ] Network guard detects offline state
- [ ] Accessibility checks work properly

### E2E Tests
- [ ] User sees appropriate error messages
- [ ] Recovery strategies execute correctly
- [ ] Telemetry events are sent
- [ ] Accessibility compliance maintained

## 📚 Best Practices

### Do's
✅ Always separate user and developer messages
✅ Provide actionable error messages
✅ Log all errors for debugging
✅ Test error paths thoroughly
✅ Consider accessibility in error UI
✅ Use appropriate severity levels
✅ Implement graceful degradation

### Don'ts
❌ Don't expose technical details to users
❌ Don't ignore accessibility requirements
❌ Don't skip error recovery
❌ Don't use generic error messages
❌ Don't log sensitive information
❌ Don't block UI unnecessarily

## 🔗 Related Documentation

- [Session E Test Plan](./E-test-plan.md) - Testing strategies
- [Core Domain Models](./src/core/domain/) - Business logic
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility standards

## 📈 Metrics and Monitoring

### Key Metrics
- Error rate by category
- Recovery success rate
- Mean time to recovery
- User error encounter rate
- Accessibility compliance score

### Monitoring Dashboard
Track these metrics in your telemetry dashboard:
1. Error frequency trends
2. Top error types
3. Recovery effectiveness
4. User impact analysis
5. Performance degradation

## 🚀 Migration Guide

### For Existing Code
1. Replace `console.error` with `logger.error`
2. Wrap async operations with `errorHandler.handleAsync`
3. Add `ErrorBoundary` to component trees
4. Implement input validation before processing
5. Add toast notifications for user feedback

### For New Features
1. Start with error scenarios planning
2. Define error messages upfront
3. Implement validation first
4. Add telemetry from the beginning
5. Test error paths equally as happy paths

---

*Session F completed successfully with comprehensive error handling and safety features implemented.*