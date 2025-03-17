import { register, login } from "./auth.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("../models/User.js");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("Auth Controller", () => {
  describe("register", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should register a new user", async () => {
      // Mock User.find to return empty array (no existing user)
      User.find = jest.fn().mockResolvedValue([]);
      
      const req = {
        body: {
          email: "test@example.com",
          password: "password123",
          role: "user",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      bcrypt.genSalt.mockResolvedValue("salt");
      bcrypt.hash.mockResolvedValue("hashedPassword");
      User.prototype.save.mockResolvedValue(req.body);

      await register(req, res);

      expect(User.find).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(req.body);
    });

    it("should return 409 if user already exists", async () => {
      // Mock User.find to return existing user
      User.find = jest.fn().mockResolvedValue([{ email: "test@example.com" }]);
      
      const req = {
        body: {
          email: "test@example.com",
          password: "password123",
          role: "user",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await register(req, res);

      expect(User.find).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "User already exists" });
    });

    it("should return 500 if server error occurs", async () => {
      // Mock User.find to throw an error
      User.find = jest.fn().mockRejectedValue(new Error("Database connection error"));
      
      const req = {
        body: {
          email: "test@example.com",
          password: "password123",
          role: "user",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database connection error" });
    });
  });

  describe("login", () => {
    it("should log in an existing user", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
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
    });
  });
});
