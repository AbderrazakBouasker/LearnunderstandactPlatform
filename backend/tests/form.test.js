import request from "supertest";
import { testApp } from "./helpers.js";
import { jest } from "@jest/globals";

// Set timeout for API tests
jest.setTimeout(10000);

describe("Form API", () => {
  const testUser = {
    username: "testuser",
    email: "test@example.com",
    password: "password123",
    role: "admin",
    organization: "testorg",
    organizationName: "Test Organization",
  };

  const testForm = {
    title: "Test Form",
    description: "This is a test form",
    opinion: ["dislike", "neutral", "like"],
    fields: [
      {
        label: "Full Name",
        type: "text",
      },
      {
        label: "Email Address",
        type: "email",
      },
      {
        label: "Birth Date",
        type: "date",
      },
    ],
    organization: "testorg",
  };

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
  });

  describe("POST /api/form/create", () => {
    it("should create a new form with authentication", async () => {
      const res = await agent.post("/api/form/create").send(testForm);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.title).toBe(testForm.title);
      expect(res.body.description).toBe(testForm.description);
      expect(res.body.fields.length).toBe(testForm.fields.length);
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp)
        .post("/api/form/create")
        .send(testForm);

      expect(res.statusCode).toBe(403);
    });

    it("should fail with invalid form data", async () => {
      const invalidForm = {
        // Missing required title
        description: "Invalid form",
        fields: [],
      };

      const res = await agent.post("/api/form/create").send(invalidForm);

      expect(res.statusCode).toBe(500);
    });
  });

  describe("GET /api/form", () => {
    it("should get all forms with authentication", async () => {
      // First create a form
      await agent.post("/api/form/create").send(testForm);

      const res = await agent.get("/api/form");

      expect([200, 204]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp).get("/api/form");
      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/form/:id", () => {
    it("should get form by ID (no authentication required)", async () => {
      // First create a form
      const createRes = await agent.post("/api/form/create").send(testForm);

      const formId = createRes.body._id;

      // Note: GET /api/form/:id doesn't require authentication according to routes
      const res = await request(testApp).get(`/api/form/${formId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(res.body._id).toBe(formId);
      expect(res.body.title).toBe(testForm.title);
    });

    it("should handle invalid form ID", async () => {
      const res = await request(testApp).get("/api/form/invalidformid");

      expect(res.statusCode).toBe(500);
    });

    it("should handle non-existent form", async () => {
      const res = await request(testApp).get(
        "/api/form/123456789012345678901234"
      );

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("PATCH /api/form/:id/edit", () => {
    it("should update form with authentication", async () => {
      // First create a form
      const createRes = await agent.post("/api/form/create").send(testForm);

      const formId = createRes.body._id;
      const updatedData = {
        title: "Updated Form Title",
        fields: [
          {
            label: "New Field",
            type: "textarea",
          },
        ],
      };

      const res = await agent
        .patch(`/api/form/${formId}/edit`)
        .send(updatedData);

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe(updatedData.title);
      expect(res.body.fields.length).toBe(1);
      expect(res.body.fields[0].label).toBe("New Field");
    });

    it("should fail when form does not exist", async () => {
      const res = await agent
        .patch("/api/form/123456789012345678901234/edit")
        .send({ title: "New Title" });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("error");
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp)
        .patch("/api/form/123456789012345678901234/edit")
        .send({ title: "New Title" });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("DELETE /api/form/:id/delete", () => {
    it("should delete form with authentication", async () => {
      // First create a form
      const createRes = await agent.post("/api/form/create").send(testForm);

      const formId = createRes.body._id;

      const res = await agent.delete(`/api/form/${formId}/delete`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("deletedForm");
      expect(res.body.deletedForm._id).toBe(formId);

      // Verify the form no longer exists
      const checkRes = await request(testApp).get(`/api/form/${formId}`);
      expect(checkRes.statusCode).toBe(404);
    });

    it("should fail when form does not exist", async () => {
      const res = await agent.delete(
        "/api/form/123456789012345678901234/delete"
      );

      expect(res.statusCode).toBe(404);
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp).delete(
        "/api/form/123456789012345678901234/delete"
      );

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/form/organization/:organization", () => {
    it("should get forms by organization with authentication", async () => {
      // First create a form
      await agent.post("/api/form/create").send(testForm);

      const res = await agent.get("/api/form/organization/testorg");

      expect([200, 204]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        // Verify all returned forms belong to the organization
        res.body.forEach((form) => {
          expect(form.organization).toBe("testorg");
        });
      }
    });

    it("should return 204 for organization with no forms", async () => {
      const res = await agent.get("/api/form/organization/nonexistentorg");

      expect(res.statusCode).toBe(204);
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp).get("/api/form/organization/testorg");

      expect(res.statusCode).toBe(403);
    });
  });
});
