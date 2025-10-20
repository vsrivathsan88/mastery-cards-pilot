import { Request, Response, NextFunction } from 'express';

/**
 * Privacy Middleware
 * Filters PII and sensitive data from logs and responses
 */

// Patterns that might contain PII
const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
  /\b\d{10,11}\b/g, // Phone numbers
];

/**
 * Anonymize text by replacing potential PII
 */
export function anonymizeText(text: string): string {
  let sanitized = text;
  
  PII_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  return sanitized;
}

/**
 * Middleware to sanitize request/response data
 */
export function privacyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to sanitize response
  res.json = function (body: any) {
    if (process.env.ANONYMIZE_LOGS === 'true') {
      // Sanitize any string fields in response
      body = sanitizeObject(body);
    }
    return originalJson(body);
  };

  next();
}

/**
 * Recursively sanitize object fields
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return anonymizeText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Never log these fields
      if (['password', 'token', 'apiKey', 'secret'].includes(key)) {
        sanitized[key] = '[HIDDEN]';
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Generate anonymous session ID
 */
export function generateAnonymousId(): string {
  // Use timestamp + random to create anonymous but traceable session ID
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `anon_${timestamp}_${random}`;
}
