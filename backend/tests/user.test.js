import request from 'supertest';
import { testApp, testUser, registerUser, loginUser, getUser } from './helpers.js';

describe('User API', () => {
  let token;
  let userId;
  
  beforeEach(async () => {
    // Register and login a user to get token
    await registerUser(testUser);
    const loginRes = await loginUser({
      email: testUser.email,
      password: testUser.password
    });
    
    token = loginRes.body.token;
    userId = loginRes.body.user._id;
  });
  
  describe('GET /user/:id', () => {
    it('should get user by ID with valid token', async () => {
      const res = await getUser(userId, token);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.email).toBe(testUser.email);
    });
    
    it('should fail without token', async () => {
      const res = await request(testApp).get(`/user/${userId}`);
      
      expect(res.statusCode).toBe(403);
    });
    
    it('should fail with invalid token', async () => {
      const res = await request(testApp)
        .get(`/user/${userId}`)
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(res.statusCode).toBe(500);
    });
  });
});
