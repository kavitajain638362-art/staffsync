import { Router } from "express";
import {
  list,
  create,
  update,
  remove,
} from "../controllers/announcementController.js";
import { roles } from "../middleware/authMiddleware.js";
const router = Router();
router.get("/", list);
router.post("/", roles("hr", "manager"), create);
router.patch("/:id", roles("hr", "manager"), update);
router.delete("/:id", roles("hr", "manager"), remove);
export default router;
