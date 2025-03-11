import express from "express";
import { login, register } from "../controllers/auth.js";
import { rateLimiter } from '../middleware/ratelimiter.js';

const router = express.Router();

router.post("/login", rateLimiter(1,10), login);
router.post("/register", rateLimiter(1,10), register);

export default router;
