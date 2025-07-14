import {
  getUser,
  getMe,
  updateUser,
  addToOrganization,
  deleteFromOrganization,
} from "./users.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";

jest.mock("../models/User.js");
jest.mock("bcrypt");
jest.mock("../logger.js", () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

import logger from "../logger.js";

describe("Users Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {
        id: "userId",
      },
      path: "/api/users/userId",
      method: "GET",
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("getUser", () => {
    it("should get a user by id and not log errors", async () => {
      const user = {
        id: "userId",
        email: "test@example.com",
        role: "user",
        password: "hashedPassword",
      };
      User.findById.mockResolvedValue(user);

      await getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: "userId",
        email: "test@example.com",
        role: "user",
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should log errors when User.findById fails", async () => {
      const error = new Error("Database error");
      User.findById.mockRejectedValue(error);

      await getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
      expect(logger.error).toHaveBeenCalledWith("Error retrieving user", {
        error: error.message,
        stack: expect.any(String),
      });
    });

    it("should handle case when user is not found", async () => {
      User.findById.mockResolvedValue(null);

      await getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("getMe", () => {
    beforeEach(() => {
      req = {
        user: { id: "userId" },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should get current user details", async () => {
      const user = {
        _id: "userId",
        email: "test@example.com",
        username: "testuser",
        password: "hashedPassword",
        id: "userId",
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "user",
      };

      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(user),
      });

      await getMe(req, res);

      expect(User.findById).toHaveBeenCalledWith("userId");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        _id: "userId",
        email: "test@example.com",
        username: "testuser",
      });
    });

    it("should return 404 if user not found", async () => {
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should log errors when retrieving current user fails", async () => {
      const error = new Error("Database error");
      User.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(error),
      });

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
      expect(logger.error).toHaveBeenCalledWith("Error retrieving user", {
        error: error.message,
        stack: expect.any(String),
      });
    });
  });

  describe("updateUser", () => {
    beforeEach(() => {
      req = {
        params: { id: "userId" },
        body: {
          currentPassword: "currentPassword",
          username: "newUsername",
        },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should update user successfully", async () => {
      const user = {
        _id: "userId",
        password: "hashedCurrentPassword",
      };

      User.findById.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      User.findOne.mockResolvedValue(null); // No existing user with new username
      User.findByIdAndUpdate.mockResolvedValue(user);

      await updateUser(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "currentPassword",
        "hashedCurrentPassword"
      );
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "userId",
        { $set: { username: "newUsername" } },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith("User updated successfully");
    });

    it("should return 404 if user not found", async () => {
      User.findById.mockResolvedValue(null);

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should return 400 if current password not provided", async () => {
      req.body = { username: "newUsername" }; // No currentPassword
      const user = { _id: "userId" };
      User.findById.mockResolvedValue(user);

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Current password is required for any account modifications",
      });
    });

    it("should return 401 if current password is incorrect", async () => {
      const user = {
        _id: "userId",
        password: "hashedCurrentPassword",
      };

      User.findById.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Current password is incorrect",
      });
    });

    it("should return 400 if username already exists", async () => {
      const user = {
        _id: "userId",
        password: "hashedCurrentPassword",
      };
      const existingUser = { _id: "otherUserId", username: "newUsername" };

      User.findById.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      User.findOne.mockResolvedValue(existingUser);

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Username already exists",
      });
    });

    it("should return 400 if email already exists", async () => {
      req.body = {
        currentPassword: "currentPassword",
        email: "newemail@example.com",
      };

      const user = {
        _id: "userId",
        password: "hashedCurrentPassword",
      };
      const existingUser = {
        _id: "otherUserId",
        email: "newemail@example.com",
      };

      User.findById.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      User.findOne.mockResolvedValue(existingUser);

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Email already exists" });
    });

    it("should hash new password if provided", async () => {
      req.body = {
        currentPassword: "currentPassword",
        password: "newPassword",
      };

      const user = {
        _id: "userId",
        password: "hashedCurrentPassword",
      };

      User.findById.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.genSalt.mockResolvedValue("salt");
      bcrypt.hash.mockResolvedValue("hashedNewPassword");
      User.findByIdAndUpdate.mockResolvedValue(user);

      await updateUser(req, res);

      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith("newPassword", "salt");
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "userId",
        { $set: { password: "hashedNewPassword" } },
        { new: true, runValidators: true }
      );
    });

    it("should log errors when update fails", async () => {
      const error = new Error("Database error");
      User.findById.mockRejectedValue(error);

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
      expect(logger.error).toHaveBeenCalledWith("Error updating user", {
        error: error.message,
        stack: expect.any(String),
        requestBody: req.body,
      });
    });
  });

  describe("addToOrganization", () => {
    beforeEach(() => {
      req = {
        params: { id: "userId" },
        body: { organizationIdentifier: "testorg" },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should add user to organization successfully", async () => {
      const user = {
        _id: "userId",
        organization: [],
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(user);

      await addToOrganization(req, res);

      expect(user.organization).toContain("testorg");
      expect(user.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        "User added to organization successfully"
      );
    });

    it("should return 404 if user not found", async () => {
      User.findById.mockResolvedValue(null);

      await addToOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should return 400 if organization identifier not provided", async () => {
      req.body = {};
      const user = { _id: "userId" };
      User.findById.mockResolvedValue(user);

      await addToOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Organization identifier is required",
      });
    });

    it("should return 400 if user already in organization", async () => {
      const user = {
        _id: "userId",
        organization: ["testorg"],
      };

      User.findById.mockResolvedValue(user);

      await addToOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "User already in this organization",
      });
    });

    it("should log errors when adding to organization fails", async () => {
      const error = new Error("Database error");
      User.findById.mockRejectedValue(error);

      await addToOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
      expect(logger.error).toHaveBeenCalledWith(
        "Error adding user to organization",
        {
          error: error.message,
          stack: expect.any(String),
          requestBody: req.body,
        }
      );
    });
  });

  describe("deleteFromOrganization", () => {
    beforeEach(() => {
      req = {
        params: { id: "userId" },
        body: { organizationIdentifier: "testorg" },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should remove user from organization successfully", async () => {
      const user = {
        _id: "userId",
        organization: ["testorg", "otherorg"],
        save: jest.fn().mockResolvedValue(),
      };

      User.findById.mockResolvedValue(user);

      await deleteFromOrganization(req, res);

      expect(user.organization).not.toContain("testorg");
      expect(user.organization).toContain("otherorg");
      expect(user.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        "User removed from organization successfully"
      );
    });

    it("should return 404 if user not found", async () => {
      User.findById.mockResolvedValue(null);

      await deleteFromOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should return 400 if organization identifier not provided", async () => {
      req.body = {};
      const user = { _id: "userId" };
      User.findById.mockResolvedValue(user);

      await deleteFromOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Organization identifier is required",
      });
    });

    it("should return 400 if user not in organization", async () => {
      const user = {
        _id: "userId",
        organization: ["otherorg"],
      };

      User.findById.mockResolvedValue(user);

      await deleteFromOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not in this organization",
      });
    });

    it("should log errors when removing from organization fails", async () => {
      const error = new Error("Database error");
      User.findById.mockRejectedValue(error);

      await deleteFromOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
      expect(logger.error).toHaveBeenCalledWith(
        "Error removing user from organization",
        {
          error: error.message,
          stack: expect.any(String),
          requestBody: req.body,
        }
      );
    });
  });
});
