import { Role } from '@/generated/prisma/enums';

// ================================
// GLOBAL TYPE AUGMENTATIONS
// Extends Express's built-in Request type to include
// our custom properties (like the authenticated user).
//
// After authenticate middleware runs, req.user is available
// in all subsequent route handlers — fully typed.
// ================================

declare global {
  namespace Express {
    interface Request {
      // Set by the authenticate middleware after verifying the access token
      user?: {
        userId: string;
        role: Role;
      };
    }
  }
}

export {};
