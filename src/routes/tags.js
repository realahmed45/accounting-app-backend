import express from "express";
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  getPopularTags,
} from "../controllers/tagController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

router.route("/").get(getTags).post(createTag);

router.get("/popular", getPopularTags);

router.route("/:tagId").put(updateTag).delete(deleteTag);

export default router;
