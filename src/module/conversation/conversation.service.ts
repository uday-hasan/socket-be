import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/AppError.js";

// Always call THIS, never prisma.conversation.create() directly — it
// guarantees the same pair of users always maps to the same single row,
// regardless of who messaged whom first. See the sort() below.
export async function getOrCreateConversation(
  userId1: string,
  userId2: string,
) {
  if (userId1 === userId2) {
    throw new AppError("Cannot start a conversation with yourself", 400);
  }

  const [userAId, userBId] = [userId1, userId2].sort();

  const existing = await prisma.conversation.findUnique({
    where: {
      userAId_userBId: {
        userAId: userAId as string,
        userBId: userBId as string,
      },
    },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: { userAId: userAId as string, userBId: userBId as string },
  });
}

// Shared guard used by both getMessages and sendMessage — makes sure the
// requesting user is actually one of the two people in this conversation,
// not just any authenticated user who happens to know the conversationId
async function assertParticipant(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }
  if (conversation.userAId !== userId && conversation.userBId !== userId) {
    throw new AppError("You are not a participant in this conversation", 403);
  }

  return conversation;
}

export const conversationService = {
  getOrCreateConversation,

  async startConversation(currentUserId: string, otherUserId: string) {
    return getOrCreateConversation(currentUserId, otherUserId);
  },

  async getMessages(conversationId: string, userId: string) {
    // Security check FIRST — without this, any logged-in user could read
    // any conversation just by guessing/knowing its id
    await assertParticipant(conversationId, userId);

    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        readAt: true,
        createdAt: true,
      },
    });
  },

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const conversation = await assertParticipant(conversationId, senderId);

    const message = await prisma.message.create({
      data: { conversationId, senderId, content },
    });

    // Figure out who the OTHER person is, so the controller can notify
    // them even if they don't currently have this chat open
    const recipientId =
      conversation.userAId === senderId
        ? conversation.userBId
        : conversation.userAId;

    return { message, recipientId };
  },
};
