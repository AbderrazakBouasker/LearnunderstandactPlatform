import request from "supertest";
import { testApp } from "./helpers.js";
import { jest } from "@jest/globals";

// Set timeout for API tests
jest.setTimeout(10000);

describe("Auth API", () => {
  const testUser = {
    username: "testuser",
    email: "test@example.com",
    password: "password123",
    role: "admin",
    organization: "testorg",
    organizationName: "Test Organization",
  };

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(testApp)
        .post("/api/auth/register")
        .send(testUser);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.username).toBe(testUser.username);
      expect(res.body).not.toHaveProperty("password");
    });

    it("should reject duplicate email", async () => {
      await request(testApp).post("/api/auth/register").send(testUser);

      const res = await request(testApp)
        .post("/api/auth/register")
        .send({
          ...testUser,
          username: "differentuser",
          organization: "differentorg",
        });

      expect(res.statusCode).toBe(409);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(testApp).post("/api/auth/register").send(testUser);
    });

    it("should login with valid credentials", async () => {
      const res = await request(testApp).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Logged in successfully");
    });

    it("should reject invalid password", async () => {
      const res = await request(testApp).post("/api/auth/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout successfully", async () => {
      const res = await request(testApp).post("/api/auth/logout");

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Logged out successfully");
    });
  });
});
