import request from 'supertest';
import { testApp, testUser, registerUser, loginUser } from './helpers.js';
import { jest } from '@jest/globals';

// Set longer timeout for API tests
jest.setTimeout(10000);

describe('Auth API', () => {
  
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await registerUser(testUser);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.role).toBe(testUser.role);
    });

    it('should fail if user with email already exists', async () => {
      // First create a user
      await registerUser(testUser);
      
      // Try to register with same email
      const res = await registerUser(testUser);
      
      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toBe('User already exists');
    });

    it('should fail if email is missing', async () => {
      const userWithoutEmail = {
        password: testUser.password,
        role: testUser.role
      };
      
      const res = await registerUser(userWithoutEmail);
      
      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error');
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
    });
    
    it('should login with valid credentials', async () => {
      const res = await loginUser({
        email: testUser.email,
        password: testUser.password
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should fail with invalid password', async () => {
      const res = await loginUser({
        email: testUser.email,
        password: 'wrongpassword'
      });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should fail with non-existent user', async () => {
      const res = await loginUser({
        email: 'nonexistent@example.com',
        password: 'password123'
      });
      
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });
});
