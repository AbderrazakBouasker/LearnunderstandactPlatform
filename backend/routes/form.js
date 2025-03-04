import express from "express";
import { createForm, getForms, getForm, editForm, deleteForm } from "../controllers/forms.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

//CREATE
router.post("/create", verifyToken, createForm);

//READ
router.get("/", verifyToken, getForms);
router.get("/:id", verifyToken, getForm);

//UPDATE
router.patch("/:id/edit", verifyToken, editForm);

//DELETE
router.delete("/:id/delete", verifyToken, deleteForm);

export default router;
