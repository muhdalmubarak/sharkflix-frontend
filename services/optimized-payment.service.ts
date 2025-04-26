// services/optimized-payment.service.ts
import prisma from "@/app/utils/db";
import {generatePayHalalCallbackHash} from "@/app/utils/hash";
import EmailQueueService from "@/services/emailQueue.service";
import {v4 as uuidv4} from 'uuid';
import {Prisma} from "@prisma/client";
import {NotificationService} from "@/services/notification.service";
import {PayHalalService} from "@/services/payhalal.service";

interface WebhookData {
    amount: string;
    currency: string;
    product_description: string;
    order_id: string;
    customer_order_id?: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    transaction_id: string;
    status: string;
    hash: string;
    channel: string;
}

interface PaymentResult {
    success: boolean;
    status: string;
    data?: any;
    error?: string;
}

export class OptimizedPaymentService {
    private static readonly BATCH_SIZE = 50;
    private static readonly TRANSACTION_OPTIONS = {
        maxWait: 20000,     // 20 seconds to wait for a connection
        timeout: 120000,    // 2 minutes for transaction timeout
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
    };

    private static async verifyHash(data: WebhookData, useAlternativeSecret: boolean = false): Promise<boolean> {
        // Use alternative secret for test webhook if specified
        const secret = useAlternativeSecret
            ? PayHalalService.getSecret(true) // Get alternative testing secret
            : undefined;  // Use default secret based on current mode

        const expectedHash = generatePayHalalCallbackHash({
            amount: data.amount,
            currency: data.currency,
            product_description: data.product_description,
            order_id: data.order_id,
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            customer_phone: data.customer_phone,
            transaction_id: data.transaction_id,
            status: data.status
        }, secret);

        return data.hash === expectedHash;
    }

    private static extractWebhookData(formData: FormData): WebhookData {
        return {
            amount: formData.get('amount')?.toString() || '',
            currency: formData.get('currency')?.toString() || '',
            product_description: formData.get('product_description')?.toString() || '',
            order_id: formData.get('order_id')?.toString() || '',
            customer_order_id: formData.get('customer_order_id')?.toString() || '',
            customer_name: formData.get('customer_name')?.toString() || '',
            customer_email: formData.get('customer_email')?.toString() || '',
            customer_phone: formData.get('customer_phone')?.toString() || '',
            transaction_id: formData.get('transaction_id')?.toString() || '',
            status: formData.get('status')?.toString() || '',
            hash: formData.get('hash')?.toString() || '',
            channel: formData.get('channel')?.toString() || 'UNKNOWN'
        };
    }

    // Use customer_order_id if order_id is empty
    private static getEffectiveOrderId(data: WebhookData): string {
        return data.order_id || data.customer_order_id || '';
    }

    private static mapChannelToPaymentMethod(channel: string): string {
        const paymentMethods: { [key: string]: string } = {
            'CC': 'credit_card',
            'FPX': 'fpx',
            'EWALLET': 'e_wallet',
            'BANKTRANSFER': 'bank_transfer'
        };
        return paymentMethods[channel.toUpperCase()] || channel.toLowerCase();
    }

    static async processWebhook(formData: FormData, useAlternativeSecret: boolean = false): Promise<PaymentResult> {
        try {
            const data = this.extractWebhookData(formData);

            // Verify hash first (outside transaction)
            if (!await this.verifyHash(data, useAlternativeSecret)) {
                throw new Error("Hash verification failed");
            }

            // Process based on payment status
            switch (data.status.toUpperCase()) {
                case 'SUCCESS':
                    return await this.processSuccessfulPayment(data);
                case 'FAILED':
                    return await this.processFailedPayment(data);
                default:
                    throw new Error(`Unsupported payment status: ${data.status}`);
            }
        } catch (error: any) {
            console.error('Payment processing error:', error);
            return {
                success: false,
                status: 'failed',
                error: error.message
            };
        }
    }

    private static async processSuccessfulPayment(data: WebhookData) {
        return prisma.$transaction(async (tx) => {
            // 1. Critical payment operations first
            const paymentResult = await this.processCriticalOperations(tx, data);

            // 2. Queue non-critical operations
            await this.queueNonCriticalOperations(data, paymentResult);

            return {
                success: true,
                status: 'completed',
                data: paymentResult
            };
        }, this.TRANSACTION_OPTIONS);
    }

    private static async processCriticalOperations(tx: any, data: WebhookData) {
        const effectiveOrderId = this.getEffectiveOrderId(data);

        if (!effectiveOrderId) {
            console.error('No order ID found in webhook data:', {
                order_id: data.order_id,
                customer_order_id: data.customer_order_id,
                transaction_id: data.transaction_id
            });
            throw new Error('Missing order identification');
        }

        // Handle event ticket purchase
        const eventIdMatch = effectiveOrderId.match(/EVENT_(\d+)_(\d+)/);
        if (eventIdMatch) {
            const eventId = parseInt(eventIdMatch[1]);
            return this.processEventPaymentCritical(tx, eventId, data);
        }

        // Handle video purchase
        const movieIdMatch = effectiveOrderId.match(/MOVIE_(\d+)_(\d+)/);
        if (movieIdMatch) {
            const movieId = parseInt(movieIdMatch[1]);
            return this.processVideoPaymentCritical(tx, movieId, data);
        }

        throw new Error(`Unrecognized order format: ${effectiveOrderId}`);
    }

    private static async processEventPaymentCritical(tx: any, eventId: number, data: WebhookData) {
        // Execute critical operations in parallel where possible
        const [event, user] = await Promise.all([
            tx.events.findUnique({
                where: {id: eventId},
                select: {
                    id: true, title: true, date: true, availableTickets: true,
                    userId: true, isaffiliate: true, commissionPercentage: true
                }
            }),
            tx.user.findUnique({
                where: {email: data.customer_email}
            })
        ]);

        if (!event) throw new Error(`Event not found: ${eventId}`);
        if (event.availableTickets <= 0) throw new Error("No tickets available");

        // Create ticket and payment in parallel
        const [ticket, updatedEvent] = await Promise.all([
            tx.tickets.create({
                data: {
                    ticketCode: uuidv4(),
                    qrCode: `${eventId}_${Date.now()}_${data.customer_email}`,
                    status: 'active',
                    eventId: eventId,
                    userId: user?.id || 0,
                },
            }),
            tx.events.update({
                where: {id: eventId},
                data: {availableTickets: {decrement: 1}}
            })
        ]);

        // Process purchase and revenue in parallel
        const [payment, revenueResults] = await Promise.all([
            tx.payments.create({
                data: {
                    amount: parseFloat(data.amount),
                    status: 'completed',
                    paymentMethod: this.mapChannelToPaymentMethod(data.channel),
                    transactionId: data.transaction_id,
                    ticketId: ticket.id,
                },
            }),
            this.processEventRevenueParallel(tx, event, data, user.id)
        ]);

        return {ticket, payment, event};
    }

    private static async processVideoPaymentCritical(tx: any, movieId: number, data: WebhookData) {
        // Get movie details
        const movie = await tx.movie.findUnique({
            where: {id: movieId},
            select: {id: true, userId: true, commissionPercentage: true, isaffiliate: true, youtubeString: true}
        });

        if (!movie) {
            throw new Error(`Movie not found: ${movieId}`);
        }

        // Find or create the customer
        const customer = await tx.user.findUnique({
            where: {email: data.customer_email}
        });

        if (!customer) {
            throw new Error(`Customer not found for email: ${data.customer_email}`);
        }

        // Process purchase and revenue in parallel
        const [purchase, revenueResults] = await Promise.all([
            tx.purchased_videos.create({
                data: {
                    user_email: data.customer_email,
                    youtube_url: movie.youtubeString,
                },
            }),
            this.processVideoRevenueParallel(tx, movie, data, customer.id)
        ]);

        return {purchase, revenueResults};
    }

    private static async processVideoRevenueParallel(tx: any, movie: any, data: WebhookData, customerId: number) {
        const operations = [];

        // Add creator revenue operation
        const creatorId = Number(movie.userId);
        operations.push(
            this.calculateAndStoreCreatorRevenue(tx, data, 'movie', movie.id, creatorId, customerId)
        );

        // Add affiliate revenue operation if applicable
        if (movie.isaffiliate && movie.commissionPercentage) {
            operations.push(
                this.calculateAndStoreAffiliateRevenue(tx, data, 'movie', movie.id,
                    Number(movie.commissionPercentage), customerId)
            );
        }

        return Promise.all(operations);
    }

    private static async processEventRevenueParallel(tx: any, event: any, data: WebhookData, customerId: number) {
        const operations = [];

        // Add creator revenue operation
        const creatorId = Number(event.userId);
        operations.push(
            this.calculateAndStoreCreatorRevenue(tx, data, 'event', event.id, creatorId, customerId)
        );

        // Add affiliate revenue operation if applicable
        if (event.isaffiliate && event.commissionPercentage) {
            operations.push(
                this.calculateAndStoreAffiliateRevenue(tx, data, 'event', event.id,
                    Number(event.commissionPercentage), customerId)
            );
        }

        return Promise.all(operations);
    }

    private static async queueNonCriticalOperations(data: WebhookData, paymentResult: any) {
        // Queue email notifications
        if ('ticket' in paymentResult) {
            await EmailQueueService.addToQueue('ticket_purchase', {
                userEmail: data.customer_email,
                ticketDetails: paymentResult.ticket,
                eventDetails: paymentResult.event,
                paymentDetails: paymentResult.payment
            });
        } else if ('purchase' in paymentResult) {
            await EmailQueueService.addToQueue('video_purchase', {
                userEmail: data.customer_email,
                purchaseDetails: paymentResult.purchase,
                amount: data.amount
            });
        }
    }

    private static async processFailedPayment(data: WebhookData): Promise<PaymentResult> {
        return prisma.$transaction(async (tx: any) => {
            const existingPayment = await tx.payments.findUnique({
                where: {transactionId: data.transaction_id},
                include: {ticket: true}
            });

            if (existingPayment) {
                await this.updatePaymentToFailed(tx, existingPayment);
            }

            // Send failure notification
            await NotificationService.notifyPaymentFailed({
                userEmail: data.customer_email,
                transactionId: data.transaction_id,
                amount: data.amount
            });

            return {
                success: false,
                status: 'failed',
                error: 'Payment failed'
            };
        });
    }

    private static async updatePaymentToFailed(tx: any, existingPayment: any) {
        // Update payment status
        await tx.payments.update({
            where: {id: existingPayment.id},
            data: {status: 'failed'}
        });

        // Update ticket status
        await tx.tickets.update({
            where: {id: existingPayment.ticket.id},
            data: {status: 'cancelled'}
        });

        // Release ticket back to pool
        if (existingPayment.ticket.eventId) {
            await tx.events.update({
                where: {id: existingPayment.ticket.eventId},
                data: {
                    availableTickets: {increment: 1}
                }
            });
        }
    }

    private static async calculateAndStoreAffiliateRevenue(
        tx: any,
        purchaseData: WebhookData,
        sourceType: 'movie' | 'event',
        sourceId: number,
        commissionPercentage: number,
        referredUserId: number // Add referredUserId parameter
    ): Promise<void> {
        // Find the customer
        const customer = await tx.user.findUnique({
            where: {email: purchaseData.customer_email},
            include: {
                referredByUser: {
                    select: {
                        affiliateUser: {
                            select: {id: true}
                        }
                    }
                }
            }
        });

        if (!customer?.referredByUser?.[0]?.affiliateUser) return;

        const affiliateId = customer.referredByUser[0].affiliateUser.id;
        const amount = Number((parseFloat(purchaseData.amount) * commissionPercentage / 100).toFixed(2));

        await tx.affiliateRevenue.create({
            data: {
                affiliateId,
                amount,
                sourceType,
                sourceId,
                referredUserId, // Use the passed referredUserId
                transactionId: purchaseData.transaction_id,
                isPaid: false
            }
        });

        // Option 1: Update total_revenue (if this is the intended behavior)
        await tx.user.update({
            where: {id: affiliateId},
            data: {
                total_revenue: {increment: amount}
            }
        });
    }

    private static async calculateAndStoreCreatorRevenue(
        tx: any,
        purchaseData: WebhookData,
        sourceType: 'movie' | 'event',
        sourceId: number,
        creatorId: number,
        referredUserId: number // Add referredUserId parameter
    ): Promise<void> {
        // Store the full amount without commission
        const amount = Number(parseFloat(purchaseData.amount).toFixed(2));

        await tx.creatorRevenue.create({
            data: {
                creatorId,
                amount,
                sourceType,
                sourceId,
                referredUserId, // Use the passed referredUserId
                transactionId: purchaseData.transaction_id,
                isPaid: false
            }
        });

        // Update creator's current balance
        await tx.user.update({
            where: {id: creatorId},
            data: {
                total_revenue: {increment: amount}
            }
        });
    }
}
