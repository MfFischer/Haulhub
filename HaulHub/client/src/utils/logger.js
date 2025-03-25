import * as Sentry from "@sentry/react";

// Log levels
const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

// Initialize Sentry
if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}

class Logger {
  static debug(message, extra = {}) {
    console.debug(message, extra);
    if (process.env.NODE_ENV === 'development') {
      console.debug('[DEBUG]', message, extra);
    }
  }

  static info(message, extra = {}) {
    console.info('[INFO]', message, extra);
    Sentry.addBreadcrumb({
      category: 'info',
      message,
      data: extra,
      level: 'info',
    });
  }

  static warn(message, extra = {}) {
    console.warn('[WARN]', message, extra);
    Sentry.addBreadcrumb({
      category: 'warning',
      message,
      data: extra,
      level: 'warning',
    });
  }

  static error(error, extra = {}) {
    console.error('[ERROR]', error, extra);
    Sentry.captureException(error, {
      extra,
    });
  }

  static navigation(from, to, extra = {}) {
    this.info(`Navigation: ${from} → ${to}`, extra);
  }
}

export default Logger;