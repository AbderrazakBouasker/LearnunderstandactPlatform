import express from 'express';
import { createFeedback, getFeedbacks, getFeedback, deleteFeedback, getFeedbackByFormId } from '../controllers/feedbacks.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

//CREATE
// router.post("/:id", verifyToken, createFeedback);
//READ
router.get("/", verifyToken, getFeedbacks);
router.get("/:id", verifyToken, getFeedback);
router.get("/form/:id", verifyToken, getFeedbackByFormId);
//DELETE
router.delete("/:id/delete", verifyToken, deleteFeedback);

export default router;