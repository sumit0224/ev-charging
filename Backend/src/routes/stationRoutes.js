import express from "express";
import { getStations, addStation } from "../controllers/stationController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/", getStations);
router.post("/", authMiddleware, addStation);

export default router;