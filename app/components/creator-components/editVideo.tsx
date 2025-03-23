"use client";
import {useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn-ui/dialog";
import { Input } from "@/components/shadcn-ui/input";
import { Label } from "@/components/shadcn-ui/label";
import { Textarea } from "@/components/shadcn-ui/textarea";
import { Progress } from "@/components/shadcn-ui/progress";
import { S3 } from "aws-sdk";
import { createClient } from "@supabase/supabase-js";
import { useSession } from "next-auth/react";
import { Edit } from "lucide-react";
import prisma from "../../utils/db";

import { AnyCnameRecord } from "dns";

// Initialize Supabase client
const supabase = createClient(
  "https://bfagtxnithzkcxbadamg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmYWd0eG5pdGh6a2N4YmFkYW1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODQ4Mjc4MiwiZXhwIjoyMDQ0MDU4NzgyfQ.-PQP5NyAv32rTwaqCe4T24zuuDo0Iz5EbenyeTq52ZY"
);

interface iMovie {
    movieid:number;
  }


export default   function EditVideo({movieid}:iMovie)  {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoTitle, setVideoTitle] = useState<any | "">("");
  const [videoDesc, setVideoDesc] = useState<any | "">("");
  const [price, setPrice] = useState<any | "">("");
  const [data, setData] = useState(null);
  const bucketName = "video_videohub";
  const { data: session } = useSession(); // Get user session
  const normalizeFilename = (filename: string): string => {
    return filename.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
  };

  const fetchData = async () => {
    debugger
    try {
      const result = await supabase.from('Movie')       
      .select('*')           
      .eq('id', movieid);  
      if(result?.data)
      {
          const res  =result.data[0];
          setPrice(res.price);
          setVideoTitle(res.title);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

 

  const handleUpload = async () => {
  

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const { data, error } = await supabase.from("Movie")
      .update([ 
        {
          title: videoTitle,
          price: price
        },
      ])
      .eq('id', movieid); 

      if (error) {
        console.error("Error updating data:", error);
      } else {
        alert("Update successful!");
       
      }
    } catch (error) {
      
      alert("Error updating data");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" onClick={()=>fetchData()} >
          <Edit className="w-4 h-4"  />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Video</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Title</Label>
            <Input
              className="col-span-3"
              placeholder="Video Title"
              value={videoTitle}
              id="title"
              onChange={(e) => setVideoTitle(e.target.value || null)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="price">Price in MYR</Label>
            <Input
              type="text"
              className="col-span-3"
              placeholder="Type price here"
              value={price}
              id="description"
              onChange={(e) => setPrice(e.target.value || null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
