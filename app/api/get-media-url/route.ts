import { NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_WASABI_REGION,
  endpoint: process.env.NEXT_PUBLIC_WASABI_ENDPOINT,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_WASABI_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_WASABI_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  const mediaSlug = process.env.NEXT_PUBLIC_MEDIA_SLUG ? process.env.NEXT_PUBLIC_MEDIA_SLUG + "/" : "";

  const command = new GetObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_WASABI_BUCKET_NAME!,
    Key: mediaSlug + key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1-hour expiry

  return NextResponse.json({ url });
}