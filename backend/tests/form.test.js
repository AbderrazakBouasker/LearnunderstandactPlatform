import request from 'supertest';
import { testApp, testUser, registerUser, loginUser } from './helpers.js';
import { jest } from '@jest/globals';

// Set longer timeout for API tests
jest.setTimeout(10000);

describe('Form API', () => {
  let token;
  let userId;
  
  const testForm = {
    title: "Test Form",
    description: "This is a test form",
    opinion: ["dislike", "neutral", "like"],
    fields: [
      {
        label: "Full Name",
        type: "text"
      },
      {
        label: "Email Address",
        type: "email"
      },
      {
        label: "Birth Date",
        type: "date"
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
  });
  
  describe('POST /form/create', () => {
    it('should create a new form with valid token', async () => {
      const res = await request(testApp)
        .post('/form/create')
        .set('Authorization', `Bearer ${token}`)
        .send(testForm);
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toBe(testForm.title);
      expect(res.body.description).toBe(testForm.description);
      expect(res.body.fields.length).toBe(testForm.fields.length);
    });
    
    it('should fail without token', async () => {
      const res = await request(testApp)
        .post('/form/create')
        .send(testForm);
      
      expect(res.statusCode).toBe(403);
    });
    
    it('should fail with invalid form data', async () => {
      const invalidForm = {
        // Missing required title
        description: "Invalid form",
        fields: []
      };
      
      const res = await request(testApp)
        .post('/form/create')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidForm);
      
      expect(res.statusCode).toBe(500);
    });
  });
  
  describe('GET /form', () => {
    it('should get all forms with valid token', async () => {
      // First create a form
      await request(testApp)
        .post('/form/create')
        .set('Authorization', `Bearer ${token}`)
        .send(testForm);
      
      const res = await request(testApp)
        .get('/form')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
    
    it('should return 204 if no forms exist', async () => {
      // Assuming no forms exist yet
      const res = await request(testApp)
        .get('/form')
        .set('Authorization', `Bearer ${token}`);
      
      // Should return 204 No Content or 200 with empty array
      expect([200, 204]).toContain(res.statusCode);
    });
    
    it('should fail without token', async () => {
      const res = await request(testApp).get('/form');
      expect(res.statusCode).toBe(403);
    });
  });
  
  describe('GET /form/:id', () => {
    it('should get form by ID with valid token', async () => {
      // First create a form
      const createRes = await request(testApp)
        .post('/form/create')
        .set('Authorization', `Bearer ${token}`)
        .send(testForm);
      
      const formId = createRes.body._id;
      
      const res = await request(testApp)
        .get(`/form/${formId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body._id).toBe(formId);
      expect(res.body.title).toBe(testForm.title);
    });
    
    it('should fail with invalid form ID', async () => {
      const res = await request(testApp)
        .get('/form/invalidformid')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(500);
    });
    
    it('should fail when form does not exist', async () => {
      const res = await request(testApp)
        .get('/form/123456789012345678901234') // Valid ObjectId format but doesn't exist
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  describe('PATCH /form/:id/edit', () => {
    it('should update form with valid token and data', async () => {
      // First create a form
      const createRes = await request(testApp)
        .post('/form/create')
        .set('Authorization', `Bearer ${token}`)
        .send(testForm);
      
      const formId = createRes.body._id;
      const updatedData = {
        title: "Updated Form Title",
        fields: [
          {
            label: "New Field",
            type: "textarea"
          }
        ]
      };
      
      const res = await request(testApp)
        .patch(`/form/${formId}/edit`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe(updatedData.title);
      expect(res.body.fields.length).toBe(1);
      expect(res.body.fields[0].label).toBe("New Field");
    });
    
    it('should fail when form does not exist', async () => {
      const res = await request(testApp)
        .patch('/form/123456789012345678901234/edit')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: "New Title" });
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  describe('DELETE /form/:id/delete', () => {
    it('should delete form with valid token and ID', async () => {
      // First create a form
      const createRes = await request(testApp)
        .post('/form/create')
        .set('Authorization', `Bearer ${token}`)
        .send(testForm);
      
      const formId = createRes.body._id;
      
      const res = await request(testApp)
        .delete(`/form/${formId}/delete`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('deletedForm');
      expect(res.body.deletedForm._id).toBe(formId);
      
      // Verify the form no longer exists
      const checkRes = await request(testApp)
        .get(`/form/${formId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(checkRes.statusCode).toBe(404);
    });
    
    it('should fail when form does not exist', async () => {
      const res = await request(testApp)
        .delete('/form/123456789012345678901234/delete')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});
