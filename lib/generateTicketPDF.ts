// lib/generateTicketPDF.ts
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export async function generatePDF(ticket: any, event: any) {
    try {
        // Create new PDF document
        const doc = new jsPDF();

        // Set font styles
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);

        // Add event title
        doc.text(event.title, 20, 30);

        // Set normal font for details
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);

        // Add event details
        const eventDate = new Date(event.date).toLocaleString();
        doc.text(`Date: ${eventDate}`, 20, 50);
        doc.text(`Ticket Code: ${ticket.ticketCode}`, 20, 60);

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(ticket.qrCode);

        // Add QR code to PDF
        doc.addImage(qrCodeDataUrl, 'PNG', 20, 70, 50, 50);

        // Add additional ticket info
        doc.text('Status: ' + ticket.status, 20, 140);
        doc.text('Purchase Date: ' + new Date(ticket.purchaseDate).toLocaleDateString(), 20, 150);

        // Add footer
        doc.setFontSize(10);
        doc.text('This ticket is valid for one-time entry.', 20, 180);

        return doc;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}
