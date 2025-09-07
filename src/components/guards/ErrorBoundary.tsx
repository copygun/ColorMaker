// Decision: React error boundary for graceful error handling
// Architecture: Component-level error isolation with fallback UI

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, ErrorBoundaryState } from '../../core/errors/types';
import { ErrorFactory } from '../../core/errors/errorFactory';
import { errorHandler } from '../../core/errors/errorHandler';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, reset: () => void) => ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // If true, errors won't propagate up
  showDetails?: boolean; // Show technical details in development
}

/**
 * Error boundary component for React error handling
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to show fallback UI
    const appError = ErrorFactory.fromNative(error);
    
    return {
      hasError: true,
      error: appError
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = this.state.error || ErrorFactory.fromNative(error);
    
    // Log error
    errorHandler.handle(appError);
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
    
    // Update state with error info
    this.setState({
      errorInfo
    });
  }
  
  /**
   * Reset error boundary
   */
  reset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: this.state.retryCount + 1
    });
  };
  
  /**
   * Render fallback UI
   */
  renderFallback() {
    const { error } = this.state;
    const { fallback, showDetails } = this.props;
    
    if (!error) {
      return null;
    }
    
    // Use custom fallback if provided
    if (fallback) {
      return fallback(error, this.reset);
    }
    
    // Default fallback UI
    return (
      <div className="error-boundary-fallback p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">⚠️</div>
          
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            오류가 발생했습니다
          </h2>
          
          <p className="text-gray-600 mb-6">
            {error.userMessage}
          </p>
          
          {showDetails && process.env.NODE_ENV === 'development' && (
            <details className="text-left mb-6">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                기술적 세부사항
              </summary>
              <div className="mt-2 p-4 bg-gray-100 rounded text-xs">
                <p className="font-mono mb-2">
                  Code: {error.code}
                </p>
                <p className="font-mono mb-2">
                  Category: {error.category}
                </p>
                <p className="font-mono mb-2">
                  Severity: {error.severity}
                </p>
                {error.developerMessage && (
                  <p className="font-mono mb-2">
                    Message: {error.developerMessage}
                  </p>
                )}
                {error.stack && (
                  <pre className="mt-4 overflow-auto max-h-40 text-xs">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={this.reset}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              다시 시도
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              페이지 새로고침
            </button>
          </div>
          
          {this.state.retryCount > 2 && (
            <p className="mt-4 text-sm text-orange-600">
              문제가 계속되면 관리자에게 문의하세요.
            </p>
          )}
        </div>
      </div>
    );
  }
  
  render() {
    if (this.state.hasError) {
      return this.renderFallback();
    }
    
    return this.props.children;
  }
}

/**
 * Hook for using error boundary
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<AppError | null>(null);
  
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);
  
  const captureError = React.useCallback((error: Error | AppError) => {
    const appError = 'code' in error 
      ? error 
      : ErrorFactory.fromNative(error);
    
    setError(appError);
    errorHandler.handle(appError);
  }, []);
  
  // Throw error to nearest boundary
  if (error) {
    throw error;
  }
  
  return { captureError, resetError };
}

/**
 * Async error boundary wrapper
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;
  
  return WrappedComponent;
}