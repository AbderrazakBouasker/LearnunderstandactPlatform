import express from 'express';
import { createFeedback, getFeedbacks, getFeedback, deleteFeedback, getFeedbackByFormId } from '../controllers/feedbacks.js';
import { verifyToken } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/ratelimiter.js';

const router = express.Router();

//CREATE
//route is handled directly in index.js with file upload middleware
//READ
router.get("/", rateLimiter(1,100), verifyToken, getFeedbacks); // Added parentheses to call the function
router.get("/:id", rateLimiter(1,100), verifyToken, getFeedback);
router.get("/form/:id", verifyToken, getFeedbackByFormId);
//DELETE
router.delete("/:id/delete", rateLimiter(1,100), verifyToken, deleteFeedback);

export default router;