// app/components/creator-components/EditEventDialog.tsx
"use client";

import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/shadcn-ui/textarea";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {Label} from "@/components/shadcn-ui/label";
import {Checkbox} from "@/components/shadcn-ui/checkbox";
import {uploadToStorage} from "@/app/utils/uploader";

interface EditEventDialogProps {
    event: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditEventDialog({event, open, onOpenChange}: EditEventDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [trailerFile, setTrailerFile] = useState<File | null>(null);
    const [recordingFile, setRecordingFile] = useState<File | null>(null);
    const [isAffiliateEvent, setIsAffiliateEvent] = useState(event.isaffiliate || false);
    const [commissionValue, setCommissionValue] = useState<string>(
        event.commissionPercentage?.toString() || ""
    );
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [fileSize, setFileSize] = useState<any | "">("");
    const [soldOut, setSoldOut] = useState(event.soldOut || false);

    // State for recording access control
    const [allowRecordingAccess, setAllowRecordingAccess] = useState<boolean>(
        event.allowRecordingAccess || false
    );

    // Generate a new access code or use existing - EXPLICITLY SET TO FALSE by default
    const [generateNewAccessCode, setGenerateNewAccessCode] = useState<boolean>(false);

    // Reset the generateNewAccessCode state whenever the dialog opens
    useEffect(() => {
        if (open) {
            setGenerateNewAccessCode(false);
        }
    }, [open]);

    const formatDateForInput = (dateStr: string) => {
        const date = new Date(dateStr);
        // Get local ISO string and slice off the timezone part
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
            .toISOString()
            .slice(0, 16);
        return localDate;
    };

    const [formData, setFormData] = useState({
        title: event.title || '',
        description: event.description || '',
        date: formatDateForInput(event.date) || '',
        bookingDate: formatDateForInput(event.bookingDate) || '',
        price: event.price?.toString() || '',
        totalTickets: event.totalTickets?.toString() || '',
        streamUrl: event.streamUrl || ''
    });

    // Reset form data when event changes or dialog opens
    useEffect(() => {
        if (open) {
            setFormData({
                title: event.title || '',
                description: event.description || '',
                date: formatDateForInput(event.date) || '',
                bookingDate: formatDateForInput(event.bookingDate) || '',
                price: event.price?.toString() || '',
                totalTickets: event.totalTickets?.toString() || '',
                streamUrl: event.streamUrl || ''
            });
            setIsAffiliateEvent(event.isaffiliate || false);
            setCommissionValue(event.commissionPercentage?.toString() || "");
            setSoldOut(event.soldOut || false);
            setAllowRecordingAccess(event.allowRecordingAccess || false);
            // Clear file selections
            setImageFile(null);
            setTrailerFile(null);
            setRecordingFile(null);
            setVideoPreview(null);
            setFileSize("");
        }
    }, [event, open]);

    const normalizeFilename = (filename: string): string => {
        return filename.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
        }
    };

    const handleTrailerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
            setFileSize(sizeInMB);
            setTrailerFile(file);
            const previewUrl = URL.createObjectURL(file);
            setVideoPreview(previewUrl);
        }
    };

    const handleRecordingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setRecordingFile(file);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        setIsAffiliateEvent(checked);
        if (!checked) {
            setCommissionValue("");
        }
    };

    const handleSoldOutChange = (checked: boolean) => {
        setSoldOut(checked);
    };

    const handleRecordingAccessChange = (checked: boolean) => {
        setAllowRecordingAccess(checked);
    };

    const handleNewAccessCodeChange = (checked: boolean) => {
        setGenerateNewAccessCode(checked);
    };

    const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "" || (/^\d*\.?\d*$/.test(value) && parseFloat(value) <= 100)) {
            setCommissionValue(value);
        }
    };

    // Generate a unique access code for recording
    const generateAccessCode = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = event.imageUrl;
            let trailerUrl = event.trailerUrl;
            let recordingUrl = event.recordingUrl;

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

            // Determine if we need a new access code
            let recordingAccessCode = event.recordingAccessCode;

            // Only generate a new code if explicitly requested or if it's a new recording with no existing code
            if (generateNewAccessCode || (!recordingAccessCode && allowRecordingAccess && (recordingUrl || recordingFile))) {
                recordingAccessCode = generateAccessCode();
            }

            // Convert local dates back to UTC before sending to server
            const dateToUTC = (dateStr: string) => {
                const date = new Date(dateStr);
                return date.toISOString();
            };

            const data = {
                title: formData.title,
                description: formData.description,
                date: dateToUTC(formData.date),
                bookingDate: dateToUTC(formData.bookingDate),
                price: parseFloat(formData.price),
                totalTickets: parseInt(formData.totalTickets),
                imageUrl,
                trailerUrl,
                recordingUrl,
                allowRecordingAccess,
                recordingAccessCode: allowRecordingAccess ? recordingAccessCode : null,
                streamUrl: formData.streamUrl,
                isaffiliate: isAffiliateEvent,
                commissionPercentage: isAffiliateEvent ? parseFloat(commissionValue) : null,
                soldOut,
            };

            const response = await fetch(`/api/events/${event.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(errorText);
            }

            if (response.ok) {
                onOpenChange(false);
                router.refresh();
            }
        } catch (error) {
            console.error('Error updating event:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] max-w-[500px] max-h-[90vh] overflow-y-auto sm:w-full md:w-3/4 lg:w-1/2">
                <DialogHeader>
                    <DialogTitle>Edit Event</DialogTitle>
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
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="soldOut"
                                    checked={soldOut}
                                    onCheckedChange={handleSoldOutChange}
                                />
                                <Label htmlFor="soldOut">Mark as Sold Out</Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Update Thumbnail Image</Label>
                            <Input
                                type="file"
                                id="imageUrl"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                            {event.imageUrl && !imageFile && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Current image will be kept if no new image is uploaded
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="trailer">Update Trailer Video</Label>
                            <Input
                                type="file"
                                id="trailer"
                                accept="video/*"
                                onChange={handleTrailerChange}
                            />
                            {event.trailerUrl && !trailerFile && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Current trailer will be kept if no new video is uploaded
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="recording">Update Event Recording</Label>
                            <Input
                                type="file"
                                id="recording"
                                accept="video/*"
                                onChange={handleRecordingChange}
                            />
                            {event.recordingUrl && !recordingFile && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Current recording will be kept if no new recording is uploaded
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="allowRecordingAccess"
                                    checked={allowRecordingAccess}
                                    onCheckedChange={handleRecordingAccessChange}
                                />
                                <Label htmlFor="allowRecordingAccess">Enable Recording Access</Label>
                            </div>
                            {(event.recordingUrl || recordingFile) && allowRecordingAccess && (
                                <>
                                    <div className="mt-2 ml-6">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="generateNewAccessCode"
                                                checked={generateNewAccessCode}
                                                onCheckedChange={handleNewAccessCodeChange}
                                            />
                                            <Label htmlFor="generateNewAccessCode">Generate New Access Code</Label>
                                        </div>
                                        {event.recordingAccessCode && !generateNewAccessCode && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Current access code: {event.recordingAccessCode}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

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
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
