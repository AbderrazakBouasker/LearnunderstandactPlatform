import express from "express";
import { createPaymentIntentController } from "../controllers/stripe.js";

const router = express.Router();

// Route to create a payment intent
router.post("/create-payment-intent", createPaymentIntentController);

export default router;
