import { register, login, logout } from "./auth.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("../models/User.js");
jest.mock("../models/Organization.js");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../logger.js", () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

import logger from "../logger.js";

describe("Auth Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    beforeEach(() => {
      req = {
        body: {
          username: "testuser",
          email: "test@example.com",
          password: "password123",
          role: "user",
          organization: "testorg",
          organizationName: "Test Organization",
        },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should register a new user without logging errors", async () => {
      // Mock User.find to return empty array (no existing user)
      User.find = jest.fn().mockResolvedValue([]);
      Organization.findOne = jest.fn().mockResolvedValue(null);

      bcrypt.genSalt.mockResolvedValue("salt");
      bcrypt.hash.mockResolvedValue("hashedPassword");

      const mockUser = {
        _id: "userId",
        ...req.body,
        password: "hashedPassword",
      };
      User.prototype.save = jest.fn().mockResolvedValue(mockUser);
      Organization.prototype.save = jest.fn().mockResolvedValue({});

      await register(req, res);

      expect(User.find).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(User.find).toHaveBeenCalledWith({ username: "testuser" });
      expect(Organization.findOne).toHaveBeenCalledWith({
        identifier: "testorg",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should return 409 if email already exists", async () => {
      // Mock User.find to return existing user for email check
      User.find = jest
        .fn()
        .mockResolvedValueOnce([{ email: "test@example.com" }]) // First call for email
        .mockResolvedValueOnce([]); // Second call for username

      await register(req, res);

      expect(User.find).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "Email already exists" });
    });

    it("should return 409 if username already exists", async () => {
      // Mock User.find to return empty for email but existing user for username
      User.find = jest
        .fn()
        .mockResolvedValueOnce([]) // First call for email
        .mockResolvedValueOnce([{ username: "testuser" }]); // Second call for username

      await register(req, res);

      expect(User.find).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(User.find).toHaveBeenCalledWith({ username: "testuser" });
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Username already exists",
      });
    });

    it("should return 409 if organization already exists", async () => {
      // Mock User.find to return empty arrays (no existing users)
      User.find = jest.fn().mockResolvedValue([]);
      // Mock Organization.findOne to return existing organization
      Organization.findOne = jest
        .fn()
        .mockResolvedValue({ identifier: "testorg" });

      await register(req, res);

      expect(Organization.findOne).toHaveBeenCalledWith({
        identifier: "testorg",
      });
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Organization already exists",
      });
      expect(logger.warn).toHaveBeenCalledWith(
        "Attempt to register user with existing organization identifier",
        {
          organization: "testorg",
          username: "testuser",
          email: "test@example.com",
        }
      );
    });

    it("should log errors when registration fails", async () => {
      // Mock User.find to throw an error
      const error = new Error("Database connection error");
      User.find = jest.fn().mockRejectedValue(error);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Database connection error",
      });
      expect(logger.error).toHaveBeenCalledWith("Error registering user", {
        error: error.message,
        stack: expect.any(String),
        requestBody: req.body,
      });
    });
  });

  describe("login", () => {
    beforeEach(() => {
      req = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
      };
    });

    it("should log in an existing user and log successful login", async () => {
      const user = {
        id: "userId",
        email: "test@example.com",
        password: "hashedPassword",
      };
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("token");

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Logged in successfully",
      });
      expect(res.cookie).toHaveBeenCalledWith("jwt", "token", {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 1,
      });
      expect(logger.info).toHaveBeenCalledWith("User logged in successfully", {
        userId: user.id,
        email: user.email,
      });
    });

    it("should log errors when login fails", async () => {
      const error = new Error("Database error");
      User.findOne.mockRejectedValue(error);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalledWith("Error logging in user", {
        error: error.message,
        stack: expect.any(String),
        requestBody: req.body,
      });
    });

    it("should not log errors when user is not found", async () => {
      User.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should not log errors when password is incorrect", async () => {
      const user = {
        id: "userId",
        email: "test@example.com",
        password: "hashedPassword",
      };
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        clearCookie: jest.fn(),
      };
    });

    it("should log out user successfully", async () => {
      await logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith("jwt", {
        httpOnly: true,
        sameSite: "lax",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Logged out successfully",
      });
      expect(logger.info).toHaveBeenCalledWith("User logged out successfully");
    });

    it("should log errors when logout fails", async () => {
      const error = new Error("Cookie error");
      res.clearCookie = jest.fn().mockImplementation(() => {
        throw error;
      });

      await logout(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Cookie error" });
      expect(logger.error).toHaveBeenCalledWith("Error logging out user", {
        error: error.message,
        stack: expect.any(String),
      });
    });
  });
});
