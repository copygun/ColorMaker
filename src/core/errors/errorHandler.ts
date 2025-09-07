// Decision: Centralized error handling with recovery strategies
// Architecture: Error recovery and user notification system

import { AppError, ErrorSeverity, ErrorCategory, ErrorRecovery } from './types';
import { ErrorFactory } from './errorFactory';

/**
 * Error handler configuration
 */
interface ErrorHandlerConfig {
  onError?: (error: AppError) => void;
  onRecovery?: (error: AppError, recovery: ErrorRecovery) => void;
  logToConsole?: boolean;
  logToTelemetry?: boolean;
  showUserNotification?: boolean;
}

/**
 * Global error handler
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private config: ErrorHandlerConfig;
  private errorQueue: AppError[] = [];
  private recoveryStrategies: Map<string, ErrorRecovery> = new Map();
  
  private constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      logToConsole: true,
      logToTelemetry: true,
      showUserNotification: true,
      ...config
    };
    
    this.setupDefaultRecoveryStrategies();
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(config?: ErrorHandlerConfig): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(config);
    }
    return ErrorHandler.instance;
  }
  
  /**
   * Handle error with recovery
   */
  handle(error: AppError | Error | unknown): void {
    const appError = this.normalizeError(error);
    
    // Add to queue for batch processing
    this.errorQueue.push(appError);
    
    // Log error
    this.logError(appError);
    
    // Notify user if needed
    if (this.shouldNotifyUser(appError)) {
      this.notifyUser(appError);
    }
    
    // Attempt recovery
    this.attemptRecovery(appError);
    
    // Call custom handler
    if (this.config.onError) {
      this.config.onError(appError);
    }
  }
  
  /**
   * Handle async errors
   */
  async handleAsync<T>(
    operation: () => Promise<T>,
    fallback?: T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handle(error);
      
      if (fallback !== undefined) {
        return fallback;
      }
      
      throw error;
    }
  }
  
  /**
   * Wrap function with error handling
   */
  wrap<T extends (...args: any[]) => any>(
    fn: T,
    context?: string
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        
        if (result instanceof Promise) {
          return result.catch((error) => {
            this.handle(error);
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        this.handle(error);
        throw error;
      }
    }) as T;
  }
  
  /**
   * Register recovery strategy
   */
  registerRecovery(errorCode: string, recovery: ErrorRecovery): void {
    this.recoveryStrategies.set(errorCode, recovery);
  }
  
  /**
   * Get error statistics
   */
  getStatistics(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: AppError[];
  } {
    const stats = {
      total: this.errorQueue.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recent: this.errorQueue.slice(-10)
    };
    
    // Count by category
    Object.values(ErrorCategory).forEach(category => {
      stats.byCategory[category] = this.errorQueue.filter(
        e => e.category === category
      ).length;
    });
    
    // Count by severity
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = this.errorQueue.filter(
        e => e.severity === severity
      ).length;
    });
    
    return stats;
  }
  
  /**
   * Clear error queue
   */
  clearQueue(): void {
    this.errorQueue = [];
  }
  
  /**
   * Normalize error to AppError
   */
  private normalizeError(error: AppError | Error | unknown): AppError {
    if (this.isAppError(error)) {
      return error;
    }
    
    if (error instanceof Error) {
      return ErrorFactory.fromNative(error);
    }
    
    return ErrorFactory.custom(
      '예기치 않은 오류가 발생했습니다.',
      String(error),
      ErrorCategory.SYSTEM
    );
  }
  
  /**
   * Check if error is AppError
   */
  private isAppError(error: any): error is AppError {
    return error && 
           typeof error.id === 'string' &&
           typeof error.code === 'string' &&
           typeof error.category === 'string';
  }
  
  /**
   * Log error
   */
  private logError(error: AppError): void {
    if (this.config.logToConsole) {
      const logLevel = this.getLogLevel(error.severity);
      console[logLevel](`[${error.code}]`, error.developerMessage, error);
    }
    
    if (this.config.logToTelemetry) {
      // Send to telemetry service (implement based on your telemetry provider)
      this.sendToTelemetry(error);
    }
  }
  
  /**
   * Get console log level for severity
   */
  private getLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'log';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
    }
  }
  
  /**
   * Check if user should be notified
   */
  private shouldNotifyUser(error: AppError): boolean {
    if (!this.config.showUserNotification) {
      return false;
    }
    
    // Don't notify for low severity errors
    if (error.severity === ErrorSeverity.LOW) {
      return false;
    }
    
    // Don't notify for certain categories
    if (error.category === ErrorCategory.SYSTEM) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Notify user about error
   */
  private notifyUser(error: AppError): void {
    // This will be connected to the toast notification system
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('app-error', { 
        detail: error 
      }));
    }
  }
  
  /**
   * Attempt error recovery
   */
  private attemptRecovery(error: AppError): void {
    const recovery = this.recoveryStrategies.get(error.code);
    
    if (!recovery) {
      return;
    }
    
    switch (recovery.strategy) {
      case 'retry':
        this.scheduleRetry(error, recovery);
        break;
      case 'fallback':
        this.applyFallback(error, recovery);
        break;
      case 'ignore':
        // Just log and continue
        break;
      case 'fail':
        // Re-throw for critical errors
        if (error.severity === ErrorSeverity.CRITICAL) {
          throw error;
        }
        break;
    }
    
    if (this.config.onRecovery) {
      this.config.onRecovery(error, recovery);
    }
  }
  
  /**
   * Schedule retry for recoverable errors
   */
  private scheduleRetry(error: AppError, recovery: ErrorRecovery): void {
    const retryCount = recovery.retryCount || 3;
    const retryDelay = recovery.retryDelay || 1000;
    
    let attempts = 0;
    
    const retry = () => {
      attempts++;
      
      if (attempts > retryCount) {
        console.error('Max retry attempts reached for', error.code);
        return;
      }
      
      setTimeout(() => {
        console.log(`Retrying ${error.code}, attempt ${attempts}/${retryCount}`);
        // Retry logic would go here
      }, retryDelay * attempts);
    };
    
    retry();
  }
  
  /**
   * Apply fallback value
   */
  private applyFallback(error: AppError, recovery: ErrorRecovery): void {
    if (recovery.fallbackValue !== undefined) {
      console.log(`Using fallback value for ${error.code}:`, recovery.fallbackValue);
    }
  }
  
  /**
   * Send error to telemetry service
   */
  private sendToTelemetry(error: AppError): void {
    // Implement based on your telemetry provider
    // Example: Google Analytics, Sentry, etc.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.developerMessage,
        fatal: error.severity === ErrorSeverity.CRITICAL
      });
    }
  }
  
  /**
   * Setup default recovery strategies
   */
  private setupDefaultRecoveryStrategies(): void {
    // Network errors - retry
    this.registerRecovery('NETWORK_TIMEOUT', {
      strategy: 'retry',
      retryCount: 3,
      retryDelay: 2000
    });
    
    this.registerRecovery('NETWORK_OFFLINE', {
      strategy: 'retry',
      retryCount: 5,
      retryDelay: 5000
    });
    
    // Validation errors - ignore
    this.registerRecovery('INVALID_COLOR', {
      strategy: 'ignore'
    });
    
    this.registerRecovery('INVALID_RATIO', {
      strategy: 'ignore'
    });
    
    // Storage errors - fallback
    this.registerRecovery('STORAGE_FULL', {
      strategy: 'fallback',
      fallbackValue: null
    });
    
    // Critical errors - fail
    this.registerRecovery('BROWSER_UNSUPPORTED', {
      strategy: 'fail'
    });
  }
}

/**
 * Default error handler instance
 */
export const errorHandler = ErrorHandler.getInstance();

/**
 * Error boundary hook for React
 */
export const useErrorHandler = () => {
  const handler = ErrorHandler.getInstance();
  
  return {
    handle: handler.handle.bind(handler),
    handleAsync: handler.handleAsync.bind(handler),
    wrap: handler.wrap.bind(handler)
  };
};