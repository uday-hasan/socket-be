import { Router } from "express";
import NotificationController from "./notification.controller";

const notificationRouter = Router();

notificationRouter.get("/", NotificationController.getNotifications);
notificationRouter.post("/", NotificationController.createNotification);

export default notificationRouter;
