import { register, login } from "./auth.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("../models/User.js");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../logger.js", () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));

import logger from '../logger.js';

describe("Auth Controller", () => {
  let req, res;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe("register", () => {
    beforeEach(() => {
      req = {
        body: {
          email: "test@example.com",
          password: "password123",
          role: "user",
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
      
      bcrypt.genSalt.mockResolvedValue("salt");
      bcrypt.hash.mockResolvedValue("hashedPassword");
      User.prototype.save.mockResolvedValue(req.body);

      await register(req, res);

      expect(User.find).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(req.body);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should return 409 if user already exists", async () => {
      // Mock User.find to return existing user
      User.find = jest.fn().mockResolvedValue([{ email: "test@example.com" }]);
      
      await register(req, res);

      expect(User.find).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "User already exists" });
    });

    it("should log errors when registration fails", async () => {
      // Mock User.find to throw an error
      const error = new Error("Database connection error");
      User.find = jest.fn().mockRejectedValue(error);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database connection error" });
      expect(logger.error).toHaveBeenCalledWith('Error registering user', {
        error: error.message,
        stack: expect.any(String),
        requestBody: req.body
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
      expect(res.json).toHaveBeenCalledWith({ token: "token", user });
      expect(logger.info).toHaveBeenCalledWith('User logged in successfully', {
        userId: user.id,
        email: user.email,
      });
    });
    
    it("should log errors when login fails", async () => {
      const error = new Error("Database error");
      User.findOne.mockRejectedValue(error);
      
      await login(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalledWith('Error logging in user', {
        error: error.message,
        stack: expect.any(String),
        requestBody: req.body
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
});
