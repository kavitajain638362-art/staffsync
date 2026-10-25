import { Router } from "express";
import { list, create } from "../controllers/trainingController.js";
import { roles } from "../middleware/authMiddleware.js";
const router = Router();
router.get("/", list);
router.post("/", roles("hr", "manager"), create);
export default router;
