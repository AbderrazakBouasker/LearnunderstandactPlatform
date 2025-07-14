// Set up environment variable at the very beginning
process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";

// Mock logger
jest.mock("../logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Create a comprehensive mock for the entire stripe module
jest.mock("stripe", () => {
  const mockCreate = jest.fn();
  const mockStripe = jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockCreate,
    },
  }));
  // Attach the mock function to the constructor for easy access in tests
  mockStripe.mockCreate = mockCreate;
  return mockStripe;
});

import { createPaymentIntentController } from "./stripe.js";
import Stripe from "stripe";
import logger from "../logger.js";

// Get the mock function from the Stripe constructor
const mockCreate = Stripe.mockCreate;

describe("Stripe Controller", () => {
  let req, res;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock request and response
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    // Clean up environment variable
    delete process.env.STRIPE_SECRET_KEY;
  });

  describe("createPaymentIntentController", () => {
    it("should create payment intent successfully for pro tier", async () => {
      req.body = {
        username: "testuser",
        identifier: "test-org",
        tier: "pro",
      };

      const mockPaymentIntent = {
        id: "pi_test_123",
        client_secret: "pi_test_123_secret",
      };

      mockCreate.mockResolvedValue(mockPaymentIntent);

      await createPaymentIntentController(req, res);

      expect(mockCreate).toHaveBeenCalledWith({
        amount: 1000,
        currency: "usd",
        metadata: {
          username: "testuser",
          identifier: "test-org",
          tier: "pro",
        },
      });

      expect(res.send).toHaveBeenCalledWith({
        clientSecret: "pi_test_123_secret",
      });

      expect(logger.info).toHaveBeenCalledWith(
        "Payment intent creation requested",
        {
          username: "testuser",
          identifier: "test-org",
          tier: "pro",
          timestamp: expect.any(String),
        }
      );

      expect(logger.info).toHaveBeenCalledWith(
        "Payment intent created successfully",
        {
          username: "testuser",
          identifier: "test-org",
          tier: "pro",
          amount: 1000,
          currency: "usd",
          paymentIntentId: "pi_test_123",
          timestamp: expect.any(String),
        }
      );
    });

    it("should create payment intent successfully for enterprise tier", async () => {
      req.body = {
        username: "enterpriseuser",
        identifier: "enterprise-org",
        tier: "enterprise",
      };

      const mockPaymentIntent = {
        id: "pi_enterprise_123",
        client_secret: "pi_enterprise_123_secret",
      };

      mockCreate.mockResolvedValue(mockPaymentIntent);

      await createPaymentIntentController(req, res);

      expect(mockCreate).toHaveBeenCalledWith({
        amount: 5000,
        currency: "usd",
        metadata: {
          username: "enterpriseuser",
          identifier: "enterprise-org",
          tier: "enterprise",
        },
      });

      expect(res.send).toHaveBeenCalledWith({
        clientSecret: "pi_enterprise_123_secret",
      });
    });

    it("should return 400 for invalid tier", async () => {
      req.body = {
        username: "testuser",
        identifier: "test-org",
        tier: "invalid",
      };

      await createPaymentIntentController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: "Invalid tier" });

      expect(logger.warn).toHaveBeenCalledWith(
        "Invalid tier specified for payment",
        {
          tier: "invalid",
          username: "testuser",
          identifier: "test-org",
        }
      );

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("should handle Stripe errors gracefully", async () => {
      req.body = {
        username: "testuser",
        identifier: "test-org",
        tier: "pro",
      };

      const stripeError = new Error("Payment failed");
      stripeError.stack = "Error stack trace";
      mockCreate.mockRejectedValue(stripeError);

      await createPaymentIntentController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Payment intent failed" });

      expect(logger.error).toHaveBeenCalledWith(
        "Payment intent creation failed",
        {
          error: "Payment failed",
          stack: "Error stack trace",
          username: "testuser",
          identifier: "test-org",
          tier: "pro",
          timestamp: expect.any(String),
        }
      );
    });

    it("should handle missing request body parameters", async () => {
      req.body = {
        // Missing username, identifier, tier
      };

      await createPaymentIntentController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: "Invalid tier" });

      expect(logger.warn).toHaveBeenCalledWith(
        "Invalid tier specified for payment",
        {
          tier: undefined,
          username: undefined,
          identifier: undefined,
        }
      );
    });

    it("should handle partial request body parameters", async () => {
      req.body = {
        username: "testuser",
        // Missing identifier, tier
      };

      await createPaymentIntentController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: "Invalid tier" });

      expect(logger.warn).toHaveBeenCalledWith(
        "Invalid tier specified for payment",
        {
          tier: undefined,
          username: "testuser",
          identifier: undefined,
        }
      );
    });

    it("should log payment intent creation request details", async () => {
      req.body = {
        username: "logtest",
        identifier: "log-org",
        tier: "pro",
      };

      const mockPaymentIntent = {
        id: "pi_log_test",
        client_secret: "pi_log_secret",
      };

      mockCreate.mockResolvedValue(mockPaymentIntent);

      await createPaymentIntentController(req, res);

      // Verify that logging includes timestamp
      expect(logger.info).toHaveBeenCalledWith(
        "Payment intent creation requested",
        {
          username: "logtest",
          identifier: "log-org",
          tier: "pro",
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
          ),
        }
      );

      expect(logger.info).toHaveBeenCalledWith(
        "Payment intent created successfully",
        {
          username: "logtest",
          identifier: "log-org",
          tier: "pro",
          amount: 1000,
          currency: "usd",
          paymentIntentId: "pi_log_test",
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
          ),
        }
      );
    });
  });
});
