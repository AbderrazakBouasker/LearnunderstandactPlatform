import { Redis } from 'ioredis';
import logger from '../logger.js';

// Create Redis client with connection timeout and retry strategy
export const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  connectTimeout: 10000, // 10 second timeout
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Add event listeners to track connection state
redisClient.on('error', (err) => {
    logger.error('Redis connection error:', {
      error: err.message,
      stack: err.stack,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      retryAttempt: redisClient.status === 'reconnecting' ? 'yes' : 'no'
    });
});

redisClient.on('connect', () => {
    logger.info('Connected to Redis', {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    });
});

// Custom Rate Limiting Middleware Sliding Window allows a max burst followed by a gradual refill
export const rateLimiter = (windowsize = 1, maxrequests = 5) => {
    return async (req, res, next) => {
    try {
        // Skip rate limiting if Redis is not connected
        if (redisClient.status !== 'ready') {
            logger.warn('Redis not connected, skipping rate limiting', {
              redisStatus: redisClient.status,
              path: req.path,
              ip: req.ip
            });
            return next();
        }

        const ip = req.ip;
        const now = Date.now();
        const windowSize = windowsize * 60 * 1000;
        const maxRequests = maxrequests;
        
        // Use Promise.race with timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
            const timer = setTimeout(() => reject(new Error('Redis operation timed out')), 3000);
            timer.unref();
        });

        // Fetch request history with timeout
        const requests = await Promise.race([
            redisClient.zrangebyscore(ip, now - windowSize, now),
            timeoutPromise
        ]);

        if (requests.length >= maxRequests) {
            logger.warn('Rate limit exceeded', {
              ip: req.ip, 
              path: req.path, 
              method: req.method,
              requestCount: requests.length,
              limit: maxRequests,
              windowSize: `${windowsize} minutes`
            });
            return res.status(429).json({ message: 'Too many requests, try again later.' });
        }

        // Add new request with timeout
        await Promise.race([
            Promise.all([
                redisClient.zadd(ip, now, now.toString()),
                redisClient.expire(ip, windowSize / 1000)
            ]),
            timeoutPromise
        ]);
        
        next();
    } catch (error) {
        logger.error('Rate limiter error', {
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            path: req.path,
            method: req.method,
            redisStatus: redisClient.status
        });
        // On error, allow the request to proceed to avoid blocking legitimate users
        next();
    }
}};
