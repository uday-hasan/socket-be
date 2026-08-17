import { prisma } from "../../config/database";

const createMessage = async (
  senderId: string,
  recipientId: string,
  text: string,
) => {
  return prisma.messages.create({
    data: { senderId, recipientId, text },
  });
};

const getConversation = async (
  userA: string,
  userB: string,
  limit = 50,
  before?: string,
) => {
  return prisma.messages.findMany({
    where: {
      OR: [
        { senderId: userA, recipientId: userB }, // senderId -> recipientId
        { senderId: userB, recipientId: userA },
      ],
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};

export const MessageService = { createMessage, getConversation };
