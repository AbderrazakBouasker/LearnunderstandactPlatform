import request from "supertest";
import { testApp } from "./helpers.js";
import { jest } from "@jest/globals";

// Set timeout for API tests
jest.setTimeout(10000);

describe("Feedback API", () => {
  const testUser = {
    username: "testuser",
    email: "test@example.com",
    password: "password123",
    role: "admin",
    organization: "testorg",
    organizationName: "Test Organization",
  };

  const testForm = {
    title: "Feedback Test Form",
    description: "This is a test form for feedback",
    opinion: ["dislike", "neutral", "like"],
    fields: [
      {
        label: "Name",
        type: "text",
      },
      {
        label: "Email",
        type: "email",
      },
      {
        label: "Comment",
        type: "textarea",
      },
    ],
    organization: "testorg",
  };

  const testFeedback = {
    opinion: "like",
    fields: [
      {
        label: "Name",
        value: "John Doe",
      },
      {
        label: "Email",
        value: "john@example.com",
      },
      {
        label: "Comment",
        value: "This is a great form!",
      },
    ],
  };

  let formId;
  let agent;

  beforeEach(async () => {
    // Use agent to maintain cookies across requests
    agent = request.agent(testApp);

    // Register user
    await agent.post("/api/auth/register").send(testUser);

    // Login to get cookies (auth uses cookies, not tokens)
    await agent.post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    // Create a form (requires authentication)
    const formRes = await agent.post("/api/form/create").send(testForm);

    if (formRes.statusCode !== 201) {
      throw new Error(
        `Form creation failed: ${formRes.statusCode} - ${JSON.stringify(formRes.body)}`
      );
    }

    formId = formRes.body._id;
  });

  describe("POST /api/feedback/:id", () => {
    it("should create feedback successfully", async () => {
      const res = await request(testApp)
        .post(`/api/feedback/${formId}`)
        .send(testFeedback);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe(
        "Feedback and Insight created successfully"
      );
    });

    it("should reject feedback for non-existent form", async () => {
      const res = await request(testApp)
        .post("/api/feedback/123456789012345678901234")
        .send(testFeedback);

      expect(res.statusCode).toBe(404);
    });

    it("should reject feedback with missing fields", async () => {
      const invalidFeedback = {
        opinion: "like",
        fields: [
          {
            label: "Name",
            value: "John Doe",
          },
          // Missing Email and Comment fields
        ],
      };

      const res = await request(testApp)
        .post(`/api/feedback/${formId}`)
        .send(invalidFeedback);

      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /api/feedback", () => {
    beforeEach(async () => {
      // Create a feedback for testing (no auth required)
      await request(testApp).post(`/api/feedback/${formId}`).send(testFeedback);
    });

    it("should get all feedbacks with authentication", async () => {
      const res = await agent.get("/api/feedback");

      expect([200, 204]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });

    it("should reject request without authentication", async () => {
      const res = await request(testApp).get("/api/feedback");

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/feedback/:id", () => {
    it("should handle invalid feedback ID", async () => {
      const res = await agent.get("/api/feedback/invalidid");

      expect(res.statusCode).toBe(500);
    });

    it("should handle non-existent feedback", async () => {
      const res = await agent.get("/api/feedback/123456789012345678901234");

      expect(res.statusCode).toBe(404);
    });
  });

  describe("GET /api/feedback/form/:id", () => {
    it("should get feedbacks by form ID", async () => {
      // Create feedback first (no auth required)
      await request(testApp).post(`/api/feedback/${formId}`).send(testFeedback);

      const res = await agent.get(`/api/feedback/form/${formId}`);

      expect([200, 204]).toContain(res.statusCode);
    });
  });

  describe("DELETE /api/feedback/:id/delete", () => {
    it("should handle non-existent feedback deletion", async () => {
      const res = await agent.delete(
        "/api/feedback/123456789012345678901234/delete"
      );

      expect(res.statusCode).toBe(404);
    });
  });
});
