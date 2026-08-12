import { Router } from "express";
import notificationRouter from "../module/notification/notification.route";

const router = Router();

router.use("/notification", notificationRouter);

export default router;
