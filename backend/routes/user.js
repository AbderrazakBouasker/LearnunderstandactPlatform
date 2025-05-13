import express from "express";
import { getUser, getMe, updateUser } from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/ratelimiter.js";

const router = express.Router();

//READ ME
router.get("/me", rateLimiter(1, 100), verifyToken, getMe);
//READ USER
router.get("/:id", rateLimiter(1, 100), verifyToken, getUser);
//UPDATE USER
router.post("/:id", rateLimiter(1, 10), verifyToken, updateUser);

export default router;
