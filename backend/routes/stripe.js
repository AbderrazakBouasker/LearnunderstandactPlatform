import express from "express";
import Stripe from "stripe";
import logger from "../logger.js";

// Check if STRIPE_SECRET_KEY is defined
if (!process.env.STRIPE_SECRET_KEY) {
  console.error(
    "ERROR: STRIPE_SECRET_KEY environment variable is not defined!"
  );
  console.error(
    "Make sure to set your Stripe secret key in the environment variables."
  );
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const router = express.Router();

// Route to create a payment intent
router.post("/create-payment-intent", async (req, res) => {
  // Check if Stripe is properly initialized
  if (!stripe) {
    logger.error("Stripe payment attempt failed: Stripe not configured");
    return res.status(500).send({
      error:
        "Stripe is not configured. Please set the STRIPE_SECRET_KEY environment variable.",
    });
  }

  const { username, identifier, tier } = req.body;

  logger.info("Payment intent creation requested", {
    username,
    identifier,
    tier,
    timestamp: new Date().toISOString(),
  });

  // Price mapping (e.g., in cents)
  const prices = {
    pro: 1000, // $10.00
    enterprise: 5000, // $50.00
  };

  if (!prices[tier]) {
    logger.warn("Invalid tier specified for payment", {
      tier,
      username,
      identifier,
    });
    return res.status(400).send({ error: "Invalid tier" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: prices[tier],
      currency: "usd",
      metadata: {
        username,
        identifier,
        tier,
      },
    });

    logger.info("Payment intent created successfully", {
      username,
      identifier,
      tier,
      amount: prices[tier],
      currency: "usd",
      paymentIntentId: paymentIntent.id,
      timestamp: new Date().toISOString(),
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    logger.error("Payment intent creation failed", {
      error: err.message,
      stack: err.stack,
      username,
      identifier,
      tier,
      timestamp: new Date().toISOString(),
    });
    res.status(500).send({ error: "Payment intent failed" });
  }
});
export default router;
