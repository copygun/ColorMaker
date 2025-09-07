# Session F: Unified Diff - Key Changes

## New Files Created

### src/core/errors/types.ts - Error Type System
```typescript
+ export enum ErrorSeverity {
+   LOW = 'low',
+   MEDIUM = 'medium',
+   HIGH = 'high',
+   CRITICAL = 'critical'
+ }
+ 
+ export enum ErrorCategory {
+   VALIDATION = 'validation',
+   CALCULATION = 'calculation',
+   NETWORK = 'network',
+   PERMISSION = 'permission',
+   SYSTEM = 'system',
+   BUSINESS = 'business'
+ }
+ 
+ export interface AppError {
+   id: string;
+   code: string;
+   category: ErrorCategory;
+   severity: ErrorSeverity;
+   userMessage: string;      // Korean user-friendly message
+   developerMessage: string; // English technical details
+   timestamp: string;
+   context?: Record<string, any>;
+   recoverable: boolean;
+ }
```

### src/core/errors/errorFactory.ts - Error Creation Factory
```typescript
+ const ERROR_MESSAGES = {
+   INVALID_COLOR: {
+     user: '입력하신 색상 값이 올바르지 않습니다.',
+     developer: 'Invalid color value: {value}'
+   },
+   TAC_EXCEEDED: {
+     user: 'TAC 한계를 초과했습니다. 잉크 양을 줄여주세요.',
+     developer: 'TAC limit exceeded: {tac} > {limit}'
+   },
+   NETWORK_OFFLINE: {
+     user: '인터넷 연결을 확인해주세요.',
+     developer: 'Network offline detected'
+   }
+ };
+ 
+ export class ErrorFactory {
+   static validation(code: string, context?: any): ValidationError {
+     const messages = ERROR_MESSAGES[code];
+     return {
+       id: this.generateId(),
+       code,
+       category: ErrorCategory.VALIDATION,
+       userMessage: this.interpolate(messages.user, context),
+       developerMessage: this.interpolate(messages.developer, context),
+       // ... other properties
+     };
+   }
+ }
```

### src/core/validation/inputValidator.ts - Input Validation Pipeline
```typescript
+ export class InputSanitizer {
+   static number(value: any, min?: number, max?: number): number | null {
+     if (value === null || value === undefined) return null;
+     const num = parseFloat(value);
+     if (isNaN(num)) return null;
+     if (min !== undefined && num < min) return min;
+     if (max !== undefined && num > max) return max;
+     return num;
+   }
+   
+   static labColor(value: any): LabColor | null {
+     if (!value) return null;
+     const L = this.number(value.L, 0, 100);
+     const a = this.number(value.a, -128, 127);
+     const b = this.number(value.b, -128, 127);
+     if (L === null || a === null || b === null) return null;
+     return { L, a, b };
+   }
+ }
+ 
+ export class InputValidator {
+   static validateLabColor(value: any): ValidationResult<LabColor> {
+     const sanitized = InputSanitizer.labColor(value);
+     if (!sanitized) {
+       return { 
+         valid: false, 
+         errors: [ErrorFactory.validation('INVALID_COLOR', { value })]
+       };
+     }
+     return { valid: true, value: sanitized, errors: [] };
+   }
+ }
```

### src/components/guards/ErrorBoundary.tsx - React Error Boundary
```tsx
+ export class ErrorBoundary extends Component<Props, State> {
+   static getDerivedStateFromError(error: Error) {
+     return { hasError: true, error: ErrorFactory.fromNative(error) };
+   }
+   
+   componentDidCatch(error: Error, errorInfo: ErrorInfo) {
+     errorHandler.handle(error);
+     if (this.props.onError) {
+       this.props.onError(error, errorInfo);
+     }
+   }
+   
+   render() {
+     if (this.state.hasError) {
+       return (
+         <div className="error-boundary-fallback">
+           <h2>오류가 발생했습니다</h2>
+           <p>{this.state.error.userMessage}</p>
+           <button onClick={this.reset}>다시 시도</button>
+         </div>
+       );
+     }
+     return this.props.children;
+   }
+ }
```

### src/components/notifications/Toast.tsx - Toast Notification System
```tsx
+ export const ToastProvider: React.FC = ({ children }) => {
+   const [toasts, setToasts] = useState<ToastMessage[]>([]);
+   
+   const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
+     const id = generateId();
+     const newToast = { id, duration: 5000, ...toast };
+     setToasts(prev => [...prev, newToast]);
+     
+     if (newToast.duration > 0) {
+       setTimeout(() => removeToast(id), newToast.duration);
+     }
+     return id;
+   }, []);
+   
+   const showError = useCallback((error: AppError) => {
+     addToast({
+       type: 'error',
+       title: '오류',
+       message: error.userMessage,
+       duration: error.severity === ErrorSeverity.CRITICAL ? 0 : 7000
+     });
+   }, [addToast]);
+   
+   return (
+     <ToastContext.Provider value={{ toasts, addToast, showError }}>
+       {children}
+       <ToastContainer />
+     </ToastContext.Provider>
+   );
+ };
```

### src/components/guards/NetworkGuard.tsx - Network Monitoring
```tsx
+ export const NetworkGuard: React.FC<Props> = ({ children, fallback }) => {
+   const [status, setStatus] = useState<NetworkStatus>({
+     online: navigator.onLine,
+     lastChecked: new Date()
+   });
+   
+   useEffect(() => {
+     const updateStatus = () => {
+       const connection = (navigator as any).connection;
+       setStatus({
+         online: navigator.onLine,
+         effectiveType: connection?.effectiveType,
+         downlink: connection?.downlink
+       });
+     };
+     
+     window.addEventListener('online', updateStatus);
+     window.addEventListener('offline', updateStatus);
+     
+     return () => {
+       window.removeEventListener('online', updateStatus);
+       window.removeEventListener('offline', updateStatus);
+     };
+   }, []);
+   
+   if (!status.online) {
+     return fallback || <OfflineFallback />;
+   }
+   
+   return <>{children}</>;
+ };
```

### src/components/guards/AccessibilityGuard.tsx - WCAG Compliance
```tsx
+ export class AccessibilityUtils {
+   static getContrastRatio(color1: RGBColor, color2: RGBColor): number {
+     const lum1 = this.getLuminance(color1);
+     const lum2 = this.getLuminance(color2);
+     const lighter = Math.max(lum1, lum2);
+     const darker = Math.min(lum1, lum2);
+     return (lighter + 0.05) / (darker + 0.05);
+   }
+   
+   static checkWCAGCompliance(
+     foreground: RGBColor,
+     background: RGBColor,
+     isLargeText: boolean = false
+   ): AccessibilityCheckResult {
+     const ratio = this.getContrastRatio(foreground, background);
+     const required = isLargeText ? 3.0 : 4.5;
+     
+     if (ratio < required) {
+       return {
+         passed: false,
+         issues: ['low-contrast'],
+         suggestions: [`대비율이 ${ratio.toFixed(2)}입니다. 최소 ${required} 필요.`],
+         contrastRatio: ratio,
+         wcagLevel: 'Fail'
+       };
+     }
+     
+     return {
+       passed: true,
+       contrastRatio: ratio,
+       wcagLevel: ratio >= 7 ? 'AAA' : 'AA'
+     };
+   }
+ }
```

### src/core/logging/logger.ts - Logging System
```typescript
+ export class Logger {
+   private config: LoggerConfig;
+   private logs: LogEntry[] = [];
+   private telemetryQueue: TelemetryEvent[] = [];
+   private performanceMonitor = new PerformanceMonitor();
+   
+   debug(message: string, context?: any): void {
+     this.log(LogLevel.DEBUG, message, context);
+   }
+   
+   error(message: string, error?: Error, context?: any): void {
+     this.log(LogLevel.ERROR, message, { ...context, error });
+   }
+   
+   track(name: string, category: string, properties?: any): void {
+     if (!this.config.enableTelemetry) return;
+     
+     this.telemetryQueue.push({
+       name,
+       category,
+       properties,
+       timestamp: new Date().toISOString()
+     });
+     
+     if (this.telemetryQueue.length >= this.config.batchSize) {
+       this.flushTelemetry();
+     }
+   }
+   
+   startTimer(name: string): void {
+     this.performanceMonitor.mark(name);
+   }
+   
+   endTimer(name: string): number {
+     return this.performanceMonitor.measure(name, name);
+   }
+ }
```

## Integration Points

### App.tsx Integration (To Be Added)
```tsx
// Wrap entire app with error handling and notifications
function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <NetworkGuard>
          <AccessibilityGuard>
            {/* Existing app content */}
          </AccessibilityGuard>
        </NetworkGuard>
      </ToastProvider>
    </ErrorBoundary>
  );
}
```

### Form Integration Example (To Be Added)
```tsx
// Add validation to color input forms
const handleColorInput = (input: any) => {
  const result = InputValidator.validateLabColor(input);
  
  if (!result.valid) {
    result.errors.forEach(error => {
      toast.error(error.userMessage);
      logger.warn('Color validation failed', error);
    });
    return;
  }
  
  // Process valid color
  processColor(result.value);
};
```

### API Call Integration (To Be Added)
```tsx
// Wrap API calls with error handling
const fetchData = async () => {
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
};
```

## Summary of Changes

### Files Created: 10
- Error handling core (3 files, 812 lines)
- Input validation (1 file, 338 lines)
- UI guards (3 files, 1,182 lines)
- Notifications (1 file, 366 lines)
- Logging (1 file, 444 lines)
- Documentation (1 file, 389 lines)

### Total Lines Added: ~3,531

### Key Features Added:
1. ✅ Comprehensive error type system
2. ✅ User/developer message separation
3. ✅ Input sanitization pipeline
4. ✅ React error boundaries
5. ✅ Toast notifications
6. ✅ Network monitoring
7. ✅ WCAG compliance checking
8. ✅ Telemetry and logging
9. ✅ Error recovery strategies
10. ✅ Accessibility alerts

---

*Session F Unified Diff - Shows key additions for error handling and safety features*