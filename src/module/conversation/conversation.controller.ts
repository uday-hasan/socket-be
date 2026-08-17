import type { Request, Response } from "express";
import { conversationService } from "./conversation.service.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { AppError } from "../../utils/AppError.js";

// Matches the shape createWebSocketServer() now returns, stashed on
// app.locals the same way app.locals.wss already was
type Broadcaster = (channel: string, data: unknown) => void;

export const conversationController = {
  // POST /conversations — { userId: <other person's id> }
  // Returns an existing conversation if one already exists for this pair,
  // or creates one. The frontend calls this before it has a conversationId
  // yet — e.g. from a "message this user" button on a profile.
  start: catchAsync(async (req: Request, res: Response) => {
    const { userId: otherUserId } = req.body;
    if (!otherUserId) throw new AppError("userId is required", 400);

    const conversation = await conversationService.startConversation(
      req.user!.userId,
      otherUserId,
    );

    sendResponse(res, {
      statusCode: 200,
      message: "Conversation ready",
      data: { conversation },
    });
  }),

  // GET /conversations/:conversationId/messages
  getMessages: catchAsync(async (req: Request, res: Response) => {
    const { conversationId } = req.params as { conversationId: string };

    const messages = await conversationService.getMessages(
      conversationId,
      req.user!.userId,
    );

    sendResponse(res, {
      statusCode: 200,
      message: "Messages retrieved successfully",
      data: { messages },
    });
  }),

  // POST /conversations/:conversationId/messages — { content: "..." }
  sendMessage: catchAsync(async (req: Request, res: Response) => {
    const { conversationId } = req.params as { conversationId: string };
    const { content } = req.body;

    const { message, recipientId } = await conversationService.sendMessage(
      conversationId,
      req.user!.userId,
      content,
    );

    const broadcastToChannel = req.app.locals.broadcastToChannel as
      | Broadcaster
      | undefined;

    if (broadcastToChannel) {
      // Delivers to whoever's actively subscribed to THIS conversation
      // right now (i.e. has the chat window open) — both participants
      // receive their own message back too, which is what lets the
      // sender's UI update from the real persisted row instead of an
      // optimistic local copy.
      broadcastToChannel(`conversation:${conversationId}`, message);

      // ALSO ping the recipient's personal channel — this covers the case
      // where they're logged in but don't have this specific conversation
      // open (e.g. browsing elsewhere in the app). This is what a "new
      // message" badge elsewhere in the UI would listen for.
      broadcastToChannel(`user:${recipientId}`, {
        type: "new_message",
        conversationId,
        message,
      });
    }

    sendResponse(res, {
      statusCode: 201,
      message: "Message sent",
      data: { message },
    });
  }),
};
