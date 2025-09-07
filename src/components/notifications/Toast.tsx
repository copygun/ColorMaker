// Decision: Toast notification system for user feedback
// Architecture: Context-based notification management with accessibility

import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback,
  useEffect,
  useRef
} from 'react';
import { AppError, ErrorSeverity } from '../../core/errors/types';

/**
 * Toast types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast message
 */
export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  ariaLive?: 'polite' | 'assertive' | 'off';
}

/**
 * Toast context
 */
interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  showError: (error: AppError) => void;
  showSuccess: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast provider
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);
  
  /**
   * Generate unique toast ID
   */
  const generateId = useCallback(() => {
    toastIdRef.current += 1;
    return `toast-${Date.now()}-${toastIdRef.current}`;
  }, []);
  
  /**
   * Add toast
   */
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = generateId();
    const newToast: ToastMessage = {
      id,
      duration: 5000,
      dismissible: true,
      ariaLive: toast.type === 'error' ? 'assertive' : 'polite',
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-dismiss after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
    
    return id;
  }, [generateId]);
  
  /**
   * Remove toast
   */
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  /**
   * Clear all toasts
   */
  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);
  
  /**
   * Show error from AppError
   */
  const showError = useCallback((error: AppError) => {
    addToast({
      type: 'error',
      title: '오류',
      message: error.userMessage,
      duration: error.severity === ErrorSeverity.CRITICAL ? 0 : 7000,
      dismissible: error.severity !== ErrorSeverity.CRITICAL
    });
  }, [addToast]);
  
  /**
   * Show success message
   */
  const showSuccess = useCallback((message: string, title?: string) => {
    addToast({
      type: 'success',
      title: title || '성공',
      message
    });
  }, [addToast]);
  
  /**
   * Show warning message
   */
  const showWarning = useCallback((message: string, title?: string) => {
    addToast({
      type: 'warning',
      title: title || '경고',
      message,
      duration: 7000
    });
  }, [addToast]);
  
  /**
   * Show info message
   */
  const showInfo = useCallback((message: string, title?: string) => {
    addToast({
      type: 'info',
      title: title || '안내',
      message
    });
  }, [addToast]);
  
  // Listen for error events
  useEffect(() => {
    const handleError = (event: CustomEvent<AppError>) => {
      showError(event.detail);
    };
    
    window.addEventListener('app-error' as any, handleError);
    
    return () => {
      window.removeEventListener('app-error' as any, handleError);
    };
  }, [showError]);
  
  const value = {
    toasts,
    addToast,
    removeToast,
    clearAll,
    showError,
    showSuccess,
    showWarning,
    showInfo
  };
  
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

/**
 * Use toast hook
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  
  return context;
};

/**
 * Toast container component
 */
const ToastContainer: React.FC = () => {
  const { toasts } = useToast();
  
  return (
    <div 
      className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

/**
 * Individual toast item
 */
const ToastItem: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
  const { removeToast } = useToast();
  const [isExiting, setIsExiting] = useState(false);
  
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300);
  }, [toast.id, removeToast]);
  
  // Toast styles based on type
  const getToastStyles = () => {
    const baseStyles = 'min-w-[300px] max-w-md p-4 rounded-lg shadow-lg pointer-events-auto transform transition-all duration-300';
    
    const typeStyles = {
      success: 'bg-green-50 border border-green-200 text-green-800',
      error: 'bg-red-50 border border-red-200 text-red-800',
      warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border border-blue-200 text-blue-800'
    };
    
    const animationStyles = isExiting 
      ? 'translate-x-full opacity-0' 
      : 'translate-x-0 opacity-100';
    
    return `${baseStyles} ${typeStyles[toast.type]} ${animationStyles}`;
  };
  
  // Icon based on type
  const getIcon = () => {
    const icons = {
      success: '✓',
      error: '⚠',
      warning: '⚠',
      info: 'ℹ'
    };
    
    return icons[toast.type];
  };
  
  return (
    <div
      className={getToastStyles()}
      role="alert"
      aria-live={toast.ariaLive}
    >
      <div className="flex items-start">
        <span className="text-2xl mr-3" aria-hidden="true">
          {getIcon()}
        </span>
        
        <div className="flex-1">
          {toast.title && (
            <h4 className="font-semibold mb-1">
              {toast.title}
            </h4>
          )}
          
          <p className="text-sm">
            {toast.message}
          </p>
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        {toast.dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-3 text-xl leading-none hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="닫기"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Toast utility functions
 */
export const toast = {
  success: (message: string, title?: string) => {
    const event = new CustomEvent('toast', {
      detail: { type: 'success', message, title }
    });
    window.dispatchEvent(event);
  },
  
  error: (message: string, title?: string) => {
    const event = new CustomEvent('toast', {
      detail: { type: 'error', message, title }
    });
    window.dispatchEvent(event);
  },
  
  warning: (message: string, title?: string) => {
    const event = new CustomEvent('toast', {
      detail: { type: 'warning', message, title }
    });
    window.dispatchEvent(event);
  },
  
  info: (message: string, title?: string) => {
    const event = new CustomEvent('toast', {
      detail: { type: 'info', message, title }
    });
    window.dispatchEvent(event);
  }
};