import express from "express";
import { createForm, getForms, getForm, editForm, deleteForm } from "../controllers/forms.js";
import { verifyToken } from "../middleware/auth.js";
import { rateLimiter } from '../middleware/ratelimiter.js';

const router = express.Router();

//CREATE
router.post("/create", rateLimiter(1,100), verifyToken, createForm);


//READ
router.get("/", rateLimiter(1,100), verifyToken, getForms);


//READ BY ID
router.get("/:id", rateLimiter(1,100), verifyToken, getForm);


//UPDATE
router.patch("/:id/edit", rateLimiter(1,100), verifyToken, editForm);


//DELETE
router.delete("/:id/delete", rateLimiter(1,100), verifyToken, deleteForm);

export default router;
