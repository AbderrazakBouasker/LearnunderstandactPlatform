import { verifyToken } from "./auth.js";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("Auth Middleware", () => {
  describe("verifyToken", () => {
    it("should verify a valid token", async () => {
      const req = {
        header: jest.fn().mockReturnValue("Bearer validToken"),
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
      jwt.verify.mockReturnValue({ id: "userId" });

      await verifyToken(req, res, next);

      expect(req.user).toEqual({ id: "userId" });
      expect(next).toHaveBeenCalled();
    });

    it("should return 403 if no token is provided", async () => {
      const req = {
        header: jest.fn().mockReturnValue(null),
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith("Not Authorized");
    });
  });
});
