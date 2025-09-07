// Decision: Factory pattern for consistent error creation
// Architecture: Centralized error creation with message templates

import { 
  AppError, 
  ErrorSeverity, 
  ErrorCategory,
  ValidationError,
  CalculationError,
  NetworkError 
} from './types';

/**
 * Error message templates
 */
const ERROR_MESSAGES = {
  // Validation errors
  INVALID_COLOR: {
    user: '입력하신 색상 값이 올바르지 않습니다.',
    developer: 'Invalid color value: {value}'
  },
  INVALID_RATIO: {
    user: '잉크 비율의 합이 100%가 되어야 합니다.',
    developer: 'Invalid ink ratio sum: {sum}, expected: 1.0'
  },
  TAC_EXCEEDED: {
    user: 'TAC 한계를 초과했습니다. 잉크 양을 줄여주세요.',
    developer: 'TAC limit exceeded: {tac} > {limit}'
  },
  REQUIRED_FIELD: {
    user: '필수 입력 항목입니다.',
    developer: 'Required field missing: {field}'
  },
  
  // Calculation errors
  DELTA_E_CALCULATION: {
    user: '색차 계산 중 오류가 발생했습니다.',
    developer: 'Delta E calculation failed: {method}, {error}'
  },
  COLOR_MIXING: {
    user: '색상 혼합 계산에 실패했습니다.',
    developer: 'Color mixing failed: {method}, {colors}'
  },
  CONVERSION_FAILED: {
    user: '색상 변환에 실패했습니다.',
    developer: 'Color space conversion failed: {from} -> {to}'
  },
  
  // Business logic errors
  RECIPE_TRANSITION: {
    user: '현재 상태에서는 해당 작업을 수행할 수 없습니다.',
    developer: 'Invalid recipe state transition: {from} -> {to}'
  },
  INSUFFICIENT_INKS: {
    user: '최소 1개 이상의 잉크를 선택해야 합니다.',
    developer: 'Insufficient inks selected: {count}'
  },
  
  // Network errors
  NETWORK_TIMEOUT: {
    user: '네트워크 연결이 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
    developer: 'Network timeout: {url}, {timeout}ms'
  },
  NETWORK_OFFLINE: {
    user: '인터넷 연결을 확인해주세요.',
    developer: 'Network offline detected'
  },
  
  // System errors
  STORAGE_FULL: {
    user: '저장 공간이 부족합니다.',
    developer: 'Local storage quota exceeded'
  },
  BROWSER_UNSUPPORTED: {
    user: '지원하지 않는 브라우저입니다. Chrome 또는 Firefox를 사용해주세요.',
    developer: 'Unsupported browser: {userAgent}'
  }
};

/**
 * Error factory class
 */
export class ErrorFactory {
  private static errorCounter = 0;
  
  /**
   * Generate unique error ID
   */
  private static generateId(): string {
    return `err_${Date.now()}_${++this.errorCounter}`;
  }
  
  /**
   * Replace template variables
   */
  private static interpolate(template: string, context?: Record<string, any>): string {
    if (!context) return template;
    
    return template.replace(/{(\w+)}/g, (match, key) => {
      return context[key]?.toString() || match;
    });
  }
  
  /**
   * Create validation error
   */
  static validation(
    code: keyof typeof ERROR_MESSAGES,
    context?: Record<string, any>,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): ValidationError {
    const messages = ERROR_MESSAGES[code];
    
    return {
      id: this.generateId(),
      code,
      category: ErrorCategory.VALIDATION,
      severity,
      userMessage: this.interpolate(messages.user, context),
      developerMessage: this.interpolate(messages.developer, context),
      timestamp: new Date().toISOString(),
      context,
      recoverable: true,
      field: context?.field,
      value: context?.value,
      constraints: context?.constraints
    };
  }
  
  /**
   * Create calculation error
   */
  static calculation(
    code: keyof typeof ERROR_MESSAGES,
    context?: Record<string, any>,
    severity: ErrorSeverity = ErrorSeverity.HIGH
  ): CalculationError {
    const messages = ERROR_MESSAGES[code];
    
    return {
      id: this.generateId(),
      code,
      category: ErrorCategory.CALCULATION,
      severity,
      userMessage: this.interpolate(messages.user, context),
      developerMessage: this.interpolate(messages.developer, context),
      timestamp: new Date().toISOString(),
      context,
      recoverable: false,
      input: context?.input,
      expected: context?.expected,
      actual: context?.actual
    };
  }
  
  /**
   * Create network error
   */
  static network(
    code: keyof typeof ERROR_MESSAGES,
    context?: Record<string, any>,
    retryable: boolean = true
  ): NetworkError {
    const messages = ERROR_MESSAGES[code];
    
    return {
      id: this.generateId(),
      code,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      userMessage: this.interpolate(messages.user, context),
      developerMessage: this.interpolate(messages.developer, context),
      timestamp: new Date().toISOString(),
      context,
      recoverable: retryable,
      retryable,
      url: context?.url,
      method: context?.method,
      statusCode: context?.statusCode,
      retryAfter: context?.retryAfter
    };
  }
  
  /**
   * Create custom error
   */
  static custom(
    userMessage: string,
    developerMessage: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): AppError {
    return {
      id: this.generateId(),
      code: 'CUSTOM',
      category,
      severity,
      userMessage,
      developerMessage,
      timestamp: new Date().toISOString(),
      recoverable: severity !== ErrorSeverity.CRITICAL
    };
  }
  
  /**
   * Wrap native error
   */
  static fromNative(error: Error, userMessage?: string): AppError {
    return {
      id: this.generateId(),
      code: error.name,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      userMessage: userMessage || '예기치 않은 오류가 발생했습니다.',
      developerMessage: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      recoverable: false
    };
  }
}

/**
 * Error message formatter for display
 */
export class ErrorFormatter {
  /**
   * Format for user display
   */
  static forUser(error: AppError): string {
    return error.userMessage;
  }
  
  /**
   * Format for developer console
   */
  static forDeveloper(error: AppError): string {
    return `[${error.code}] ${error.developerMessage} (${error.timestamp})`;
  }
  
  /**
   * Format for logging
   */
  static forLog(error: AppError): Record<string, any> {
    return {
      id: error.id,
      code: error.code,
      category: error.category,
      severity: error.severity,
      message: error.developerMessage,
      timestamp: error.timestamp,
      context: error.context,
      stack: error.stack
    };
  }
  
  /**
   * Format for telemetry
   */
  static forTelemetry(error: AppError): Record<string, any> {
    return {
      error_id: error.id,
      error_code: error.code,
      error_category: error.category,
      error_severity: error.severity,
      timestamp: error.timestamp,
      recoverable: error.recoverable
    };
  }
}