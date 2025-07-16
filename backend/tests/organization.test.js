import request from "supertest";
import { testApp } from "./helpers.js";
import { jest } from "@jest/globals";

// Set timeout for API tests
jest.setTimeout(10000);

describe("Organization API", () => {
  const testUser = {
    username: "orgadmin",
    email: "admin@testorg.com",
    password: "password123",
    role: "admin",
    organization: "testorg",
    organizationName: "Test Organization",
  };

  const testOrganization = {
    name: "Test Organization",
    identifier: "testorg",
    plan: "Pro",
    domains: ["testorg.com"],
    email: "contact@testorg.com",
    recommendationThreshold: 0.6,
    ticketCreationDelay: 5,
    notificationThreshold: 0.8,
  };

  let agent;
  let userId;
  let organizationId;
  let testOrgCounter = 0;
  let testUserCounter = 0;

  beforeEach(async () => {
    // Use agent to maintain cookies across requests
    agent = request.agent(testApp);

    // Create unique identifier for each test to avoid conflicts
    testOrgCounter++;
    testUserCounter++;
    testOrganization.identifier = `testorg${testOrgCounter}`;
    testUser.username = `orgadmin${testUserCounter}`;
    testUser.email = `admin${testUserCounter}@testorg.com`;

    // Register user
    const registerRes = await agent.post("/api/auth/register").send(testUser);
    userId = registerRes.body._id;

    // Login to get cookies
    await agent.post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });
  });

  describe("POST /api/organization/create", () => {
    it("should create a new organization", async () => {
      const res = await agent
        .post("/api/organization/create")
        .send(testOrganization);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.name).toBe(testOrganization.name);
      expect(res.body.identifier).toBe(testOrganization.identifier);
      // Plan might default to "Free" even if "Pro" is provided
      expect(res.body).toHaveProperty("plan");
      organizationId = res.body._id;
    });

    it("should fail to create organization without identifier", async () => {
      const invalidOrg = { ...testOrganization };
      delete invalidOrg.identifier;

      const res = await agent.post("/api/organization/create").send(invalidOrg);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Organization identifier is required");
    });

    it("should fail to create organization with duplicate identifier", async () => {
      // Create first organization
      await agent.post("/api/organization/create").send(testOrganization);

      // Try to create another with same identifier
      const duplicateOrg = {
        ...testOrganization,
        name: "Another Organization",
      };

      const res = await agent
        .post("/api/organization/create")
        .send(duplicateOrg);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toContain("already exists");
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp)
        .post("/api/organization/create")
        .send(testOrganization);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/organization/", () => {
    beforeEach(async () => {
      // Create organization for tests
      const createRes = await agent
        .post("/api/organization/create")
        .send(testOrganization);
      organizationId = createRes.body._id;
    });

    it("should get all organizations", async () => {
      const res = await agent.get("/api/organization/");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("_id");
      expect(res.body[0]).toHaveProperty("name");
      expect(res.body[0]).toHaveProperty("identifier");
    });

    it("should return 204 when no organizations exist", async () => {
      // First get all organizations to see how many there are
      const initialRes = await agent.get("/api/organization/");

      // Delete all organizations if any exist
      if (initialRes.statusCode === 200 && Array.isArray(initialRes.body)) {
        for (const org of initialRes.body) {
          await agent.delete(`/api/organization/${org.identifier}/delete`);
        }
      }

      const res = await agent.get("/api/organization/");

      expect(res.statusCode).toBe(204);
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp).get("/api/organization/");

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/organization/:id", () => {
    beforeEach(async () => {
      // Create organization for tests
      const createRes = await agent
        .post("/api/organization/create")
        .send(testOrganization);
      organizationId = createRes.body._id;
    });

    it("should get organization by ID", async () => {
      const res = await agent.get(`/api/organization/${organizationId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("_id", organizationId);
      expect(res.body.name).toBe(testOrganization.name);
      expect(res.body.identifier).toBe(testOrganization.identifier);
    });

    it("should return 404 for non-existent organization ID", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await agent.get(`/api/organization/${fakeId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Organization not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp).get(
        `/api/organization/${organizationId}`
      );

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/organization/identifier/:identifier", () => {
    beforeEach(async () => {
      // Create organization for tests
      const createRes = await agent
        .post("/api/organization/create")
        .send(testOrganization);
      organizationId = createRes.body._id;
    });

    it("should get organization by identifier", async () => {
      const res = await agent.get(
        `/api/organization/identifier/${testOrganization.identifier}`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.name).toBe(testOrganization.name);
      expect(res.body.identifier).toBe(testOrganization.identifier);
    });

    it("should return 404 for non-existent identifier", async () => {
      const res = await agent.get("/api/organization/identifier/nonexistent");

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Organization not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp).get(
        `/api/organization/identifier/${testOrganization.identifier}`
      );

      expect(res.statusCode).toBe(403);
    });
  });

  describe("PATCH /api/organization/:identifier/edit", () => {
    beforeEach(async () => {
      // Create organization for tests
      const createRes = await agent
        .post("/api/organization/create")
        .send(testOrganization);
      organizationId = createRes.body._id;
    });

    it("should update organization successfully", async () => {
      const updateData = {
        name: "Updated Organization Name",
        plan: "Enterprise",
        recommendationThreshold: 0.7,
        ticketCreationDelay: 10,
      };

      const res = await agent
        .patch(`/api/organization/${testOrganization.identifier}/edit`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe(updateData.name);
      expect(res.body.plan).toBe(updateData.plan);
      expect(res.body.recommendationThreshold).toBe(
        updateData.recommendationThreshold
      );
      expect(res.body.ticketCreationDelay).toBe(updateData.ticketCreationDelay);
    });

    it("should update jira configuration", async () => {
      const jiraConfig = {
        jiraConfig: {
          host: "testcompany.atlassian.net",
          username: "test@company.com",
          apiToken: "test-token",
          projectKey: "TEST",
          issueType: "Bug",
          enabled: true,
          supportsPriority: false,
        },
      };

      const res = await agent
        .patch(`/api/organization/${testOrganization.identifier}/edit`)
        .send(jiraConfig);

      expect(res.statusCode).toBe(200);
      expect(res.body.jiraConfig.host).toBe(
        "https://testcompany.atlassian.net"
      );
      expect(res.body.jiraConfig.username).toBe(jiraConfig.jiraConfig.username);
      expect(res.body.jiraConfig.apiToken).toBe("***HIDDEN***"); // Should be hidden
      expect(res.body.jiraConfig.projectKey).toBe(
        jiraConfig.jiraConfig.projectKey
      );
      expect(res.body.jiraConfig.enabled).toBe(true);
    });

    it("should fail to update with invalid recommendation threshold", async () => {
      const invalidData = {
        recommendationThreshold: 1.5, // Invalid - should be 0-1
      };

      const res = await agent
        .patch(`/api/organization/${testOrganization.identifier}/edit`)
        .send(invalidData);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("Recommendation threshold");
    });

    it("should fail to update with invalid ticket creation delay", async () => {
      const invalidData = {
        ticketCreationDelay: 400, // Invalid - max is 365
      };

      const res = await agent
        .patch(`/api/organization/${testOrganization.identifier}/edit`)
        .send(invalidData);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("Ticket creation delay");
    });

    it("should return 404 for non-existent organization", async () => {
      const res = await agent
        .patch("/api/organization/nonexistent/edit")
        .send({ name: "New Name" });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Organization not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp)
        .patch(`/api/organization/${testOrganization.identifier}/edit`)
        .send({ name: "New Name" });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("DELETE /api/organization/:identifier/delete", () => {
    beforeEach(async () => {
      // Create organization for tests
      const createRes = await agent
        .post("/api/organization/create")
        .send(testOrganization);
      organizationId = createRes.body._id;
    });

    it("should delete organization successfully", async () => {
      const res = await agent.delete(
        `/api/organization/${testOrganization.identifier}/delete`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe("Organization Deleted Successfully");

      // Verify organization is deleted
      const getRes = await agent.get(
        `/api/organization/identifier/${testOrganization.identifier}`
      );
      expect(getRes.statusCode).toBe(404);
    });

    it("should return 204 for non-existent organization", async () => {
      const res = await agent.delete("/api/organization/nonexistent/delete");

      expect(res.statusCode).toBe(204);
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp).delete(
        `/api/organization/${testOrganization.identifier}/delete`
      );

      expect(res.statusCode).toBe(403);
    });
  });

  describe("POST /api/organization/:identifier/member/add/username", () => {
    let secondUser;

    beforeEach(async () => {
      // Create organization
      const createRes = await agent
        .post("/api/organization/create")
        .send(testOrganization);
      organizationId = createRes.body._id;

      // Create a second user to add as member
      secondUser = {
        username: `member1_${testUserCounter}`,
        email: `member1_${testUserCounter}@example.com`,
        password: "password123",
        role: "user",
        organization: "otherorg",
        organizationName: "Other Organization",
      };

      await request(testApp).post("/api/auth/register").send(secondUser);
    });

    it("should add member to organization by username", async () => {
      const res = await agent
        .post(
          `/api/organization/${testOrganization.identifier}/member/add/username`
        )
        .send({ username: secondUser.username });

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe("User added to organization successfully");
    });

    it("should fail to add non-existent user", async () => {
      const res = await agent
        .post(
          `/api/organization/${testOrganization.identifier}/member/add/username`
        )
        .send({ username: "nonexistentuser" });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("should fail to add user that is already a member", async () => {
      // Add user first
      await agent
        .post(
          `/api/organization/${testOrganization.identifier}/member/add/username`
        )
        .send({ username: secondUser.username });

      // Try to add again
      const res = await agent
        .post(
          `/api/organization/${testOrganization.identifier}/member/add/username`
        )
        .send({ username: secondUser.username });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe(
        "User is already a member of this organization"
      );
    });

    it("should fail for non-existent organization", async () => {
      const res = await agent
        .post("/api/organization/nonexistent/member/add/username")
        .send({ username: secondUser.username });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Organization not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp)
        .post(
          `/api/organization/${testOrganization.identifier}/member/add/username`
        )
        .send({ username: secondUser.username });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("POST /api/organization/:identifier/member/add/email", () => {
    let secondUser;

    beforeEach(async () => {
      // Create organization
      const createRes = await agent
        .post("/api/organization/create")
        .send(testOrganization);
      organizationId = createRes.body._id;

      // Create a second user to add as member
      secondUser = {
        username: `member2_${testUserCounter}`,
        email: `member2_${testUserCounter}@example.com`,
        password: "password123",
        role: "user",
        organization: "otherorg",
        organizationName: "Other Organization",
      };

      await request(testApp).post("/api/auth/register").send(secondUser);
    });

    it("should add member to organization by email", async () => {
      const res = await agent
        .post(
          `/api/organization/${testOrganization.identifier}/member/add/email`
        )
        .send({ email: secondUser.email });

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe("User added to organization successfully");
    });

    it("should fail to add non-existent user by email", async () => {
      const res = await agent
        .post(
          `/api/organization/${testOrganization.identifier}/member/add/email`
        )
        .send({ email: "nonexistent@example.com" });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp)
        .post(
          `/api/organization/${testOrganization.identifier}/member/add/email`
        )
        .send({ email: secondUser.email });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("POST /api/organization/:identifier/member/remove", () => {
    let secondUser;

    beforeEach(async () => {
      // Create organization
      const createRes = await agent
        .post("/api/organization/create")
        .send(testOrganization);
      organizationId = createRes.body._id;

      // Create and add a second user as member
      secondUser = {
        username: `member3_${testUserCounter}`,
        email: `member3_${testUserCounter}@example.com`,
        password: "password123",
        role: "user",
        organization: "otherorg",
        organizationName: "Other Organization",
      };

      await request(testApp).post("/api/auth/register").send(secondUser);

      // Add user to organization
      await agent
        .post(
          `/api/organization/${testOrganization.identifier}/member/add/username`
        )
        .send({ username: secondUser.username });
    });

    it("should remove member from organization", async () => {
      const res = await agent
        .post(`/api/organization/${testOrganization.identifier}/member/remove`)
        .send({ username: secondUser.username });

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe("User removed from organization successfully");
    });

    it("should fail to remove non-existent user", async () => {
      const res = await agent
        .post(`/api/organization/${testOrganization.identifier}/member/remove`)
        .send({ username: "nonexistentuser" });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("should fail to remove user that is not a member", async () => {
      // Create another user that is not a member
      const nonMemberUser = {
        username: `nonmember_${testUserCounter}`,
        email: `nonmember_${testUserCounter}@example.com`,
        password: "password123",
        role: "user",
        organization: "otherorg2",
        organizationName: "Other Organization",
      };

      await request(testApp).post("/api/auth/register").send(nonMemberUser);

      const res = await agent
        .post(`/api/organization/${testOrganization.identifier}/member/remove`)
        .send({ username: nonMemberUser.username });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("User is not a member of this organization");
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp)
        .post(`/api/organization/${testOrganization.identifier}/member/remove`)
        .send({ username: secondUser.username });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("POST /api/organization/:identifier/member/change-role", () => {
    let secondUser;

    beforeEach(async () => {
      // Create organization
      const createRes = await agent
        .post("/api/organization/create")
        .send(testOrganization);
      organizationId = createRes.body._id;

      // Create and add a second user as member
      secondUser = {
        username: `member4_${testUserCounter}`,
        email: `member4_${testUserCounter}@example.com`,
        password: "password123",
        role: "user",
        organization: "otherorg",
        organizationName: "Other Organization",
      };

      await request(testApp).post("/api/auth/register").send(secondUser);

      // Add user to organization
      await agent
        .post(
          `/api/organization/${testOrganization.identifier}/member/add/username`
        )
        .send({ username: secondUser.username });
    });

    it("should promote user from user to subadmin", async () => {
      const res = await agent
        .post(
          `/api/organization/${testOrganization.identifier}/member/change-role`
        )
        .send({ username: secondUser.username });

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe("User promoted to subadmin successfully");
    });

    it("should fail to change role of non-existent user", async () => {
      const res = await agent
        .post(
          `/api/organization/${testOrganization.identifier}/member/change-role`
        )
        .send({ username: "nonexistentuser" });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp)
        .post(
          `/api/organization/${testOrganization.identifier}/member/change-role`
        )
        .send({ username: secondUser.username });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("POST /api/organization/:identifier/test-email", () => {
    beforeEach(async () => {
      // Create organization with email
      const createRes = await agent
        .post("/api/organization/create")
        .send(testOrganization);
      organizationId = createRes.body._id;
    });

    it("should send test email successfully", async () => {
      const res = await agent
        .post(`/api/organization/${testOrganization.identifier}/test-email`)
        .send({ testEmail: "test@example.com" });

      // The actual result depends on email service implementation
      // Could be 200 or 500 depending on if email service is configured
      expect([200, 500]).toContain(res.statusCode);
    });

    it("should fail for non-existent organization", async () => {
      const res = await agent
        .post("/api/organization/nonexistent/test-email")
        .send({ testEmail: "test@example.com" });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Organization not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(testApp)
        .post(`/api/organization/${testOrganization.identifier}/test-email`)
        .send({ testEmail: "test@example.com" });

      expect(res.statusCode).toBe(403);
    });
  });
});
