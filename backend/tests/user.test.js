import request from "supertest";
import { testApp } from "./helpers.js";
import { jest } from "@jest/globals";

// Set timeout for API tests
jest.setTimeout(10000);

describe("User API", () => {
  const testUser = {
    username: "testuser",
    email: "test@example.com",
    password: "password123",
    role: "admin",
    organization: "testorg",
    organizationName: "Test Organization",
  };

  let agent;
  let userId;

  beforeEach(async () => {
    // Use agent to maintain cookies across requests
    agent = request.agent(testApp);

    // Register user
    const registerRes = await agent.post("/api/auth/register").send(testUser);
    userId = registerRes.body._id;

    // Login to get cookies (auth uses cookies, not tokens)
    await agent.post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });
  });

  describe("GET /api/user/:id", () => {
    it("should get user by ID with authentication", async () => {
      const res = await agent.get(`/api/user/${userId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.username).toBe(testUser.username);
      expect(res.body).not.toHaveProperty("password");
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp).get(`/api/user/${userId}`);

      expect(res.statusCode).toBe(403);
    });

    it("should handle invalid user ID", async () => {
      const res = await agent.get("/api/user/invaliduserid");

      expect(res.statusCode).toBe(500);
    });

    it("should handle non-existent user", async () => {
      const res = await agent.get("/api/user/123456789012345678901234");

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe(null);
    });
  });

  describe("GET /api/user/me", () => {
    it("should get current user profile with authentication", async () => {
      const res = await agent.get("/api/user/me");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.username).toBe(testUser.username);
      // Verify sensitive fields are removed
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).not.toHaveProperty("__v");
      expect(res.body).not.toHaveProperty("createdAt");
      expect(res.body).not.toHaveProperty("updatedAt");
      expect(res.body).not.toHaveProperty("role");
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp).get("/api/user/me");

      expect(res.statusCode).toBe(403);
    });
  });

  describe("POST /api/user/:id (update)", () => {
    it("should update user with valid current password", async () => {
      const updateData = {
        username: "updateduser",
        currentPassword: testUser.password,
      };

      const res = await agent.post(`/api/user/${userId}`).send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe("User updated successfully");

      // Verify the update worked
      const userRes = await agent.get(`/api/user/${userId}`);
      expect(userRes.body.username).toBe("updateduser");
    });

    it("should update email with valid current password", async () => {
      const updateData = {
        email: "newemail@example.com",
        currentPassword: testUser.password,
      };

      const res = await agent.post(`/api/user/${userId}`).send(updateData);

      expect(res.statusCode).toBe(200);
    });

    it("should update password with valid current password", async () => {
      const updateData = {
        password: "newpassword123",
        currentPassword: testUser.password,
      };

      const res = await agent.post(`/api/user/${userId}`).send(updateData);

      expect(res.statusCode).toBe(200);
    });

    it("should fail without current password", async () => {
      const updateData = {
        username: "updateduser",
        // Missing currentPassword
      };

      const res = await agent.post(`/api/user/${userId}`).send(updateData);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe(
        "Current password is required for any account modifications"
      );
    });

    it("should fail with incorrect current password", async () => {
      const updateData = {
        username: "updateduser",
        currentPassword: "wrongpassword",
      };

      const res = await agent.post(`/api/user/${userId}`).send(updateData);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Current password is incorrect");
    });

    it("should fail when updating to existing username", async () => {
      // Create another user first
      const anotherUser = {
        username: "anotheruser",
        email: "another@example.com",
        password: "password123",
        role: "user",
        organization: "testorg",
        organizationName: "Test Organization",
      };

      await request(testApp).post("/api/auth/register").send(anotherUser);

      const updateData = {
        username: "anotheruser", // Try to use existing username
        currentPassword: testUser.password,
      };

      const res = await agent.post(`/api/user/${userId}`).send(updateData);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Username already exists");
    });

    it("should fail when updating to existing email", async () => {
      // Create another user first
      const anotherUser = {
        username: "anotheruser2",
        email: "another2@example.com",
        password: "password123",
        role: "user",
        organization: "testorg",
        organizationName: "Test Organization",
      };

      await request(testApp).post("/api/auth/register").send(anotherUser);

      const updateData = {
        email: "another2@example.com", // Try to use existing email
        currentPassword: testUser.password,
      };

      const res = await agent.post(`/api/user/${userId}`).send(updateData);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Email already exists");
    });

    it("should fail when user does not exist", async () => {
      const updateData = {
        username: "updateduser",
        currentPassword: testUser.password,
      };

      const res = await agent
        .post("/api/user/123456789012345678901234")
        .send(updateData);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("should fail without authentication", async () => {
      const updateData = {
        username: "updateduser",
        currentPassword: testUser.password,
      };

      const res = await request(testApp)
        .post(`/api/user/${userId}`)
        .send(updateData);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("POST /api/user/:id/addtoorganization", () => {
    it("should add user to organization with authentication", async () => {
      const orgData = {
        organizationIdentifier: "neworg",
      };

      const res = await agent
        .post(`/api/user/${userId}/addtoorganization`)
        .send(orgData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe("User added to organization successfully");
    });

    it("should fail when organization identifier is missing", async () => {
      const res = await agent
        .post(`/api/user/${userId}/addtoorganization`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Organization identifier is required");
    });

    it("should fail when user is already in organization", async () => {
      const orgData = {
        organizationIdentifier: "testorg", // User is already in this org
      };

      const res = await agent
        .post(`/api/user/${userId}/addtoorganization`)
        .send(orgData);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("User already in this organization");
    });

    it("should fail when user does not exist", async () => {
      const orgData = {
        organizationIdentifier: "neworg",
      };

      const res = await agent
        .post("/api/user/123456789012345678901234/addtoorganization")
        .send(orgData);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("should fail without authentication", async () => {
      const orgData = {
        organizationIdentifier: "neworg",
      };

      const res = await request(testApp)
        .post(`/api/user/${userId}/addtoorganization`)
        .send(orgData);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("POST /api/user/:id/deletefromorganization", () => {
    beforeEach(async () => {
      // Add user to an additional organization for testing removal
      await agent
        .post(`/api/user/${userId}/addtoorganization`)
        .send({ organizationIdentifier: "temporg" });
    });

    it("should remove user from organization with authentication", async () => {
      const orgData = {
        organizationIdentifier: "temporg",
      };

      const res = await agent
        .post(`/api/user/${userId}/deletefromorganization`)
        .send(orgData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe("User removed from organization successfully");
    });

    it("should fail when organization identifier is missing", async () => {
      const res = await agent
        .post(`/api/user/${userId}/deletefromorganization`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Organization identifier is required");
    });

    it("should fail when user is not in organization", async () => {
      const orgData = {
        organizationIdentifier: "nonexistentorg",
      };

      const res = await agent
        .post(`/api/user/${userId}/deletefromorganization`)
        .send(orgData);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("User not in this organization");
    });

    it("should fail when user does not exist", async () => {
      const orgData = {
        organizationIdentifier: "temporg",
      };

      const res = await agent
        .post("/api/user/123456789012345678901234/deletefromorganization")
        .send(orgData);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("should fail without authentication", async () => {
      const orgData = {
        organizationIdentifier: "temporg",
      };

      const res = await request(testApp)
        .post(`/api/user/${userId}/deletefromorganization`)
        .send(orgData);

      expect(res.statusCode).toBe(403);
    });
  });
});
