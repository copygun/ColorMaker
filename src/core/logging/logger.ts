// Decision: Lightweight logging system with telemetry hooks
// Architecture: Configurable logging with performance monitoring

import { AppError, ErrorContext } from '../errors/types';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
  NONE = 5
}

/**
 * Log entry
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  category?: string;
  context?: Record<string, any>;
  error?: AppError;
  performance?: {
    duration?: number;
    memory?: number;
  };
}

/**
 * Telemetry event
 */
export interface TelemetryEvent {
  name: string;
  category: string;
  properties?: Record<string, any>;
  metrics?: Record<string, number>;
  timestamp: string;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableTelemetry: boolean;
  enablePerformance: boolean;
  maxLogSize: number;
  telemetryEndpoint?: string;
  batchSize: number;
  flushInterval: number;
}

/**
 * Performance monitor
 */
class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();
  
  /**
   * Start performance measurement
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }
  
  /**
   * End performance measurement
   */
  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      return 0;
    }
    
    const duration = performance.now() - start;
    
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    
    this.measures.get(name)!.push(duration);
    this.marks.delete(startMark);
    
    return duration;
  }
  
  /**
   * Get performance statistics
   */
  getStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const measures = this.measures.get(name);
    if (!measures || measures.length === 0) {
      return null;
    }
    
    const sorted = [...measures].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    return {
      count,
      avg: sum / count,
      min: sorted[0],
      max: sorted[count - 1],
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)]
    };
  }
  
  /**
   * Clear performance data
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

/**
 * Logger class
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private telemetryQueue: TelemetryEvent[] = [];
  private performanceMonitor = new PerformanceMonitor();
  private flushTimer?: NodeJS.Timeout;
  private context: ErrorContext = {};
  
  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableTelemetry: false,
      enablePerformance: true,
      maxLogSize: 1000,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      ...config
    };
    
    this.setupFlushTimer();
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }
  
  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
  
  /**
   * Set context
   */
  setContext(context: Partial<ErrorContext>): void {
    this.context = { ...this.context, ...context };
  }
  
  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }
  
  /**
   * Debug log
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  /**
   * Info log
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  /**
   * Warning log
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }
  
  /**
   * Error log
   */
  error(message: string, error?: Error | AppError, context?: Record<string, any>): void {
    const appError = error && 'code' in error ? error : undefined;
    this.log(LogLevel.ERROR, message, { ...context, error: error?.message }, appError);
  }
  
  /**
   * Fatal log
   */
  fatal(message: string, error?: Error | AppError, context?: Record<string, any>): void {
    const appError = error && 'code' in error ? error : undefined;
    this.log(LogLevel.FATAL, message, { ...context, error: error?.message }, appError);
  }
  
  /**
   * Track telemetry event
   */
  track(name: string, category: string, properties?: Record<string, any>, metrics?: Record<string, number>): void {
    if (!this.config.enableTelemetry) {
      return;
    }
    
    const event: TelemetryEvent = {
      name,
      category,
      properties: { ...this.context, ...properties },
      metrics,
      timestamp: new Date().toISOString()
    };
    
    this.telemetryQueue.push(event);
    
    if (this.telemetryQueue.length >= this.config.batchSize) {
      this.flushTelemetry();
    }
  }
  
  /**
   * Start performance timing
   */
  startTimer(name: string): void {
    if (!this.config.enablePerformance) {
      return;
    }
    
    this.performanceMonitor.mark(name);
  }
  
  /**
   * End performance timing
   */
  endTimer(name: string, log: boolean = true): number {
    if (!this.config.enablePerformance) {
      return 0;
    }
    
    const duration = this.performanceMonitor.measure(name, name);
    
    if (log && duration > 0) {
      this.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  /**
   * Get performance stats
   */
  getPerformanceStats(name: string) {
    return this.performanceMonitor.getStats(name);
  }
  
  /**
   * Get recent logs
   */
  getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let logs = this.logs;
    
    if (level !== undefined) {
      logs = logs.filter(log => log.level >= level);
    }
    
    return logs.slice(-limit);
  }
  
  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }
  
  /**
   * Flush telemetry
   */
  async flushTelemetry(): Promise<void> {
    if (this.telemetryQueue.length === 0) {
      return;
    }
    
    const events = [...this.telemetryQueue];
    this.telemetryQueue = [];
    
    if (this.config.telemetryEndpoint) {
      try {
        await fetch(this.config.telemetryEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ events })
        });
      } catch (error) {
        console.error('Failed to send telemetry:', error);
      }
    }
  }
  
  /**
   * Create log entry
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: AppError
  ): void {
    if (level < this.config.level) {
      return;
    }
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      error
    };
    
    // Add to log buffer
    this.logs.push(entry);
    
    // Trim logs if needed
    if (this.logs.length > this.config.maxLogSize) {
      this.logs = this.logs.slice(-this.config.maxLogSize);
    }
    
    // Console output
    if (this.config.enableConsole) {
      this.consoleLog(entry);
    }
  }
  
  /**
   * Console log output
   */
  private consoleLog(entry: LogEntry): void {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    const levelName = levelNames[entry.level];
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    
    const message = `[${timestamp}] [${levelName}] ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.context);
        break;
      case LogLevel.INFO:
        console.info(message, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.context);
        if (entry.error) {
          console.error('Error details:', entry.error);
        }
        break;
    }
  }
  
  /**
   * Setup flush timer
   */
  private setupFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    if (this.config.enableTelemetry && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flushTelemetry();
      }, this.config.flushInterval);
    }
  }
}

/**
 * Default logger instance
 */
export const logger = Logger.getInstance();

/**
 * React hook for logging
 */
export const useLogger = (category?: string) => {
  const loggerInstance = Logger.getInstance();
  
  React.useEffect(() => {
    if (category) {
      loggerInstance.setContext({ component: category });
    }
    
    return () => {
      if (category) {
        loggerInstance.clearContext();
      }
    };
  }, [category, loggerInstance]);
  
  return {
    debug: loggerInstance.debug.bind(loggerInstance),
    info: loggerInstance.info.bind(loggerInstance),
    warn: loggerInstance.warn.bind(loggerInstance),
    error: loggerInstance.error.bind(loggerInstance),
    track: loggerInstance.track.bind(loggerInstance),
    startTimer: loggerInstance.startTimer.bind(loggerInstance),
    endTimer: loggerInstance.endTimer.bind(loggerInstance)
  };
};