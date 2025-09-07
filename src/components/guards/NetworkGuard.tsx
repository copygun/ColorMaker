// Decision: Network status monitoring with fallback UI
// Architecture: Connection-aware component wrapper

import React, { useState, useEffect, useCallback } from 'react';
import { ErrorFactory } from '../../core/errors/errorFactory';
import { errorHandler } from '../../core/errors/errorHandler';
import { useToast } from '../notifications/Toast';
import { logger } from '../../core/logging/logger';

/**
 * Network status
 */
interface NetworkStatus {
  online: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  lastChecked: Date;
}

/**
 * Network guard props
 */
interface NetworkGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onStatusChange?: (status: NetworkStatus) => void;
  checkInterval?: number;
  showNotification?: boolean;
}

/**
 * Network guard component
 */
export const NetworkGuard: React.FC<NetworkGuardProps> = ({
  children,
  fallback,
  onStatusChange,
  checkInterval = 5000,
  showNotification = true
}) => {
  const [status, setStatus] = useState<NetworkStatus>({
    online: navigator.onLine,
    lastChecked: new Date()
  });
  
  const { showWarning, showInfo } = useToast();
  
  /**
   * Update network status
   */
  const updateStatus = useCallback(() => {
    const connection = (navigator as any).connection;
    
    const newStatus: NetworkStatus = {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
      lastChecked: new Date()
    };
    
    // Log network change
    if (newStatus.online !== status.online) {
      logger.info(`Network status changed: ${newStatus.online ? 'online' : 'offline'}`, {
        effectiveType: newStatus.effectiveType,
        downlink: newStatus.downlink
      });
      
      // Show notification
      if (showNotification) {
        if (newStatus.online) {
          showInfo('인터넷 연결이 복구되었습니다.');
        } else {
          showWarning('인터넷 연결이 끊어졌습니다.');
        }
      }
      
      // Handle offline error
      if (!newStatus.online) {
        const error = ErrorFactory.network('NETWORK_OFFLINE');
        errorHandler.handle(error);
      }
    }
    
    setStatus(newStatus);
    
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  }, [status.online, onStatusChange, showNotification, showInfo, showWarning]);
  
  /**
   * Setup event listeners
   */
  useEffect(() => {
    // Update on mount
    updateStatus();
    
    // Listen for online/offline events
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }
    
    // Periodic check
    const interval = setInterval(updateStatus, checkInterval);
    
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
      
      clearInterval(interval);
    };
  }, [updateStatus, checkInterval]);
  
  // Show fallback when offline
  if (!status.online) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return <OfflineFallback status={status} />;
  }
  
  // Show slow connection warning
  if (status.effectiveType === 'slow-2g' || status.effectiveType === '2g') {
    return (
      <>
        <SlowConnectionWarning status={status} />
        {children}
      </>
    );
  }
  
  return <>{children}</>;
};

/**
 * Offline fallback component
 */
const OfflineFallback: React.FC<{ status: NetworkStatus }> = ({ status }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-6xl mb-4">📡</div>
      
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        오프라인 상태입니다
      </h2>
      
      <p className="text-gray-600 mb-6 text-center max-w-md">
        인터넷 연결을 확인해주세요. 
        연결이 복구되면 자동으로 다시 시도합니다.
      </p>
      
      <div className="text-sm text-gray-500">
        마지막 확인: {status.lastChecked.toLocaleTimeString()}
      </div>
      
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        새로고침
      </button>
    </div>
  );
};

/**
 * Slow connection warning
 */
const SlowConnectionWarning: React.FC<{ status: NetworkStatus }> = ({ status }) => {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) {
    return null;
  }
  
  return (
    <div className="bg-yellow-50 border-b border-yellow-200 p-3">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center">
          <span className="text-yellow-600 mr-2">⚠️</span>
          <span className="text-sm text-yellow-800">
            느린 네트워크가 감지되었습니다 ({status.effectiveType}). 
            일부 기능이 느리게 작동할 수 있습니다.
          </span>
        </div>
        
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-600 hover:text-yellow-800"
          aria-label="닫기"
        >
          ×
        </button>
      </div>
    </div>
  );
};

/**
 * Network status hook
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    online: navigator.onLine,
    lastChecked: new Date()
  });
  
  useEffect(() => {
    const updateStatus = () => {
      const connection = (navigator as any).connection;
      
      setStatus({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData,
        lastChecked: new Date()
      });
    };
    
    // Initial update
    updateStatus();
    
    // Event listeners
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }
    
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);
  
  return status;
};

/**
 * Retry with network detection
 */
export const useNetworkRetry = () => {
  const status = useNetworkStatus();
  const { showWarning } = useToast();
  
  const retry = useCallback(async <T,>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      onRetry?: (attempt: number) => void;
    } = {}
  ): Promise<T> => {
    const { maxRetries = 3, retryDelay = 1000, onRetry } = options;
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Wait for network if offline
      if (!status.online) {
        showWarning('네트워크 연결을 기다리는 중...');
        await waitForNetwork();
      }
      
      try {
        logger.debug(`Network retry attempt ${attempt}/${maxRetries}`);
        
        if (onRetry) {
          onRetry(attempt);
        }
        
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        logger.warn(`Network retry failed (attempt ${attempt}/${maxRetries})`, {
          error: lastError.message
        });
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }
    
    throw lastError || new Error('Network retry failed');
  }, [status.online, showWarning]);
  
  return { retry, isOnline: status.online };
};

/**
 * Wait for network connection
 */
async function waitForNetwork(timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (navigator.onLine) {
      resolve();
      return;
    }
    
    const timer = setTimeout(() => {
      reject(new Error('Network timeout'));
    }, timeout);
    
    const handleOnline = () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      resolve();
    };
    
    window.addEventListener('online', handleOnline);
  });
}