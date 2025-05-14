import {NextResponse} from "next/server";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/utils/auth";
import {createHash} from "crypto";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

// Create an S3 client instance
const s3 = new S3Client({
    region: process.env.NEXT_PUBLIC_WASABI_REGION, // your AWS region, e.g., 'us-east-1'
    endpoint: process.env.NEXT_PUBLIC_WASABI_ENDPOINT,
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_WASABI_ACCESS_KEY_ID!,  // Your access key
        secretAccessKey: process.env.NEXT_PUBLIC_WASABI_SECRET_ACCESS_KEY!, // Your secret key
    },
    forcePathStyle: true,
});

export async function POST(req: Request) {
    try {

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', {status: 401});
        }

        const {fileName, folder, fileType} = await req.json();

        if (!fileName || !folder || !fileType) {
            throw new Error("Missing required parameters");
        }

        const mediaSlug = process.env.NEXT_PUBLIC_MEDIA_SLUG ? process.env.NEXT_PUBLIC_MEDIA_SLUG + "/" : "";
        const userFolderHash = createHash("md5").update(session.user.id.toString()).digest("hex") + "/";

        const lastDotIndex = fileName.lastIndexOf(".");
        let nameWithoutExtension = fileName;
        let extension = "";

        if (lastDotIndex !== -1) {
            nameWithoutExtension = fileName.substring(0, lastDotIndex);
            extension = fileName.substring(lastDotIndex + 1).toLowerCase();
        }

        nameWithoutExtension = createHash("md5").update(nameWithoutExtension + Date.now().toString()).digest("hex");
        const key = `${userFolderHash}${folder}/${nameWithoutExtension}${extension ? '.' + extension : ''}`;

        const command = new PutObjectCommand({
            Bucket: process.env.NEXT_PUBLIC_WASABI_BUCKET_NAME!,
            Key: mediaSlug + key,
            ContentType: fileType,
        });

        const url = await getSignedUrl(s3, command, {expiresIn: 3600});
        return NextResponse.json({message: "File uploaded successfully", url, objectKey: key});
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({error: "Failed to upload file"}, {status: 500});
    }
}





  