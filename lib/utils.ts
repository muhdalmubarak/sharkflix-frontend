import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import {format} from "date-fns" // Make sure date-fns is installed

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(input: string | number | Date): string {
    const date = new Date(input)
    return format(date, "LLL dd, y") // Returns format like "Feb 15, 2024"
}

// Alternative format options:
export function formatDateTime(input: string | number | Date): string {
    const date = new Date(input)
    return format(date, "LLL dd, y 'at' HH:mm") // Returns format like "Feb 15, 2024 at 13:45"
}

// You can also use this more flexible format function
export function formatCustomDate(input: string | number | Date, formatStr: string): string {
    const date = new Date(input)
    return format(date, formatStr)
}

export function generateMediaUrl(path: string) {
    if (!path) return "";
    //https://<your-bucket-name>.s3.<region>.amazonaws.com/c4ca4238a0b923820dcc509a6f75849b/thumbnails/ef6e84aec5aa557f5e40bfd55eba0b4d.png
    console.log(path.startsWith("http") ? path : `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${process.env.NEXT_PUBLIC_MEDIA_SLUG}/${path}`)
    return path.startsWith("http") ? path : `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${process.env.NEXT_PUBLIC_MEDIA_SLUG}/${path}`
}