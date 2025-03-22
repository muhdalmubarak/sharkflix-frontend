// VideoGrid.tsx
import { VideoData } from '@/lib/supabase/types';
import { Card, CardContent } from "@/components/shadcn-ui/card";
import Image from "next/image";

interface VideoGridProps {
  videos: VideoData[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <Card key={video.id}>
          <CardContent className="p-0">
            <div className="relative h-48">
              <Image
                src={video.imageString}
                alt={video.title}
                fill
                className="rounded-t-lg object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">{video.title}</h3>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{video.views.toLocaleString()} views</span>
                <span>MYR {video.revenue.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
