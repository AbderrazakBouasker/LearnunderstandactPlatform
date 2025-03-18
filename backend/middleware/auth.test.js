import { verifyToken } from "./auth.js";
import jwt from "jsonwebtoken";
import logger from '../logger.js';

// Mock JWT and logger
jest.mock("jsonwebtoken");
jest.mock("../logger.js", () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn(),
      path: "/test-path",
      method: "GET",
      ip: "127.0.0.1"
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Clear mocks
    jest.clearAllMocks();
  });

  describe("verifyToken", () => {
    it("should verify a valid token", async () => {
      req.header.mockReturnValue("Bearer validToken");
      jwt.verify.mockReturnValue({ id: "userId" });

      await verifyToken(req, res, next);

      expect(req.user).toEqual({ id: "userId" });
      expect(next).toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should log and return 403 if no token is provided", async () => {
      req.header.mockReturnValue(null);

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith("Not Authorized");
      expect(logger.warn).toHaveBeenCalledWith('Authorization attempt with missing token', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it("should handle expired tokens correctly", async () => {
      req.header.mockReturnValue("Bearer expiredToken");
      const tokenError = new Error("jwt expired");
      tokenError.name = "TokenExpiredError";
      jwt.verify.mockImplementation(() => { throw tokenError; });

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Token has expired" });
      expect(logger.error).toHaveBeenCalledWith('Error verifying token', expect.objectContaining({
        error: tokenError.message,
        type: tokenError.name,
        path: req.path,
        method: req.method,
        ip: req.ip
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    it("should handle invalid tokens correctly", async () => {
      req.header.mockReturnValue("Bearer invalidToken");
      const tokenError = new Error("invalid signature");
      tokenError.name = "JsonWebTokenError";
      jwt.verify.mockImplementation(() => { throw tokenError; });

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
      expect(logger.error).toHaveBeenCalledWith('Error verifying token', expect.objectContaining({
        error: tokenError.message,
        type: tokenError.name,
        path: req.path,
        method: req.method,
        ip: req.ip
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    it("should handle other JWT errors with generic 500 response", async () => {
      req.header.mockReturnValue("Bearer problemToken");
      const tokenError = new Error("something went wrong");
      tokenError.name = "OtherError"; 
      jwt.verify.mockImplementation(() => { throw tokenError; });

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: tokenError.message });
      expect(logger.error).toHaveBeenCalledWith('Error verifying token', expect.objectContaining({
        error: tokenError.message,
        type: tokenError.name,
        path: req.path,
        method: req.method,
        ip: req.ip
      }));
      expect(next).not.toHaveBeenCalled();
    });
  });
});
