import request from 'supertest';
import { testApp, testUser, registerUser, loginUser, verifyLogCalls } from './helpers.js';
import { jest } from '@jest/globals';
import logger from '../logger.js';

// Set longer timeout for API tests
jest.setTimeout(10000);

describe('Auth API', () => {
  
  beforeEach(() => {
    // Clear logger mocks before each test
    jest.clearAllMocks();
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user and log successful registration', async () => {
      const res = await registerUser(testUser);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.role).toBe(testUser.role);
      
      // Verify no errors were logged
      verifyLogCalls.noBusinessErrors();
    });

    it('should fail if user with email already exists and log attempt', async () => {
      // First create a user
      await registerUser(testUser);
      
      // Clear mocks to test only the second call
      jest.clearAllMocks();
      
      // Try to register with same email
      const res = await registerUser(testUser);
      
      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toBe('User already exists');
      
      // No error should be logged for this expected condition
      verifyLogCalls.noBusinessErrors();
    });

    it('should fail if email is missing and log error', async () => {
      const userWithoutEmail = {
        password: testUser.password,
        role: testUser.role
      };
      
      const res = await registerUser(userWithoutEmail);
      
      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error');
      
      // Verify error was logged
      verifyLogCalls.error();
    });

    it('should fail if password is missing', async () => {
      const userWithoutPassword = {
        email: 'no-password@example.com',
        role: testUser.role
      };
      
      const res = await registerUser(userWithoutPassword);
      
      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error');
    });

    // it('should fail with invalid email format', async () => {
    //   const userWithInvalidEmail = {
    //     email: 'not-an-email',
    //     password: testUser.password,
    //     role: testUser.role
    //   };
      
    //   const res = await registerUser(userWithInvalidEmail);
      
    //   expect(res.statusCode).toBe(500);
    //   expect(res.body).toHaveProperty('error');
    // });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user before each login test
      await registerUser(testUser);
      jest.clearAllMocks(); // Clear mocks after registration
    });
    
    it('should login with valid credentials and log success', async () => {
      const res = await loginUser({
        email: testUser.email,
        password: testUser.password
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      
      // Verify success was logged
      verifyLogCalls.info('User logged in successfully', {
        email: testUser.email
      });
    });

    it('should fail with invalid password without logging error', async () => {
      const res = await loginUser({
        email: testUser.email,
        password: 'wrongpassword'
      });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
      
      // Verify no errors were logged for this expected condition
      verifyLogCalls.noBusinessErrors();
    });

    it('should fail with non-existent user without logging error', async () => {
      const res = await loginUser({
        email: 'nonexistent@example.com',
        password: 'password123'
      });
      
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found');
      
      // Verify no errors were logged for this expected condition
      verifyLogCalls.noBusinessErrors();
    });
  });
});
