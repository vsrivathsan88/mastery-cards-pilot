/**
 * Security Configuration
 * Centralized security settings for child data protection
 */

export const securityConfig = {
  // CORS - Only allow frontend origin
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
  },

  // Helmet - Security headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },

  // Rate Limiting - Prevent abuse
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per minute
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Session - Encrypted session management
  session: {
    secret: process.env.SESSION_SECRET || 'change-this-in-production',
    name: 'simili.sid', // Don't use default 'connect.sid'
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      httpOnly: true, // Prevent XSS
      sameSite: 'strict' as const, // CSRF protection
      maxAge: parseInt(process.env.SESSION_MAX_AGE_MS || '3600000'), // 1 hour
    },
  },

  // Privacy
  privacy: {
    anonymizeLogs: process.env.ANONYMIZE_LOGS === 'true',
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '30'),
    minimalDataCollection: true,
  },
};
