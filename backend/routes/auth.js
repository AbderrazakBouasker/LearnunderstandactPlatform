import express from "express";
import { login, register, logout } from "../controllers/auth.js";
import { rateLimiter } from "../middleware/ratelimiter.js";

const router = express.Router();
router.post("/login", rateLimiter(1, 10), login);
router.post("/register", rateLimiter(1, 10), register);
router.post("/logout", rateLimiter(1, 10), logout);

export default router;
