import logger from './logger';

// 1. In Express middleware for request logging
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log at the beginning of the request
  logger.info('Request received', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Log when the response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    logger[logLevel]('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: duration,
    });
  });

  next();
};

// 2. In authentication middleware
export const authLogger = (req, res, next) => {
  try {
    // Authentication logic here
    const userId = req.user?.id || 'anonymous';
    
    logger.info('User authenticated', {
      userId,
      method: req.method,
      path: req.path
    });
    
    next();
  } catch (error) {
    logger.error('Authentication failed', {
      error: error.message,
      stack: error.stack,
      path: req.path
    });
    
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// 3. In error handling middleware
export const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled exception', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    body: req.body
  });
  
  res.status(500).json({ message: 'Internal server error' });
};

// 4. In database operations
export const logDatabaseOperation = async (operation, collection, query) => {
  try {
    const start = Date.now();
    const result = await operation();
    const duration = Date.now() - start;
    
    logger.debug('Database operation completed', {
      collection,
      operation: operation.name,
      query: JSON.stringify(query),
      duration,
      success: true
    });
    
    return result;
  } catch (error) {
    logger.error('Database operation failed', {
      collection,
      operation: operation.name,
      query: JSON.stringify(query),
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
};

// 5. In business logic
export const processUserAction = (userId, action, data) => {
  logger.info('Processing user action', {
    userId,
    action,
    data: JSON.stringify(data)
  });
  
  try {
    // Business logic here
    const result = performAction(action, data);
    
    logger.info('User action completed successfully', {
      userId,
      action,
      result: typeof result === 'object' ? JSON.stringify(result) : result
    });
    
    return result;
  } catch (error) {
    logger.error('User action failed', {
      userId,
      action,
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
};
