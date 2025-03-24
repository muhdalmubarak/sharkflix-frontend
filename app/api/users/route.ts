// app/api/users/route.ts
import prisma from "@/app/utils/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createRequestLogger, redactSensitiveInfo } from "@/app/utils/request-logger";
import bcrypt from "bcrypt";

type CreateUserRequest = {
  email: string;
  password: string;
  role: string;
  user_otp: string;
  affiliateCode?: string | null;
  referredBy?: string | null;
}

export async function POST(req: Request) {
  const logger = createRequestLogger();
  logger.log(`POST /api/users - Request received at ${new Date().toISOString()}`);

  // Log headers for debugging (redacting sensitive info)
  const headers = Object.fromEntries(
    Array.from(req.headers.entries())
      .filter(([key]) => !['authorization', 'cookie'].includes(key.toLowerCase()))
  );
  logger.log(`Request headers:`, headers);

  // Initialize with null to satisfy TypeScript
  let userRequest: CreateUserRequest | null = null;

  try {
    // Log raw request for debugging, being careful with PII
    const rawBody = await req.text();
    try {
      // Try to parse and redact before logging
      const parsedBody = JSON.parse(rawBody);
      const redactedBody = redactSensitiveInfo(parsedBody);
      logger.log(`Request body (redacted):`, redactedBody);
    } catch (parseError) {
      // If can't parse, log length and first characters only
      logger.log(`Raw request body length: ${rawBody.length} chars. First 50 chars: ${rawBody.substring(0, 50)}...`);
    }

    // Parse request body
    userRequest = JSON.parse(rawBody) as CreateUserRequest;
    logger.log(`Parsed request:`, {
      email: userRequest.email ? `${userRequest.email.substring(0, 3)}...` : undefined,
      role: userRequest.role,
      hasPassword: !!userRequest.password,
      hasOtp: !!userRequest.user_otp,
      hasAffiliateCode: !!userRequest.affiliateCode,
      referredBy: userRequest.referredBy ? `${userRequest.referredBy.substring(0, 8)}...` : null
    });

    const { email, password, role, user_otp, affiliateCode, referredBy } = userRequest;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate required fields
    if (!email || !password || !role || !user_otp) {
      logger.warn("Missing required fields", {
        hasEmail: !!email,
        hasPassword: !!hashedPassword,
        hasRole: !!role,
        hasOtp: !!user_otp
      });
      return NextResponse.json({
        error: "Missing required fields",
        status: 'VALIDATION_ERROR',
        requestId: logger.requestId
      }, { status: 400 });
    }

    // Validate the affiliate code if provided
    let validatedAffiliateId: bigint | null = null;
    if (referredBy) {
      logger.log(`Validating affiliate code: ${referredBy.substring(0, 8)}...`);
      try {
        const affiliateUser = await prisma.user.findUnique({
          where: { affiliateCode: referredBy },
          select: { id: true, role: true }
        });

        if (!affiliateUser) {
          logger.warn(`Invalid affiliate code, no matching user found`);
        } else if (affiliateUser.role !== 'affiliate') {
          logger.warn(`Referenced user is not an affiliate. Role: ${affiliateUser.role}`);
        } else {
          logger.log(`Valid affiliate code, referenced user ID: ${affiliateUser.id}`);
          validatedAffiliateId = affiliateUser.id;
        }
      } catch (affiliateError) {
        logger.error(`Error validating affiliate code:`, logger.formatError(affiliateError));
        // Continue with user creation even if affiliate validation fails
      }
    }

    // Create user
    logger.log(`Creating new user with role: ${role}`);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword, // Store hashed password
        role,
        user_otp,
        affiliateCode,
      },
    });

    logger.log(`User created successfully. ID: ${newUser.id}`);

    // Handle affiliate tracking after user creation if needed
    if (validatedAffiliateId) {
      try {
        logger.log(`Creating affiliate tracking: User ${newUser.id} referred by Affiliate ${validatedAffiliateId}`);

        // Create the affiliate tracking record
        await prisma.affiliateTracking.create({
          data: {
            userId: newUser.id,
            affiliateUserId: validatedAffiliateId
          }
        });
        logger.log(`Successfully created affiliate tracking record`);
      } catch (affiliateError) {
        logger.error(`Failed to create affiliate tracking (non-fatal):`, logger.formatError(affiliateError));
        // Don't fail the whole operation if affiliate tracking fails
      }
    }

    return NextResponse.json({
      newUser: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      },
      status: 'SUCCESS',
      requestId: logger.requestId
    });

  } catch (error: any) {
    // Handle unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error(`Prisma error code: ${error.code}`, logger.formatError(error));

      if (error.code === 'P2002' && userRequest?.email) {
        try {
          logger.log(`Email already exists: ${userRequest.email.substring(0, 3)}...`);
          const existingUser = await prisma.user.findUnique({
            where: { email: userRequest.email },
            select: { id: true, role: true }
          });

          if (existingUser) {
            logger.log(`Found existing user with role: ${existingUser.role}`);
            return NextResponse.json({
              error: `This email is already registered as a ${existingUser.role}. Please try logging in instead.`,
              status: 'DUPLICATE_EMAIL',
              existingRole: existingUser.role,
              requestId: logger.requestId
            }, { status: 409 });
          }
        } catch (lookupError) {
          logger.error(`Error while looking up existing user:`, logger.formatError(lookupError));
        }
      } else if (error.code === 'P2003') {
        logger.error(`Foreign key constraint violation`, error.meta);
        return NextResponse.json({
          error: "Invalid reference to another record",
          details: error.meta,
          status: 'REFERENCE_ERROR',
          requestId: logger.requestId
        }, { status: 400 });
      } else if (error.code === 'P2025') {
        logger.error(`Record not found error`, error.meta);
        return NextResponse.json({
          error: "Referenced record not found",
          details: error.meta,
          status: 'NOT_FOUND_ERROR',
          requestId: logger.requestId
        }, { status: 400 });
      }
    }

    // Log the full error
    logger.error(`Failed to create user:`, logger.formatError(error));

    // Return appropriate error response
    return NextResponse.json({
      error: "Failed to create user",
      errorType: error.constructor?.name || typeof error,
      message: error.message || String(error),
      status: 'ERROR',
      requestId: logger.requestId
    }, { status: 500 });
  }
}
