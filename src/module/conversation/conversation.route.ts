import { Router } from "express";
import { conversationController } from "./conversation.controller.js";
import { authenticate } from "../../middleware/authenticate.js"; // adjust path if different
import { validateRequest } from "../../middleware/validateRequest.js"; // adjust path if different
import {
  startConversationSchema,
  sendMessageSchema,
} from "./conversation.validation.js";

const router = Router();

router.post(
  "/",
  authenticate,
  validateRequest(startConversationSchema),
  conversationController.start,
);

router.get(
  "/:conversationId/messages",
  authenticate,
  conversationController.getMessages,
);

router.post(
  "/:conversationId/messages",
  authenticate,
  validateRequest(sendMessageSchema),
  conversationController.sendMessage,
);

export default router;
