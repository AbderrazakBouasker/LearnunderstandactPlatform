import { Redis } from 'ioredis';

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
  console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Custom Rate Limiting Middleware Sliding Window allows a max burst followed by a gradual refill
export const rateLimiter = (windowsize = 1, maxrequests = 5) => {
    return async (req, res, next) => {
    try {
        // Skip rate limiting if Redis is not connected
        if (redisClient.status !== 'ready') {
            console.warn('Redis not connected, skipping rate limiting');
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
        console.error(`Rate limiter error:`, error);
        // On error, allow the request to proceed to avoid blocking legitimate users
        next();
    }
}};
