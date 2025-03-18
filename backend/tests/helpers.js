import request from 'supertest';
import app from '../index.js';
import { mockLogger } from './setup.js';
import { jest } from '@jest/globals';

// Use the actual app for testing
const testApp = app;

// Helper for login requests
export const loginUser = async (credentials) => {
  return await request(testApp)
    .post('/api/auth/login')
    .send(credentials);
};

// Helper for register requests
export const registerUser = async (userData) => {
  return await request(testApp)
    .post('/api/auth/register')
    .send(userData);
};

// Helper for getting user data
export const getUser = async (userId, token) => {
  return await request(testApp)
    .get(`/api/user/${userId}`)
    .set('Authorization', `Bearer ${token}`);
};

// Helper for verifying log calls
export const verifyLogCalls = {
  error: (message = null, attributes = null) => {
    expect(mockLogger.error).toHaveBeenCalled();
    if (message) {
      expect(mockLogger.error).toHaveBeenCalledWith(
        message,
        attributes ? expect.objectContaining(attributes) : expect.anything()
      );
    }
  },
  info: (message = null, attributes = null) => {
    expect(mockLogger.info).toHaveBeenCalled();
    if (message) {
      expect(mockLogger.info).toHaveBeenCalledWith(
        message,
        attributes ? expect.objectContaining(attributes) : expect.anything()
      );
    }
  },
  warn: (message = null, attributes = null) => {
    expect(mockLogger.warn).toHaveBeenCalled();
    if (message) {
      expect(mockLogger.warn).toHaveBeenCalledWith(
        message,
        attributes ? expect.objectContaining(attributes) : expect.anything()
      );
    }
  },
  // Only check for controller errors, ignoring middleware logs
  noControllerErrors: () => {
    // Check if error was called with messages that aren't from middleware
    const errorCalls = mockLogger.error.mock.calls;
    const controllerErrors = errorCalls.filter(call => {
      const msg = call[0];
      return msg.includes('Error creating') || 
             msg.includes('Error retrieving') || 
             msg.includes('Error updating') || 
             msg.includes('Error deleting');
    });
    expect(controllerErrors.length).toBe(0);
  },
  // Only check for specific types of warnings
  noAuthWarnings: () => {
    const warnCalls = mockLogger.warn.mock.calls;
    const authWarnings = warnCalls.filter(call => {
      const msg = call[0];
      return msg.includes('Authorization attempt with missing token');
    });
    expect(authWarnings.length).toBe(0);
  },
  // Use this instead of notCalled() for API tests
  noBusinessErrors: () => {
    // Ignore "Request completed" logs from middleware
    const errorCalls = mockLogger.error.mock.calls.filter(call => {
      return call[0] !== "Request completed" && 
             !call[0].includes("Request received") &&
             !call[0].includes("Redis");
    });
    
    const warnCalls = mockLogger.warn.mock.calls.filter(call => {
      return call[0] !== "Request completed" && 
             !call[0].includes("Request received") &&
             !call[0].includes("Redis");
    });
    
    expect(errorCalls.length).toBe(0);
    expect(warnCalls.length).toBe(0);
  },
  notCalled: () => {
    expect(mockLogger.error).not.toHaveBeenCalled();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  }
};

// Test user data
export const testUser = {
  email: 'test@example.com',
  password: 'password123',
  role: 'admin'
};

export { testApp };
