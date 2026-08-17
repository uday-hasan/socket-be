import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { MessageService } from "./message.service";
import { sendResponse } from "../../utils/sendResponse";

// message.controller.ts
export const getConversation = catchAsync(
  async (req: Request, res: Response) => {
    const currentUserId = req.user!.userId; // from your normal auth middleware
    const { userId: otherUserId } = req.params as { userId: string };
    const { before } = req.query;

    const messages = await MessageService.getConversation(
      currentUserId,
      otherUserId,
      50,
      before as string | undefined,
    );

    sendResponse(res, {
      statusCode: 200,
      message: "Conversation fetched successfully",
      data: messages,
    });
  },
);
