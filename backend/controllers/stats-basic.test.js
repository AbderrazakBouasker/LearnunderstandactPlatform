// Mock models before importing
jest.mock("../models/Feedback.js", () => ({
  aggregate: jest.fn(),
  countDocuments: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock("../models/ClusterAnalysis.js", () => ({
  find: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock("mongoose", () => ({
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id || "mockObjectId"),
  },
}));

import { getFeedbackCountOverTimeByOrg } from "./stats.js";
import Feedback from "../models/Feedback.js";

describe("Stats Controller Basic", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should run a basic test", () => {
    expect(true).toBe(true);
  });

  it("should be able to import stats functions", () => {
    expect(getFeedbackCountOverTimeByOrg).toBeDefined();
  });

  it("should return 400 when dates are missing", async () => {
    req = {
      params: { organization: "testorg" },
      query: {}, // Missing dates
    };

    await getFeedbackCountOverTimeByOrg(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Start date and end date are required",
    });
  });
});
