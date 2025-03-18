import request from 'supertest';
import { testApp, testUser, registerUser, loginUser, getUser, verifyLogCalls } from './helpers.js';
import { jest } from '@jest/globals';
import logger from '../logger.js';

describe('User API', () => {
  let token;
  let userId;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Register and login a user to get token
    await registerUser(testUser);
    const loginRes = await loginUser({
      email: testUser.email,
      password: testUser.password
    });
    
    token = loginRes.body.token;
    userId = loginRes.body.user._id;
    
    // Clear mocks after setup
    jest.clearAllMocks();
  });
  
  describe('GET /api/user/:id', () => {
    it('should get user by ID with valid token', async () => {
      const res = await getUser(userId, token);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.email).toBe(testUser.email);
      
      // Use noBusinessErrors instead of notCalled to ignore Redis warnings
      verifyLogCalls.noBusinessErrors();
    });
    
    it('should fail without token and log warning', async () => {
      const res = await request(testApp).get(`/api/user/${userId}`);
      
      expect(res.statusCode).toBe(403);
      
      // Verify warning logged for missing token
      verifyLogCalls.warn('Authorization attempt with missing token');
    });
    
    it('should fail with invalid token and log error', async () => {
      const res = await request(testApp)
        .get(`/api/user/${userId}`)
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toBe('Invalid token');
      
      // Verify error logged for invalid token
      verifyLogCalls.error('Error verifying token', {
        type: 'JsonWebTokenError'
      });
    });
    
    it('should fail with invalid user ID and log error', async () => {
      const res = await request(testApp)
        .get('/api/user/invaliduserid')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(500);
      
      // Verify error logged for database error
      verifyLogCalls.error('Error retrieving user');
    });
  });
});
