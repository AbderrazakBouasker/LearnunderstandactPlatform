import { getUser } from "./users.js";
import User from "../models/User.js";

jest.mock("../models/User.js");

describe("Users Controller", () => {
  describe("getUser", () => {
    it("should get a user by id", async () => {
      const req = {
        params: {
          id: "userId",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const user = {
        id: "userId",
        email: "test@example.com",
        role: "user",
      };
      User.findById.mockResolvedValue(user);

      await getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(user);
    });
  });
});
