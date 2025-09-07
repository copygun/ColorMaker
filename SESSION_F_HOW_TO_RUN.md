# Session F: How to Run and Test

## 🚀 Quick Start

### 1. Install Dependencies (if needed)
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. View in Browser
Open http://localhost:5173

## 🧪 Testing Error Handling

### 1. Test Input Validation

#### Valid Input Test
```typescript
import { InputValidator } from './src/core/validation/inputValidator';

// Test valid color
const validColor = { L: 50, a: 20, b: -30 };
const result = InputValidator.validateLabColor(validColor);
console.log(result.valid); // true

// Test invalid color
const invalidColor = { L: 150, a: 200, b: -300 };
const result2 = InputValidator.validateLabColor(invalidColor);
console.log(result2.errors); // Array of validation errors
```

#### Sanitization Test
```typescript
import { InputSanitizer } from './src/core/validation/inputValidator';

// Number sanitization
console.log(InputSanitizer.number('123.45', 0, 100)); // 100 (clamped)
console.log(InputSanitizer.number('abc')); // null

// String sanitization
console.log(InputSanitizer.string('<script>alert(1)</script>')); // 'alert(1)'
```

### 2. Test Error Boundaries

#### Component Error Test
```tsx
// Create a component that throws an error
const BrokenComponent = () => {
  throw new Error('Test error');
  return <div>This won't render</div>;
};

// Wrap with ErrorBoundary
import { ErrorBoundary } from './src/components/guards/ErrorBoundary';

<ErrorBoundary>
  <BrokenComponent />
</ErrorBoundary>

// Should show fallback UI instead of crashing
```

### 3. Test Toast Notifications

#### Manual Toast Test
```tsx
import { useToast } from './src/components/notifications/Toast';

function TestComponent() {
  const { showError, showSuccess, showWarning, showInfo } = useToast();
  
  return (
    <div>
      <button onClick={() => showSuccess('작업이 완료되었습니다!')}>
        Success Toast
      </button>
      <button onClick={() => showError({ userMessage: '오류가 발생했습니다!' })}>
        Error Toast
      </button>
      <button onClick={() => showWarning('경고 메시지입니다.')}>
        Warning Toast
      </button>
      <button onClick={() => showInfo('안내 메시지입니다.')}>
        Info Toast
      </button>
    </div>
  );
}
```

### 4. Test Network Monitoring

#### Offline Mode Test
```bash
# In Chrome DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Set throttling to "Offline"
4. Try to use the app
5. Should show offline fallback UI
```

#### Slow Connection Test
```bash
# In Chrome DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Set throttling to "Slow 3G"
4. Should show slow connection warning
```

### 5. Test Accessibility Features

#### Color Contrast Test
```tsx
import { ColorContrastChecker } from './src/components/guards/AccessibilityGuard';

// Test low contrast colors
<ColorContrastChecker
  foreground={{ L: 50, a: 0, b: 0 }}  // Gray
  background={{ L: 60, a: 0, b: 0 }}  // Similar gray
  showAlert={true}
/>
// Should show contrast warning

// Test high contrast colors
<ColorContrastChecker
  foreground={{ L: 0, a: 0, b: 0 }}   // Black
  background={{ L: 100, a: 0, b: 0 }} // White
  showAlert={true}
/>
// Should pass WCAG AAA
```

#### Screen Reader Test
```bash
# Enable screen reader (Windows: Narrator, Mac: VoiceOver)
1. Press Windows+Ctrl+Enter (Windows) or Cmd+F5 (Mac)
2. Navigate through the app
3. Check that all errors are announced
4. Verify toast notifications are read
```

## 📊 Logging and Telemetry

### 1. Enable Console Logging
```typescript
import { logger, LogLevel } from './src/core/logging/logger';

// Set log level
logger.setLevel(LogLevel.DEBUG);

// Test different log levels
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', new Error('Test'));
```

### 2. Performance Monitoring
```typescript
import { logger } from './src/core/logging/logger';

// Start timer
logger.startTimer('colorCalculation');

// Do some work
calculateColor();

// End timer and log duration
const duration = logger.endTimer('colorCalculation');
console.log(`Took ${duration}ms`);

// Get performance stats
const stats = logger.getPerformanceStats('colorCalculation');
console.log(stats); // { avg, min, max, p50, p95, p99 }
```

### 3. Event Tracking
```typescript
import { logger } from './src/core/logging/logger';

// Track user actions
logger.track('button_clicked', 'ui_interaction', {
  button: 'calculate',
  screen: 'color_mixer'
});

// Track errors
logger.track('error_occurred', 'error', {
  code: 'INVALID_COLOR',
  severity: 'medium'
});
```

## 🔧 Configuration

### Environment Variables
Create `.env.local` file:
```env
# Logging
VITE_LOG_LEVEL=debug
VITE_ENABLE_TELEMETRY=false

# Error Handling
VITE_SHOW_ERROR_DETAILS=true
VITE_ERROR_RETRY_COUNT=3

# Accessibility
VITE_WCAG_LEVEL=AA
```

### Development Tools

#### Browser Extensions
- React Developer Tools
- Redux DevTools (if using Redux)
- Accessibility Insights for Web
- axe DevTools

#### VS Code Extensions
- ESLint
- Prettier
- Error Lens
- GitLens

## 🐛 Debugging

### 1. Error Handler Debugging
```typescript
import { errorHandler } from './src/core/errors/errorHandler';

// Get error statistics
const stats = errorHandler.getStatistics();
console.log(stats);
// {
//   total: 5,
//   byCategory: { validation: 3, network: 2 },
//   bySeverity: { low: 1, medium: 3, high: 1 },
//   recent: [...]
// }
```

### 2. Validation Debugging
```typescript
import { FormValidator } from './src/core/validation/inputValidator';

const validator = new FormValidator();

validator
  .field('color', userInput, InputValidator.validateLabColor)
  .field('ratio', ratioInput, InputValidator.validateInkRatios);

const result = validator.result();
if (!result.valid) {
  console.log('Validation errors:', result.errors);
}
```

### 3. Network Status Debugging
```typescript
import { useNetworkStatus } from './src/components/guards/NetworkGuard';

function DebugNetwork() {
  const status = useNetworkStatus();
  
  return (
    <pre>
      {JSON.stringify(status, null, 2)}
    </pre>
  );
}
```

## 📱 Mobile Testing

### Responsive Design
```bash
# Chrome DevTools
1. Press F12
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device preset or custom size
4. Test error messages and toasts on mobile
```

### Touch Interactions
- Verify toast dismissal works with touch
- Check error boundary buttons are touch-friendly
- Test accessibility with mobile screen readers

## 🔄 Integration Steps

### 1. Add to App.tsx
```tsx
import { ErrorBoundary } from './components/guards/ErrorBoundary';
import { ToastProvider } from './components/notifications/Toast';
import { NetworkGuard } from './components/guards/NetworkGuard';
import { AccessibilityGuard } from './components/guards/AccessibilityGuard';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <NetworkGuard>
          <AccessibilityGuard>
            {/* Your existing app */}
          </AccessibilityGuard>
        </NetworkGuard>
      </ToastProvider>
    </ErrorBoundary>
  );
}
```

### 2. Add to Forms
```tsx
import { InputValidator } from './core/validation/inputValidator';
import { useToast } from './components/notifications/Toast';

function ColorForm() {
  const { showError } = useToast();
  
  const handleSubmit = (data) => {
    const result = InputValidator.validateLabColor(data.color);
    
    if (!result.valid) {
      result.errors.forEach(error => showError(error));
      return;
    }
    
    // Process valid data
    processColor(result.value);
  };
}
```

### 3. Add to API Calls
```typescript
import { errorHandler } from './core/errors/errorHandler';
import { ErrorFactory } from './core/errors/errorFactory';

async function fetchData() {
  return await errorHandler.handleAsync(
    async () => {
      const response = await fetch('/api/data');
      
      if (!response.ok) {
        throw ErrorFactory.network('NETWORK_ERROR', {
          statusCode: response.status
        });
      }
      
      return response.json();
    },
    [] // fallback value
  );
}
```

## ✅ Verification Checklist

### Error Handling
- [ ] Error boundaries catch React errors
- [ ] Toast notifications appear and auto-dismiss
- [ ] Error messages show in Korean for users
- [ ] Developer console shows technical details

### Input Validation
- [ ] Invalid inputs are rejected
- [ ] Sanitization removes dangerous content
- [ ] Validation messages are helpful
- [ ] Form submission blocked for invalid data

### Network Monitoring
- [ ] Offline mode shows fallback UI
- [ ] Online restoration shows notification
- [ ] Slow connection warning appears
- [ ] Network retry mechanism works

### Accessibility
- [ ] Low contrast warnings appear
- [ ] Screen reader announces errors
- [ ] Keyboard navigation works
- [ ] Focus management is correct

### Logging
- [ ] Console logs appear at correct levels
- [ ] Performance timing works
- [ ] Event tracking captures actions
- [ ] Error statistics are accurate

## 🚨 Common Issues

### Issue: Toasts not appearing
**Solution**: Ensure ToastProvider wraps your app

### Issue: Error boundary not catching errors
**Solution**: Error boundaries only catch errors in child components, not in event handlers

### Issue: Network status not updating
**Solution**: Check browser support for Network Information API

### Issue: Accessibility warnings not showing
**Solution**: Verify AccessibilityGuard is properly configured

## 📚 Further Reading

- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- [ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)

---

*Session F Testing Guide - Comprehensive testing instructions for error handling features*