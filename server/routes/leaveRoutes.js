import { Router } from "express";
import { list, apply, review } from "../controllers/leaveController.js";
import { roles } from "../middleware/authMiddleware.js";
const router = Router();
router.get("/", list);
router.post("/", apply);
router.patch("/:id", roles("hr", "manager"), review);
export default router;
