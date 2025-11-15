/**
 * Environment variable validation and configuration
 * This file validates required environment variables and provides a centralized place for env configuration
 */

// Server-side environment variables
const serverEnv = {
  COURSES_FOLDER: process.env.COURSES_FOLDER,
  KAFKA_SERVER: process.env.KAFKA_SERVER,
  KAFKA_SERVER_PORT: process.env.KAFKA_SERVER_PORT,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GITHUB_ID: process.env.GITHUB_ID,
  GITHUB_SECRET: process.env.GITHUB_SECRET,
};

// Client-side environment variables (must have NEXT_PUBLIC_ prefix)
const clientEnv = {
  NEXT_PUBLIC_BASE_CDN_PATH: process.env.NEXT_PUBLIC_BASE_CDN_PATH,
};

// Required environment variables for production
const requiredInProduction = [
  'NEXTAUTH_SECRET',
];

// Optional environment variables with defaults
const optionalWithDefaults = {
  COURSES_FOLDER: '/Volumes/medianas/Videos',
  KAFKA_SERVER: '192.168.1.141',
  KAFKA_SERVER_PORT: '9092',
  NEXT_PUBLIC_BASE_CDN_PATH: 'http://192.168.1.141:5555',
};

/**
 * Validates environment variables
 * @param {boolean} strict - If true, throws error on missing required vars
 * @returns {Object} Validation result with missing and warnings
 */
function validateEnv(strict = false) {
  const missing = [];
  const warnings = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Check required variables in production
  if (isProduction) {
    requiredInProduction.forEach((key) => {
      if (!process.env[key]) {
        missing.push(key);
      }
    });
  }

  // Check for optional variables without defaults
  Object.keys(serverEnv).forEach((key) => {
    if (!process.env[key] && !optionalWithDefaults[key]) {
      warnings.push(`${key} is not set and has no default value`);
    }
  });

  // Log results
  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
    console.error(`[ENV] ERROR: ${errorMsg}`);

    if (strict) {
      throw new Error(errorMsg);
    }
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('[ENV] Warnings:');
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  // Log loaded env vars (excluding secrets)
  if (process.env.NODE_ENV !== 'test') {
    console.log('[ENV] Environment configuration loaded:');
    console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  - COURSES_FOLDER: ${process.env.COURSES_FOLDER || optionalWithDefaults.COURSES_FOLDER}`);
    console.log(`  - KAFKA_SERVER: ${process.env.KAFKA_SERVER || optionalWithDefaults.KAFKA_SERVER}`);
    console.log(`  - NEXT_PUBLIC_BASE_CDN_PATH: ${process.env.NEXT_PUBLIC_BASE_CDN_PATH || optionalWithDefaults.NEXT_PUBLIC_BASE_CDN_PATH}`);
    console.log(`  - NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || '(not set)'}`);
    console.log(`  - NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '***' : '(not set)'}`);
    console.log(`  - GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '***' : '(not set)'}`);
    console.log(`  - GITHUB_ID: ${process.env.GITHUB_ID ? '***' : '(not set)'}`);
  }

  return { missing, warnings };
}

// Validate on import (warn only, don't throw errors during build/startup)
if (typeof window === 'undefined') {
  // Only validate on server-side, but never throw during config loading
  // This ensures builds can complete even without all env vars set
  try {
    validateEnv(false); // Never throw, only warn
  } catch (err) {
    // Silently catch any errors during module loading
    console.warn('[ENV] Validation skipped during config loading');
  }
}

module.exports = {
  validateEnv,
  serverEnv,
  clientEnv,
};
