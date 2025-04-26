// app/components/creator-components/CreateEventDialog.tsx
"use client";

import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/shadcn-ui/textarea";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Label} from "@/components/shadcn-ui/label";
import {Checkbox} from "@/components/shadcn-ui/checkbox";
import {uploadToStorage} from "@/app/utils/uploader";

export function CreateEventDialog() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isAffiliateEvent, setIsAffiliateEvent] = useState(false);
    const [commissionValue, setCommissionValue] = useState<string>("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [trailerFile, setTrailerFile] = useState<File | null>(null);
    const [recordingFile, setRecordingFile] = useState<File | null>(null); // New state for recording file
    const [fileSize, setFileSize] = useState<any | "">("");
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [soldOut, setSoldOut] = useState(false); // New state for soldOut

    // Add form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        bookingDate: '',
        price: '',
        totalTickets: '',
        streamUrl: '',
        allowRecordingAccess: false, // New field for controlling recording access
    });

    const handleTrailerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const sizeInMB = (file.size / (1024 * 1024)).toFixed(2); // Convert bytes to MB
            setFileSize(sizeInMB);
            setTrailerFile(file);
            const previewUrl = URL.createObjectURL(file);
            setVideoPreview(previewUrl);
        }
    };

    // Add recording file change handler
    const handleRecordingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setRecordingFile(file);
        }
    };

    // Add helper function for file name normalization
    const normalizeFilename = (filename: string): string => {
        return filename.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
    };

    // Add image file change handler
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
        }
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle checkbox changes
    const handleCheckboxChange = (checked: boolean) => {
        setIsAffiliateEvent(checked);
        if (!checked) {
            setCommissionValue(""); // Reset commission when unchecking
        }
    };

    // Handle recording access checkbox
    const handleRecordingAccessChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            allowRecordingAccess: checked
        }));
    };

    // Handle soldOut checkbox
    const handleSoldOutChange = (checked: boolean) => {
        setSoldOut(checked);
    };

    const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "" || (/^\d*\.?\d*$/.test(value) && parseFloat(value) <= 100)) {
            setCommissionValue(value);
        }
    };

    // Add this helper function at the top level of your component
    const getMinDateTime = () => {
        const now = new Date();
        return now.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:mm
    };

    // Generate a unique access code for recording
    const generateAccessCode = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = '';
            let trailerUrl = '';
            let recordingUrl = '';

            if (imageFile) {
                const normalizedImageName = normalizeFilename(imageFile.name);
                const imagePath = `event-images/${normalizedImageName}`;
                imageUrl = await uploadToStorage(imageFile, imagePath);
            }

            if (trailerFile) {
                const normalizedTrailerName = normalizeFilename(trailerFile.name);
                const trailerPath = `event-trailers/${normalizedTrailerName}`;
                trailerUrl = await uploadToStorage(trailerFile, trailerPath);
            }

            // Upload recording file if provided
            if (recordingFile) {
                const normalizedRecordingName = normalizeFilename(recordingFile.name);
                const recordingPath = `event-recordings/${normalizedRecordingName}`;
                recordingUrl = await uploadToStorage(recordingFile, recordingPath);
            }

            // Generate access code only if recording is provided and access is allowed
            const recordingAccessCode = (recordingFile && formData.allowRecordingAccess)
                ? generateAccessCode()
                : null;

            const data = {
                title: formData.title,
                description: formData.description,
                date: new Date(formData.date),
                bookingDate: new Date(formData.bookingDate),
                price: parseFloat(formData.price),
                totalTickets: parseInt(formData.totalTickets),
                availableTickets: parseInt(formData.totalTickets),
                imageUrl,
                trailerUrl,
                recordingUrl, // Add recording URL
                allowRecordingAccess: formData.allowRecordingAccess, // Add access control
                recordingAccessCode, // Add access code
                streamUrl: formData.streamUrl,
                isLive: false,
                status: 'upcoming',
                isaffiliate: isAffiliateEvent,
                commissionPercentage: isAffiliateEvent ? parseFloat(commissionValue) : null,
                soldOut, // Add soldOut field
            };

            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setOpen(false);
                router.refresh();
            }
        } catch (error) {
            console.error('Error creating event:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create Event</Button>
            </DialogTrigger>
            <DialogContent className="w-[95%] max-w-[500px] max-h-[90vh] overflow-y-auto sm:w-full md:w-3/4 lg:w-1/2">
                <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <div className="px-2 py-4 sm:px-4">

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Enter event title"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter event description"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Event Date and Time</Label>
                            <Input
                                id="date"
                                name="date"
                                type="datetime-local"
                                value={formData.date}
                                onChange={handleInputChange}
                                min={getMinDateTime()}
                                required
                                className="dark:text-white dark:[color-scheme:dark]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bookingDate">Booking Start Date and Time</Label>
                            <Input
                                id="bookingDate"
                                name="bookingDate"
                                type="datetime-local"
                                value={formData.bookingDate}
                                onChange={handleInputChange}
                                min={getMinDateTime()}
                                required
                                className="dark:text-white dark:[color-scheme:dark]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Price (MYR)</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleInputChange}
                                placeholder="Enter price"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="totalTickets">Total Tickets</Label>
                            <Input
                                id="totalTickets"
                                name="totalTickets"
                                type="number"
                                value={formData.totalTickets}
                                onChange={handleInputChange}
                                placeholder="Enter total number of tickets"
                                min="1"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Thumbnail Image</Label>
                            <Input
                                type="file"
                                id="imageUrl"
                                accept="image/*"
                                onChange={handleImageChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="trailer">Trailer Video</Label>
                            <Input
                                type="file"
                                id="trailer"
                                accept="video/*"
                                onChange={handleTrailerChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="recording">Event Recording (Optional)</Label>
                            <Input
                                type="file"
                                id="recording"
                                accept="video/*"
                                onChange={handleRecordingChange}
                            />
                            <div className="text-sm text-gray-400 mt-1">
                                Upload a recording for users who missed the live stream
                            </div>
                        </div>

                        {recordingFile && (
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="allowRecordingAccess"
                                        checked={formData.allowRecordingAccess}
                                        onCheckedChange={handleRecordingAccessChange}
                                    />
                                    <Label htmlFor="allowRecordingAccess">Enable Recording Access</Label>
                                </div>
                                <div className="text-sm text-gray-400 mt-1">
                                    Allow users to access the recording via invitation code
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="streamUrl">Stream URL</Label>
                            <Input
                                id="streamUrl"
                                name="streamUrl"
                                value={formData.streamUrl}
                                onChange={handleInputChange}
                                placeholder="Enter YouTube or Similar service stream URL"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="soldOut"
                                    checked={soldOut}
                                    onCheckedChange={handleSoldOutChange}
                                />
                                <Label htmlFor="soldOut">Mark as Sold Out</Label>
                            </div>
                        </div>

                        {/* Affiliate settings */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isAffiliateEvent"
                                    checked={isAffiliateEvent}
                                    onCheckedChange={handleCheckboxChange}
                                />
                                <Label htmlFor="isAffiliateEvent">Enable Affiliate Program</Label>
                            </div>

                            {isAffiliateEvent && (
                                <div className="mt-2">
                                    <Label htmlFor="commission">Commission Percentage (%)</Label>
                                    <Input
                                        id="commission"
                                        type="number"
                                        value={commissionValue}
                                        onChange={handleCommissionChange}
                                        placeholder="Enter commission percentage"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        required={isAffiliateEvent}
                                    />
                                </div>
                            )}
                        </div>

                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Event"}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
