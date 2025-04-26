// app/utils/uploader.ts

export async function uploadToStorage(file: File, path: string): Promise<string> {
    const fileName = path.split("/").pop()!;
    const folder = path.split("/").slice(0, -1).join("/");

    // Get Pre-signed URL from server
    const presignResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            fileName: fileName,
            folder: folder,
            fileType: file.type,
        }),
    });

    if (!presignResponse.ok) {
        const errorData = await presignResponse.json();
        throw new Error(errorData.error);
    }

    const {url, objectKey} = await presignResponse.json();

    // Upload the file directly to S3 using the presigned URL
    const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": file.type,
        },
        body: file,
    });

    if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
    }

    return objectKey;
}