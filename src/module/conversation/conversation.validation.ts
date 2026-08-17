import { z } from "zod";
export const startConversationSchema = z.object({
  userId: z.string().min(1, "userId is required"),
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message is too long"),
});
