import { getUser } from "./users.js";
import User from "../models/User.js";

jest.mock("../models/User.js");
jest.mock("../logger.js", () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));

import logger from '../logger.js';

describe("Users Controller", () => {
  let req, res;
  
  beforeEach(() => {
    req = {
      params: {
        id: "userId",
      },
      path: "/api/users/userId",
      method: "GET"
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
        password: "hashedPassword"
      };
      User.findById.mockResolvedValue(user);

      await getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: "userId",
        email: "test@example.com",
        role: "user"
      });
      expect(logger.error).not.toHaveBeenCalled();
    });
    
    it("should log errors when User.findById fails", async () => {
      const error = new Error("Database error");
      User.findById.mockRejectedValue(error);

      await getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
      expect(logger.error).toHaveBeenCalledWith('Error retrieving user', {
        error: error.message,
        stack: expect.any(String)
      });
    });
    
    it("should handle case when user is not found", async () => {
      User.findById.mockResolvedValue(null);

      await getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
