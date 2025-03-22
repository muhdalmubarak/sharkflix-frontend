// app/utils/debug-helpers.ts
import prisma from "@/app/utils/db";
import { User } from "@prisma/client";

/**
 * Debug helper to validate affiliate code before attempting to use it
 */
export async function validateAffiliateCode(affiliateCode: string | null): Promise<{
  valid: boolean;
  affiliateUser?: {
    id: number;
    email: string | null;
    role: string | null;
    affiliateCode: string | null;
  } | null;
  error?: string;
}> {
  if (!affiliateCode) {
    return { valid: false, error: "No affiliate code provided" };
  }

  try {
    console.log(`[DEBUG] Validating affiliate code: ${affiliateCode.substring(0, 8)}...`);

    const affiliateUser = await prisma.user.findUnique({
      where: { affiliateCode },
      select: {
        id: true,
        email: true,
        role: true,
        affiliateCode: true,
      }
    });

    if (!affiliateUser) {
      console.log(`[DEBUG] No user found with affiliate code: ${affiliateCode.substring(0, 8)}...`);
      return {
        valid: false,
        error: "Invalid affiliate code - no matching user found"
      };
    }

    if (affiliateUser.role !== 'affiliate') {
      console.log(`[DEBUG] User with affiliate code is not an affiliate. Role: ${affiliateUser.role}`);
      return {
        valid: false,
        affiliateUser,
        error: `User with this code has role '${affiliateUser.role}', expected 'affiliate'`
      };
    }

    console.log(`[DEBUG] Valid affiliate code for user ID: ${affiliateUser.id}`);
    return {
      valid: true,
      affiliateUser
    };
  } catch (error: any) {
    console.error("[DEBUG] Error validating affiliate code:", error);
    return {
      valid: false,
      error: `Validation error: ${error.message}`
    };
  }
}

/**
 * Debug helper to check if AffiliateTracking record can be created
 */
export async function checkAffiliateTracking(
  userId: number,
  affiliateUserId: number
): Promise<{
  canCreate: boolean;
  existingRecord?: any;
  error?: string;
}> {
  try {
    console.log(`[DEBUG] Checking affiliate tracking: User ${userId}, Affiliate ${affiliateUserId}`);

    // Check if both users exist
    const [user, affiliateUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } }),
      prisma.user.findUnique({ where: { id: affiliateUserId }, select: { id: true, role: true } })
    ]);

    if (!user) {
      return { canCreate: false, error: `User with ID ${userId} not found` };
    }

    if (!affiliateUser) {
      return { canCreate: false, error: `Affiliate user with ID ${affiliateUserId} not found` };
    }

    if (affiliateUser.role !== 'affiliate') {
      return {
        canCreate: false,
        error: `User ${affiliateUserId} has role '${affiliateUser.role}', expected 'affiliate'`
      };
    }

    // Check if tracking record already exists
    const existingRecord = await prisma.affiliateTracking.findUnique({
      where: {
        userId_affiliateUserId: {
          userId,
          affiliateUserId
        }
      }
    });

    if (existingRecord) {
      console.log(`[DEBUG] Affiliate tracking record already exists:`, existingRecord);
      return {
        canCreate: false,
        existingRecord,
        error: 'Tracking record already exists'
      };
    }

    return { canCreate: true };
  } catch (error: any) {
    console.error("[DEBUG] Error checking affiliate tracking:", error);
    return {
      canCreate: false,
      error: `Check error: ${error.message}`
    };
  }
}
