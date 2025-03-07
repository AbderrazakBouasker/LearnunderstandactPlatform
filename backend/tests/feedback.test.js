import request from 'supertest';
import { testApp, testUser, registerUser, loginUser } from './helpers.js';
import { jest } from '@jest/globals';

// Set longer timeout for API tests
jest.setTimeout(10000);

describe('Feedback API', () => {
  let token;
  let userId;
  let formId;
  
  const testForm = {
    title: "Feedback Test Form",
    description: "This is a test form for feedback",
    opinion: ["dislike", "neutral", "like"],
    fields: [
      {
        label: "Name",
        type: "text"
      },
      {
        label: "Email",
        type: "email"
      },
      {
        label: "Comment",
        type: "textarea"
      }
    ]
  };
  
  const testFeedback = {
    opinion: "like",
    fields: [
      {
        label: "Name",
        value: "John Doe"
      },
      {
        label: "Email",
        value: "john@example.com"
      },
      {
        label: "Comment",
        value: "This is a great form!"
      }
    ]
  };
  
  beforeEach(async () => {
    // Register and login a user to get token
    await registerUser(testUser);
    const loginRes = await loginUser({
      email: testUser.email,
      password: testUser.password
    });
    
    token = loginRes.body.token;
    userId = loginRes.body.user._id;
    
    // Create a form to use for feedback tests
    const formRes = await request(testApp)
      .post('/form/create')
      .set('Authorization', `Bearer ${token}`)
      .send(testForm);
      
    formId = formRes.body._id;
  });
  
  describe('POST /feedback/:id', () => {
    it('should create a new feedback with valid token and data', async () => {
      // Note: This test assumes the route is enabled
      const res = await request(testApp)
        .post(`/feedback/${formId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(testFeedback);
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.formId).toBe(formId);
      expect(res.body.formTitle).toBe(testForm.title);
      expect(res.body.opinion).toBe(testFeedback.opinion);
      expect(res.body.fields.length).toBe(testFeedback.fields.length);
    });
    
    it('should fail if form does not exist', async () => {
      const res = await request(testApp)
        .post('/feedback/123456789012345678901234')
        .set('Authorization', `Bearer ${token}`)
        .send(testFeedback);
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toBe('Form not found');
    });
    
    it('should fail if field is missing', async () => {
      const invalidFeedback = {
        opinion: "like",
        fields: [
          {
            label: "Name",
            value: "John Doe"
          }
          // Missing Email and Comment fields
        ]
      };
      
      const res = await request(testApp)
        .post(`/feedback/${formId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(invalidFeedback);
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Missing field');
    });
    
    it('should fail with invalid field type', async () => {
      const invalidTypeFeedback = {
        opinion: "like",
        fields: [
          {
            label: "Name",
            value: "John Doe"
          },
          {
            label: "Email",
            value: 12345 // Should be a string
          },
          {
            label: "Comment",
            value: "This is a test comment"
          }
        ]
      };
      
      const res = await request(testApp)
        .post(`/feedback/${formId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(invalidTypeFeedback);
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Invalid type for field');
    });
  });
  
  describe('GET /feedback', () => {
    beforeEach(async () => {
      // Create a feedback for testing
      await request(testApp)
        .post(`/feedback/${formId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(testFeedback);
    });
    
    it('should get all feedbacks with valid token', async () => {
      const res = await request(testApp)
        .get('/feedback')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
    
    it('should return 204 if no feedbacks exist', async () => {
      // Delete all feedbacks first
      const allFeedbacks = await request(testApp)
        .get('/feedback')
        .set('Authorization', `Bearer ${token}`);
        
      if (allFeedbacks.body && Array.isArray(allFeedbacks.body)) {
        for (const feedback of allFeedbacks.body) {
          await request(testApp)
            .delete(`/feedback/${feedback._id}/delete`)
            .set('Authorization', `Bearer ${token}`);
        }
      }
      
      const res = await request(testApp)
        .get('/feedback')
        .set('Authorization', `Bearer ${token}`);
      
      // Should return 204 No Content
      expect(res.statusCode).toBe(204);
    });
    
    it('should fail without token', async () => {
      const res = await request(testApp).get('/feedback');
      expect(res.statusCode).toBe(403);
    });
  });
  
  describe('GET /feedback/:id', () => {
    let feedbackId;
    
    beforeEach(async () => {
      // Create a feedback for testing
      const feedbackRes = await request(testApp)
        .post(`/feedback/${formId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(testFeedback);
        
      feedbackId = feedbackRes.body._id;
    });
    
    it('should get feedback by ID with valid token', async () => {
      const res = await request(testApp)
        .get(`/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body._id).toBe(feedbackId);
      expect(res.body.formId).toBe(formId);
    });
    
    it('should fail with invalid feedback ID', async () => {
      const res = await request(testApp)
        .get('/feedback/invalidfeedbackid')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(500);
    });
    
    it('should fail when feedback does not exist', async () => {
      const res = await request(testApp)
        .get('/feedback/123456789012345678901234')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  describe('GET /feedback/form/:id', () => {
    beforeEach(async () => {
      // Create multiple feedbacks for the same form
      await request(testApp)
        .post(`/feedback/${formId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(testFeedback);
        
      await request(testApp)
        .post(`/feedback/${formId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...testFeedback,
          opinion: "neutral"
        });
    });
    
    it('should get all feedbacks for a form with valid token', async () => {
      const res = await request(testApp)
        .get(`/feedback/form/${formId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body[0].formId).toBe(formId);
    });
    
    it('should return 204 when form has no feedback', async () => {
      // Create a new form without feedback
      const newFormRes = await request(testApp)
        .post('/form/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...testForm,
          title: "Another Form"
        });
        
      const newFormId = newFormRes.body._id;
      
      const res = await request(testApp)
        .get(`/feedback/form/${newFormId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(204);
    });
  });
  
  describe('DELETE /feedback/:id/delete', () => {
    let feedbackId;
    
    beforeEach(async () => {
      // Create a feedback for testing
      const feedbackRes = await request(testApp)
        .post(`/feedback/${formId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(testFeedback);
        
      feedbackId = feedbackRes.body._id;
    });
    
    it('should delete feedback with valid token and ID', async () => {
      const res = await request(testApp)
        .delete(`/feedback/${feedbackId}/delete`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('feedback');
      expect(res.body.feedback._id).toBe(feedbackId);
      
      // Verify the feedback no longer exists
      const checkRes = await request(testApp)
        .get(`/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(checkRes.statusCode).toBe(404);
    });
    
    it('should fail when feedback does not exist', async () => {
      const res = await request(testApp)
        .delete('/feedback/123456789012345678901234/delete')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});
