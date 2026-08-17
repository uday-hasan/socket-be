import { Router } from "express";
import { getConversation } from "./message.controller";
import { authenticate } from "../../middleware/authenticate";

const messageRouter = Router();
messageRouter.get("/:userId", authenticate, getConversation);
export default messageRouter;
