-- CreateEnum
CREATE TYPE "device_type" AS ENUM ('webcam', 'mobile', 'screen');

-- CreateTable
CREATE TABLE "User" (
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TEXT,
    "image" TEXT,
    "role" TEXT,
    "password" TEXT,
    "job_title" TEXT,
    "company" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "user_otp" TEXT,
    "current_balance" DECIMAL DEFAULT 0.00,
    "total_revenue" DECIMAL DEFAULT 0.00,
    "request_approved" BOOLEAN NOT NULL DEFAULT true,
    "id" BIGSERIAL NOT NULL,
    "affiliateCode" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" BIGSERIAL NOT NULL,
    "imageString" TEXT,
    "title" TEXT,
    "age" BIGINT,
    "duration" DOUBLE PRECISION,
    "overview" TEXT,
    "release" BIGINT,
    "videoSource" TEXT,
    "category" TEXT,
    "youtubeString" TEXT,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "price" BIGINT DEFAULT 0,
    "userId" BIGINT,
    "totalviews" BIGINT,
    "approval_status" TEXT,
    "isaffiliate" BOOLEAN DEFAULT false,
    "commissionPercentage" DECIMAL DEFAULT 0.00,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchased_videos" (
    "user_email" TEXT,
    "youtube_url" TEXT,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id" BIGSERIAL NOT NULL,

    CONSTRAINT "purchased_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchList" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT,
    "movieId" BIGINT,

    CONSTRAINT "WatchList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT,
    "token" TEXT,
    "expires" TIMESTAMPTZ(6)
);

-- CreateTable
CREATE TABLE "events" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "totalTickets" INTEGER NOT NULL,
    "availableTickets" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "streamUrl" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "userId" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "isaffiliate" BOOLEAN DEFAULT false,
    "commissionPercentage" DECIMAL,
    "bookingDate" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "trailerUrl" TEXT,
    "agoraChannel" UUID,
    "activeStreams" INTEGER DEFAULT 0,
    "maxCoStreamers" INTEGER DEFAULT 4,
    "defaultLayout" VARCHAR(255) NOT NULL DEFAULT 'grid',
    "streamLayout" JSONB,
    "isMultiStream" BOOLEAN NOT NULL DEFAULT false,
    "isTopRated" BOOLEAN DEFAULT false,
    "soldOut" BOOLEAN DEFAULT false,
    "recordingUrl" TEXT,
    "allowRecordingAccess" BOOLEAN DEFAULT false,
    "recordingAccessCode" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamSession" (
    "id" BIGSERIAL NOT NULL,
    "eventId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "layout" VARCHAR(255) NOT NULL DEFAULT 'grid',
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stream_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" BIGSERIAL NOT NULL,
    "ticketCode" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "purchaseDate" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT DEFAULT 'active',
    "eventId" BIGINT,
    "userId" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" BIGSERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "ticketId" BIGINT,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB DEFAULT '{}',
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_sent_at" TIMESTAMPTZ(6),
    "userId" BIGINT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateRevenue" (
    "id" BIGSERIAL NOT NULL,
    "affiliateId" BIGINT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" BIGINT NOT NULL,
    "isPaid" BOOLEAN DEFAULT false,
    "paidAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT timezone('utc'::text, now()),
    "referredUserId" BIGINT,
    "transactionId" TEXT NOT NULL,

    CONSTRAINT "affiliaterevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateTracking" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT,
    "affiliateUserId" BIGINT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorRevenue" (
    "id" BIGSERIAL NOT NULL,
    "creatorId" BIGINT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" BIGINT NOT NULL,
    "isPaid" BOOLEAN DEFAULT false,
    "paidAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT timezone('utc'::text, now()),
    "referredUserId" BIGINT,
    "transactionId" TEXT NOT NULL,
    "payoutId" INTEGER,

    CONSTRAINT "CreatorRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorPayout" (
    "id" SERIAL NOT NULL,
    "creatorId" BIGINT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "commissionAmount" DECIMAL(10,2) NOT NULL,
    "payoutAmount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "paymentDetails" JSONB,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" BIGSERIAL NOT NULL,
    "paymentId" BIGINT NOT NULL,
    "amount" DECIMAL,
    "status" TEXT,
    "reason" TEXT,
    "refundedAt" TIMESTAMPTZ(6),
    "transactionId" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "metadata" JSON,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mailing" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT,
    "content" JSONB,
    "status" TEXT DEFAULT '''draft''',
    "userId" BIGINT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mailing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventNote" (
    "id" BIGSERIAL NOT NULL,
    "content" TEXT,
    "eventId" BIGINT,
    "userId" BIGINT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "EventNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_user_current_balance" ON "User"("current_balance");

-- CreateIndex
CREATE INDEX "idx_user_name" ON "User"("name");

-- CreateIndex
CREATE INDEX "idx_user_otp" ON "User"("user_otp");

-- CreateIndex
CREATE INDEX "idx_user_role" ON "User"("role");

-- CreateIndex
CREATE INDEX "idx_user_total_revenue" ON "User"("total_revenue");

-- CreateIndex
CREATE INDEX "Movie_category_idx" ON "Movie"("category");

-- CreateIndex
CREATE INDEX "Movie_approval_status_idx" ON "Movie"("approval_status");

-- CreateIndex
CREATE INDEX "Movie_createdAt_idx" ON "Movie"("createdAt");

-- CreateIndex
CREATE INDEX "idx_movie_userid_status_createdat" ON "Movie"("userId", "approval_status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "events_agoraChannel_key" ON "events"("agoraChannel");

-- CreateIndex
CREATE UNIQUE INDEX "events_recordingAccessCode_key" ON "events"("recordingAccessCode");

-- CreateIndex
CREATE INDEX "events_status_date_idx" ON "events"("status", "date");

-- CreateIndex
CREATE INDEX "events_userId_status_idx" ON "events"("userId", "status");

-- CreateIndex
CREATE INDEX "events_isLive_status_idx" ON "events"("isLive", "status");

-- CreateIndex
CREATE INDEX "events_date_idx" ON "events"("date");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_userId_idx" ON "events"("userId");

-- CreateIndex
CREATE INDEX "idx_events_status_toprated_date" ON "events"("isTopRated" DESC, "status", "date");

-- CreateIndex
CREATE INDEX "idx_stream_sessions_active" ON "StreamSession"("active");

-- CreateIndex
CREATE INDEX "idx_stream_sessions_event" ON "StreamSession"("eventId");

-- CreateIndex
CREATE INDEX "idx_stream_sessions_user" ON "StreamSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticketCode_key" ON "tickets"("ticketCode");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_qrCode_key" ON "tickets"("qrCode");

-- CreateIndex
CREATE INDEX "tickets_status_eventId_idx" ON "tickets"("status", "eventId");

-- CreateIndex
CREATE INDEX "tickets_userId_status_idx" ON "tickets"("userId", "status");

-- CreateIndex
CREATE INDEX "tickets_purchaseDate_idx" ON "tickets"("purchaseDate");

-- CreateIndex
CREATE INDEX "idx_tickets_status_userid_eventid" ON "tickets"("status", "userId", "eventId");

-- CreateIndex
CREATE INDEX "tickets_eventId_idx" ON "tickets"("eventId");

-- CreateIndex
CREATE INDEX "tickets_status_eventId_userId_idx" ON "tickets"("status", "eventId", "userId");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_userId_idx" ON "tickets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_ticketId_key" ON "payments"("ticketId");

-- CreateIndex
CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");

-- CreateIndex
CREATE INDEX "payments_paymentMethod_idx" ON "payments"("paymentMethod");

-- CreateIndex
CREATE INDEX "idx_payments_status_method_createdat" ON "payments"("status", "paymentMethod", "createdAt");

-- CreateIndex
CREATE INDEX "idx_notifications_type_email_sent" ON "notifications"("type", "email_sent", "created_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "AffiliateRevenue_referredUserId_idx" ON "AffiliateRevenue"("referredUserId");

-- CreateIndex
CREATE INDEX "idx_affiliate_revenue_affiliateid_ispaid_createdat" ON "AffiliateRevenue"("affiliateId", "isPaid", "createdAt");

-- CreateIndex
CREATE INDEX "idx_affiliaterevenue_affiliateid" ON "AffiliateRevenue"("affiliateId");

-- CreateIndex
CREATE INDEX "idx_affiliaterevenue_createdat" ON "AffiliateRevenue"("createdAt");

-- CreateIndex
CREATE INDEX "idx_affiliaterevenue_source" ON "AffiliateRevenue"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "AffiliateTracking_affiliateUserId_idx" ON "AffiliateTracking"("affiliateUserId");

-- CreateIndex
CREATE INDEX "AffiliateTracking_userId_idx" ON "AffiliateTracking"("userId");

-- CreateIndex
CREATE INDEX "CreatorRevenue_payoutId_idx" ON "CreatorRevenue"("payoutId");

-- CreateIndex
CREATE INDEX "CreatorRevenue_affiliateid_idx" ON "CreatorRevenue"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorRevenue_createdat_idx" ON "CreatorRevenue"("createdAt");

-- CreateIndex
CREATE INDEX "CreatorRevenue_referredUserId_idx" ON "CreatorRevenue"("referredUserId");

-- CreateIndex
CREATE INDEX "CreatorRevenue_sourcetype_sourceid_idx" ON "CreatorRevenue"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "idx_creator_revenue_creatorid_createdat" ON "CreatorRevenue"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_creator_revenue_creatorid_ispaid_amount" ON "CreatorRevenue"("creatorId", "isPaid", "amount");

-- CreateIndex
CREATE INDEX "CreatorPayout_creatorId_idx" ON "CreatorPayout"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorPayout_status_idx" ON "CreatorPayout"("status");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_paymentId_key" ON "refunds"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_transactionId_key" ON "refunds"("transactionId");

-- CreateIndex
CREATE INDEX "refunds_status_idx" ON "refunds"("status");

-- CreateIndex
CREATE INDEX "refunds_paymentId_idx" ON "refunds"("paymentId");

-- CreateIndex
CREATE INDEX "Mailing_userId_idx" ON "Mailing"("userId");

-- CreateIndex
CREATE INDEX "Mailing_status_idx" ON "Mailing"("status");

-- AddForeignKey
ALTER TABLE "Movie" ADD CONSTRAINT "Movie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WatchList" ADD CONSTRAINT "WatchList_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WatchList" ADD CONSTRAINT "WatchList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamSession" ADD CONSTRAINT "StreamSession_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "StreamSession" ADD CONSTRAINT "fk_event" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateRevenue" ADD CONSTRAINT "fk_affiliate" FOREIGN KEY ("affiliateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AffiliateRevenue" ADD CONSTRAINT "fk_referred_user" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AffiliateTracking" ADD CONSTRAINT "AffiliateTracking_affiliateUserId_fkey" FOREIGN KEY ("affiliateUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AffiliateTracking" ADD CONSTRAINT "AffiliateTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CreatorRevenue" ADD CONSTRAINT "CreatorRevenue_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CreatorRevenue" ADD CONSTRAINT "CreatorRevenue_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "CreatorPayout"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CreatorRevenue" ADD CONSTRAINT "CreatorRevenue_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CreatorPayout" ADD CONSTRAINT "CreatorPayout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Mailing" ADD CONSTRAINT "Mailing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventNote" ADD CONSTRAINT "EventNote_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventNote" ADD CONSTRAINT "EventNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

