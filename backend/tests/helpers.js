import request from 'supertest';
import app from '../index.js';

// Use the actual app for testing
const testApp = app;

// Helper for login requests
export const loginUser = async (credentials) => {
  return await request(testApp)
    .post('/auth/login')
    .send(credentials);
};

// Helper for register requests
export const registerUser = async (userData) => {
  return await request(testApp)
    .post('/auth/register')
    .send(userData);
};

// Helper for getting user data
export const getUser = async (userId, token) => {
  return await request(testApp)
    .get(`/user/${userId}`)
    .set('Authorization', `Bearer ${token}`);
};

// Test user data
export const testUser = {
  email: 'test@example.com',
  password: 'password123',
  role: 'admin'
};

export { testApp };
