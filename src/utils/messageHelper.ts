import { prisma } from "../config/database";
import { AppError } from "../utils/AppError";

// Always call THIS, never prisma.conversation.create() directly, whenever
// you need "the conversation between these two users." It guarantees the
// same pair of users always maps to the same single row, regardless of
// who initiated it.
export async function getOrCreateConversation(
  userId1: string,
  userId2: string,
) {
  if (userId1 === userId2) {
    throw new AppError("Cannot create a conversation with yourself", 400);
  }

  if (!userId1 || !userId2) {
    throw new AppError("Invalid user IDs", 400);
  }
  // Sort so the pair is always stored in the same order — "alice, bob" and
  // "bob, alice" both become the exact same (userAId, userBId) pair here.
  // This is what makes the @@unique constraint in the schema actually work
  // as intended.
  const [userAId, userBId] = [userId1, userId2].sort();

  // Try to find an existing conversation for this exact pair first
  const existing = await prisma.conversation.findUnique({
    where: {
      userAId_userBId: {
        userAId: userAId as string,
        userBId: userBId as string,
      },
    },
  });

  if (existing) return existing;

  // None yet — create it. If two requests race to create the same
  // conversation simultaneously, the @@unique constraint in the DB is the
  // real safety net; this function alone can't fully prevent that race,
  // but it makes it extremely unlikely in practice.
  return prisma.conversation.create({
    data: { userAId: userAId as string, userBId: userBId as string },
  });
}
