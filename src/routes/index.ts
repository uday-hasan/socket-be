import { Router } from "express";
import notificationRouter from "../module/notification/notification.route";
import authRouter from "../module/auth/auth.routes";
import messageRouter from "../module/message/message.route";

const router = Router();

router.use("/notification", notificationRouter);
router.use("/auth", authRouter);
router.use("/messages", messageRouter);

export default router;
