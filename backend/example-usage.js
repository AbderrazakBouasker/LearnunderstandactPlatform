import logger from './logger';

// In your API route handler or other code
function someFunction() {
  logger.info('User logged in successfully', { userId: '123', action: 'login' });
  
  try {
    // Some operation
    const result = doSomething();
    logger.debug('Operation completed', { result });
    return result;
  } catch (error) {
    logger.error('Failed to complete operation', { 
      error: error.message, 
      stack: error.stack 
    });
    throw error;
  }
}

// Add logs with different severity levels
logger.trace('Very detailed information');
logger.debug('Useful debugging information');
logger.info('Normal application behavior');
logger.warn('Warning: something might be wrong');
logger.error('Error: something failed', { error: 'details' });
logger.fatal('Fatal: serious error occurred');
