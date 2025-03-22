// app/utils/request-logger.ts

/**
 * Creates a request-specific logger with consistent request ID
 */
export function createRequestLogger(requestId: string = generateRequestId()) {
  return {
    requestId,

    log: (message: string, ...args: any[]) => {
      console.log(`[${requestId}] ${message}`, ...args);
    },

    error: (message: string, ...args: any[]) => {
      console.error(`[${requestId}] ${message}`, ...args);
    },

    warn: (message: string, ...args: any[]) => {
      console.warn(`[${requestId}] ${message}`, ...args);
    },

    info: (message: string, ...args: any[]) => {
      console.info(`[${requestId}] ${message}`, ...args);
    },

    /**
     * Format error object for consistent logging
     */
    formatError: (error: any): Record<string, any> => {
      const formattedError: Record<string, any> = {
        name: error?.name || 'Unknown',
        message: error?.message || 'No message',
        stack: error?.stack
      };

      // Add Prisma specific fields if available
      if (error?.code) formattedError.code = error.code;
      if (error?.meta) formattedError.meta = error.meta;
      if (error?.clientVersion) formattedError.clientVersion = error.clientVersion;

      return formattedError;
    },

    /**
     * Log detailed error information
     */
    logError: (context: string, error: any) => {
      console.error(`[${requestId}] ERROR in ${context}:`, {
        ...(typeof error === 'object' ? formatRequestError(error) : { message: String(error) }),
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
}

/**
 * Format error objects consistently
 */
export function formatRequestError(error: any): Record<string, any> {
  const formattedError: Record<string, any> = {
    name: error?.name || 'Unknown',
    message: error?.message || 'No message'
  };

  // Include stack in development, omit in production
  if (process.env.NODE_ENV !== 'production') {
    formattedError.stack = error?.stack;
  }

  // Add Prisma specific fields if available
  if (error?.code) formattedError.code = error.code;
  if (error?.meta) formattedError.meta = error.meta;
  if (error?.clientVersion) formattedError.clientVersion = error.clientVersion;

  return formattedError;
}

/**
 * Safely redact potentially sensitive information from objects
 */
export function redactSensitiveInfo<T extends object>(obj: T, sensitiveKeys: string[] = ['password', 'token', 'secret', 'key']): T {
  if (!obj || typeof obj !== 'object') return obj;

  const result: any = { ...obj };

  Object.keys(result).forEach(key => {
    // Check if this is a sensitive key
    const isPrivate = sensitiveKeys.some(sk =>
      key.toLowerCase().includes(sk.toLowerCase())
    );

    if (isPrivate) {
      // @ts-ignore: Property assignment
      result[key] = typeof result[key] === 'string'
        ? '[REDACTED]'
        : result[key] === null ? null : '[REDACTED]';
    } else if (result[key] && typeof result[key] === 'object') {
      // Recursively process nested objects
      // @ts-ignore: Property assignment
      result[key] = redactSensitiveInfo(result[key], sensitiveKeys);
    }
  });

  return result as T;
}
