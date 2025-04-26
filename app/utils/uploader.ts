// app/utils/uploader.ts

export async function uploadToStorage(file: File, path: string): Promise<string> {

    const formData = new FormData();

    formData.append("file", file); // actual file
    formData.append("fileName", path.split("/").pop()!);
    formData.append("folder", path.split("/").slice(0, -1).join("/"));
    formData.append("fileType", file.type);

    const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
    }

    const {objectKey} = await response.json();

    return objectKey;
}