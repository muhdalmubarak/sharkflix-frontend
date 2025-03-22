// app/components/DownloadTicketButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { generatePDF } from "@/lib/generateTicketPDF";

interface DownloadTicketButtonProps {
    ticket: any; // Type this properly based on your schema
    event: any;
}

export function DownloadTicketButton({ ticket, event }: DownloadTicketButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        setIsLoading(true);
        try {
            const doc = await generatePDF(ticket, event);
            doc.save(`${event.title}-Ticket-${ticket.ticketCode}.pdf`);
        } catch (error) {
            console.error("Error downloading ticket:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isLoading}
            className="flex items-center gap-2"
        >
            {isLoading ? "Generating..." : "Download Ticket"}
            <Download className="w-4 h-4" />
        </Button>
    );
}
