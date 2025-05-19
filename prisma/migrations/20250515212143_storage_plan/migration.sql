-- CreateTable
CREATE TABLE "user_storage_plan" (
    "id" BIGSERIAL NOT NULL,
    "plan_type" TEXT DEFAULT '''Free''',
    "quota_gb" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT,
    "user_id" BIGINT,
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "end_date" TIMESTAMP(3),

    CONSTRAINT "user_storage_plan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_storage_plan" ADD CONSTRAINT "user_storage_plan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
