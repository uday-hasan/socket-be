import type { Request, Response } from "express";
import NotificationService from "./notification.service";
import { notifyAll } from "../../ws/global";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const NotificationController = {
  createNotification: catchAsync(async (req: Request, res: Response) => {
    const { message } = req.body;
    const notification = await NotificationService.createNotification(message);
    if (res.app.locals.wss) {
      notifyAll(
        { type: "notification", payload: notification },
        res.app.locals.wss,
      );
    }
    sendResponse(res, {
      statusCode: 201,
      message: "Notification created successfully",
      data: notification,
    });
  }),
  getNotifications: catchAsync(async (req: Request, res: Response) => {
    const notifications = await NotificationService.getNotifications();

    sendResponse(res, {
      statusCode: 200,
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  }),
};

export default NotificationController;
