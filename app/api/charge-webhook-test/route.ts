// app/api/charge-webhook-test/route.ts
import {NextResponse} from "next/server";
import {OptimizedPaymentService} from "@/services/optimized-payment.service";
import EmailQueueService from "@/services/emailQueue.service";
import {generateMediaUrl} from "@/lib/utils";

export const maxDuration = 1800; // This function can run for a maximum of 300 seconds
// Enable edge runtime for better performance
// export const runtime = 'edge' // 'nodejs' (default) | 'edge'

// Request coalescing cache
const webhookCache = new Map<string, Promise<any>>();

export async function POST(request: Request) {

    console.log(">>> Test webhook received:", request.url);
    try {
        const formData = await request.formData();
        const transactionId = formData.get('transaction_id')?.toString();

        if (!transactionId) {
            return new Response('Missing transaction ID', {status: 400});
        }

        // Check cache for existing processing
        const cacheKey = `webhook_${transactionId}`;
        if (webhookCache.has(cacheKey)) {
            return NextResponse.json(await webhookCache.get(cacheKey));
        }

        // Process webhook
        const processingPromise = OptimizedPaymentService.processWebhook(formData, true);
        webhookCache.set(cacheKey, processingPromise);

        const result = await processingPromise;

        console.log(">>> Webhook result:", result);

        // Clear cache after processing
        setTimeout(() => webhookCache.delete(cacheKey), 60000);

        // Handle notifications only for successful payments
        if (result.success && result.status === 'completed' && result.data) {
            await queueNotifications(formData, result.data);
        }

        // Log successful test payment for debugging
        console.log('Test webhook processed successfully:', {
            transactionId,
            status: result.status
        });

        return NextResponse.json({
            ...result,
            testMode: true
        });
    } catch (error: any) {
        console.error("Test webhook processing error:", error);
        return handleWebhookError(error);
    }
}

async function queueNotifications(formData: FormData, data: any) {
    const customerEmail = formData.get('customer_email')?.toString() || '';

    if ('ticket' in data) {
        const {ticket, payment, event} = data;
        if (ticket && payment && event) {
            await EmailQueueService.addToQueue('ticket_purchase', {
                userId: ticket.userId,
                userEmail: customerEmail,
                eventId: event.id,
                ticketId: ticket.id,
                eventTitle: event.title,
                eventDate: event.date,
                ticketCode: ticket.ticketCode,
                amount: payment.amount,
                paymentMethod: payment.paymentMethod,
                transactionId: payment.transactionId
            });
        }
    } else if ('purchase' in data) {
        const {purchase} = data;
        if (purchase) {
            await EmailQueueService.addToQueue('video_purchase', {
                userEmail: customerEmail,
                transactionId: formData.get('transaction_id')?.toString() || '',
                amount: formData.get('amount')?.toString() || '',
                youtubeUrl: generateMediaUrl(purchase.youtube_url)
            });
        }
    } else if ('storage' in data) {
        const {storage} = data;
        await EmailQueueService.addToQueue('storage_purchase', {
            userEmail: customerEmail,
            transactionId: formData.get('transaction_id')?.toString() || '',
            plan_type: storage.type,
            total: storage.total
        });
    }
}

function handleWebhookError(error: Error) {
    const knownErrors = new Set([
        "Hash verification failed",
        "Payment failed",
        "No tickets available",
        "Missing order identification",
        "Invalid order ID format",
        "Customer not found",
        "Duplicate transaction detected"
    ]);

    if (knownErrors.has(error.message)) {
        return new Response(error.message, {
            status: 400,
            headers: {'Content-Type': 'application/json'}
        });
    }

    return new Response(JSON.stringify({
        error: "Internal server error",
        message: error.message
    }), {
        status: 500,
        headers: {'Content-Type': 'application/json'}
    });
}
