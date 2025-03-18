/**
 * Test file for rate limiter middleware
 */

// Mock logger BEFORE importing the module
jest.mock('../logger.js', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));

// Mock ioredis BEFORE any imports
jest.mock('ioredis', () => {
  // Create a mock EventEmitter class for Redis
  class MockRedisClient {
    constructor() {
      this.status = 'ready';
      this.on = jest.fn();
      this.zrangebyscore = jest.fn().mockResolvedValue([]);
      this.zadd = jest.fn().mockResolvedValue(1);
      this.expire = jest.fn().mockResolvedValue(1);
      this.quit = jest.fn().mockResolvedValue(null);
    }
  }
  
  return {
    Redis: jest.fn(() => new MockRedisClient())
  };
});

// Now import the module using Redis and logger
import { redisClient, rateLimiter } from './ratelimiter.js';
import logger from '../logger.js';

describe('Rate Limiter Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  afterAll(() => {
    redisClient.quit();
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup test doubles
    mockReq = { 
      ip: '127.0.0.1',
      path: '/test-path',
      method: 'GET'
    };
    mockRes = { 
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    
    // Use the same client from ratelimiter.js
    redisClient.status = 'ready';
    redisClient.zrangebyscore.mockResolvedValue([]);
    redisClient.zadd.mockResolvedValue(1);
    redisClient.expire.mockResolvedValue(1);
  });

  it('should skip rate limiting if Redis is not connected', async () => {
    // Set Redis status as not ready
    redisClient.status = 'connecting';
    
    // Call middleware
    const middleware = rateLimiter(1, 5);
    await middleware(mockReq, mockRes, mockNext);
    
    // Verify next was called and Redis methods were not
    expect(mockNext).toHaveBeenCalled();
    expect(redisClient.zrangebyscore).not.toHaveBeenCalled();
    expect(redisClient.zadd).not.toHaveBeenCalled();
    
    // Verify the warning was logged - ONLY check logger, not console
    expect(logger.warn).toHaveBeenCalledWith('Redis not connected, skipping rate limiting', {
      redisStatus: 'connecting',
      path: mockReq.path,
      ip: mockReq.ip
    });
  });

  it('should allow request when under rate limit', async () => {
    // Simulate having 3 requests in history (under the limit of 5)
    redisClient.zrangebyscore.mockResolvedValue(['1', '2', '3']);
    
    // Call middleware with windowsize=1, maxrequests=5
    const middleware = rateLimiter(1, 5);
    await middleware(mockReq, mockRes, mockNext);
    
    // Verify the request was allowed
    expect(mockNext).toHaveBeenCalled();
    expect(redisClient.zadd).toHaveBeenCalled();
    expect(redisClient.expire).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    
    // Verify no logs were created in the normal path
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should block request when over rate limit', async () => {
    // Simulate having 5 requests in history (at the limit)
    redisClient.zrangebyscore.mockResolvedValue(['1', '2', '3', '4', '5']);
    
    // Call middleware with windowsize=1, maxrequests=5
    const middleware = rateLimiter(1, 5);
    await middleware(mockReq, mockRes, mockNext);
    
    // Verify the request was blocked
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Too many requests, try again later.' });
    // zadd should not be called when rate limit is exceeded
    expect(redisClient.zadd).not.toHaveBeenCalled();
    // Verify rate limit warning was logged
    expect(logger.warn).toHaveBeenCalledWith('Rate limit exceeded', {
      ip: mockReq.ip, 
      path: mockReq.path, 
      method: mockReq.method,
      requestCount: 5,
      limit: 5,
      windowSize: '1 minutes'
    });
  });

  it('should allow request when Redis operations time out', async () => {
    // Simulate Redis timeout
    redisClient.zrangebyscore.mockImplementation(() => {
      return new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Redis operation timed out')), 4000);
      });
    });
    
    // Mock setTimeout to immediately trigger timeout
    jest.useFakeTimers();
    
    // Call middleware
    const middleware = rateLimiter(1, 5);
    const middlewarePromise = middleware(mockReq, mockRes, mockNext);
    
    // Fast-forward time to trigger timeout
    jest.advanceTimersByTime(3500);
    
    // Resolve promises
    await middlewarePromise;
    
    // Verify request was allowed despite timeout
    expect(mockNext).toHaveBeenCalled();
    
    // Restore timers
    jest.useRealTimers();
  });

  it('should allow request when Redis throws an error', async () => {
    // Simulate Redis error
    const redisError = new Error('Redis error');
    redisClient.zrangebyscore.mockRejectedValue(redisError);
    
    // Call middleware
    const middleware = rateLimiter(1, 5);
    await middleware(mockReq, mockRes, mockNext);
    
    // Verify request was allowed despite error
    expect(mockNext).toHaveBeenCalled();
    expect(redisClient.zadd).not.toHaveBeenCalled();
    // Verify error was logged with logger, not console
    expect(logger.error).toHaveBeenCalledWith('Rate limiter error', expect.objectContaining({
      error: 'Redis error',
      ip: mockReq.ip,
      path: mockReq.path,
      method: mockReq.method
    }));
  });

  it('should use correct window size and max requests', async () => {
    // Call middleware with custom windowsize=2, maxrequests=10
    const middleware = rateLimiter(2, 10);
    await middleware(mockReq, mockRes, mockNext);
    
    // Expected window size in ms (2 minutes)
    const expectedWindowSize = 2 * 60 * 1000;
    
    // Verify correct window parameters were used
    expect(redisClient.zrangebyscore).toHaveBeenCalledWith(
      mockReq.ip,
      expect.any(Number),
      expect.any(Number)
    );
    
    // Verify window calculations
    const callArgs = redisClient.zrangebyscore.mock.calls[0];
    const minTime = callArgs[1];
    const maxTime = callArgs[2];
    
    // Check that the time window is approximately correct
    expect(maxTime - minTime).toBeCloseTo(expectedWindowSize, -2); // Allow some tolerance
    
    // Check that expire was called with correct TTL (in seconds)
    expect(redisClient.expire).toHaveBeenCalledWith(mockReq.ip, expectedWindowSize / 1000);
  });

  it('should log errors when Redis operations fail', async () => {
    // Simulate Redis error
    const redisError = new Error('Redis error');
    redisClient.zrangebyscore.mockRejectedValue(redisError);
    
    // Call middleware
    const middleware = rateLimiter(1, 5);
    await middleware(mockReq, mockRes, mockNext);
    
    // Verify request was allowed despite error and error was logged
    expect(mockNext).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('Rate limiter error', {
      error: redisError.message,
      stack: expect.any(String),
      ip: mockReq.ip,
      path: mockReq.path,
      method: mockReq.method,
      redisStatus: 'ready'
    });
  });
});
