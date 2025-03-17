import express from "express";
import { login, register } from "../controllers/auth.js";
import { rateLimiter } from '../middleware/ratelimiter.js';

const router = express.Router();
//TODO: raja3 rate limit ll login
router.post("/login",  login);
router.post("/register", rateLimiter(1,10), register);

export default router;
