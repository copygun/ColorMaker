// Decision: Centralized error type system for consistent error handling
// Architecture: Error hierarchy with user/developer message separation

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',       // Informational, can be ignored
  MEDIUM = 'medium', // User should be aware but can continue
  HIGH = 'high',     // User action required
  CRITICAL = 'critical' // System cannot continue
}

/**
 * Error categories for routing and handling
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  CALCULATION = 'calculation',
  NETWORK = 'network',
  PERMISSION = 'permission',
  SYSTEM = 'system',
  BUSINESS = 'business'
}

/**
 * Base error interface
 */
export interface AppError {
  id: string;
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;      // User-friendly message
  developerMessage: string; // Technical details for debugging
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
  recoverable: boolean;
}

/**
 * Validation error details
 */
export interface ValidationError extends AppError {
  category: ErrorCategory.VALIDATION;
  field?: string;
  value?: any;
  constraints?: Record<string, any>;
}

/**
 * Calculation error details
 */
export interface CalculationError extends AppError {
  category: ErrorCategory.CALCULATION;
  input?: any;
  expected?: any;
  actual?: any;
}

/**
 * Network error details
 */
export interface NetworkError extends AppError {
  category: ErrorCategory.NETWORK;
  url?: string;
  method?: string;
  statusCode?: number;
  retryable: boolean;
  retryAfter?: number;
}

/**
 * Error recovery strategies
 */
export interface ErrorRecovery {
  strategy: 'retry' | 'fallback' | 'ignore' | 'fail';
  fallbackValue?: any;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Error context for logging
 */
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  action?: string;
  component?: string;
  version?: string;
  environment?: string;
}

/**
 * Error display options
 */
export interface ErrorDisplayOptions {
  showToast?: boolean;
  showInline?: boolean;
  showModal?: boolean;
  autoHide?: boolean;
  duration?: number;
  actionButton?: {
    label: string;
    action: () => void;
  };
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
  errorInfo?: any;
  retryCount: number;
}