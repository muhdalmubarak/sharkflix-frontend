import {NextResponse} from "next/server";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/utils/auth";
import {createHash} from "crypto";

// Create an S3 client instance
const s3 = new S3Client({
    region: process.env.APP_AWS_REGION, // your AWS region, e.g., 'us-east-1'
    credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID!,  // Your access key
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY!, // Your secret key
    },
});

export async function POST(req: Request) {
    try {

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', {status: 401});
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const fileName = formData.get("fileName") as string;
        const folder = formData.get("folder") as string;
        const fileType = formData.get("fileType") as string;

        if (!file || !fileName || !folder || !fileType) {
            throw new Error("Missing required parameters");
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
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
            Bucket: process.env.APP_AWS_S3_BUCKET_NAME!,
            Key: mediaSlug + key,
            Body: fileBuffer,
            ContentType: fileType,
        });

        const response = await s3.send(command);

        if (response.$metadata.httpStatusCode === 200) {
            return NextResponse.json({message: "File uploaded successfully", objectKey: key});
        } else {
            console.error("Upload failed:", response);
            throw new Error("Upload failed");
        }

    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({error: "Failed to upload file"}, {status: 500});
    }
}





  