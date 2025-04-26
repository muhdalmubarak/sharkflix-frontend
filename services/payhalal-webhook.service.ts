// services/payhalal-webhook.service.ts
import prisma from "@/app/utils/db";
import {generatePayHalalCallbackHash} from "@/app/utils/hash";
import {NotificationService} from "@/services/notification.service";
import {v4 as uuidv4} from 'uuid';
import {Prisma} from "@prisma/client";

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

export class PayHalalWebhookService {
    private static async verifyHash(data: WebhookData): Promise<boolean> {
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
        });

        return data.hash === expectedHash;
    }

    static async processWebhook(formData: FormData): Promise<PaymentResult> {
        try {
            const data: WebhookData = this.extractWebhookData(formData);

            // Verify hash
            const isValidHash = await this.verifyHash(data);
            if (!isValidHash) {
                throw new Error("Hash verification failed");
            }

            // Process based on payment status
            switch (data.status.toUpperCase()) {
                case 'SUCCESS':
                    return await this.handleSuccessfulPayment(data);
                case 'FAILED':
                    return await this.handleFailedPayment(data);
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

    private static async handleSuccessfulPayment(data: WebhookData): Promise<PaymentResult> {
        return prisma.$transaction(async (tx: any) => {
            const paymentResult = await this.processNewPayment(tx, data);
            return {
                success: true,
                status: 'completed',
                data: paymentResult
            };
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, // optional, default defined by database configuration
            maxWait: 10000,    // 10 seconds to wait for a connection
            timeout: 30000,    // 30 seconds for transaction timeout
        });
    }

    private static async handleFailedPayment(data: WebhookData): Promise<PaymentResult> {
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

    private static async processNewPayment(tx: any, data: WebhookData): Promise<any> {
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
            return this.processEventPayment(tx, eventId, data);
        }

        // Handle video purchase
        const movieIdMatch = effectiveOrderId.match(/MOVIE_(\d+)_(\d+)/);
        if (movieIdMatch) {
            const movieId = parseInt(movieIdMatch[1]);
            return this.processVideoPayment(tx, movieId, data);
        }

        throw new Error(`Unrecognized order format: ${effectiveOrderId}`);
    }

    private static async processEventPayment(tx: Prisma.TransactionClient, eventId: number, data: WebhookData): Promise<any> {
        // Get event details
        const event = await tx.events.findUnique({
            where: {id: eventId},
            select: {
                id: true,
                title: true,
                date: true,
                availableTickets: true,
                userId: true,
                isaffiliate: true,
                commissionPercentage: true
            }
        });

        if (!event) {
            throw new Error(`Event not found: ${eventId}`);
        }

        if (event.availableTickets <= 0) {
            throw new Error("No tickets available");
        }

        // Find or create user
        const user = await tx.user.findUnique({
            where: {email: data.customer_email}
        });

        // Create ticket
        const ticket = await tx.tickets.create({
            data: {
                ticketCode: uuidv4(),
                qrCode: `${eventId}_${Date.now()}_${data.customer_email}`,
                status: 'active',
                eventId: eventId,
                userId: user?.id || 0, // Handle case where user might not exist
            },
        });

        // Create payment record
        const payment = await tx.payments.create({
            data: {
                amount: parseFloat(data.amount),
                status: 'completed',
                paymentMethod: this.mapChannelToPaymentMethod(data.channel),
                transactionId: data.transaction_id,
                ticketId: ticket.id,
            },
        });

        // Update available tickets
        await tx.events.update({
            where: {id: eventId},
            data: {
                availableTickets: {
                    decrement: 1
                }
            }
        });

        // Process revenues
        await this.processEventRevenues(tx, eventId, data);

        return {ticket, payment, event};
    }

    private static async processVideoPayment(tx: any, movieId: number, data: WebhookData): Promise<any> {
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

        const purchase = await tx.purchased_videos.create({
            data: {
                user_email: data.customer_email,
                youtube_url: movie.youtubeString,
            },
        });

        // Process creator revenue
        if (movie) {
            const creatorId = Number(movie.userId);
            await this.calculateAndStoreCreatorRevenue(
                tx,
                data,
                'movie',
                movie.id,
                creatorId,
                customer.id // Pass customer.id as referredUserId
            );

            // Process affiliate revenue if applicable
            if (movie.isaffiliate && movie.commissionPercentage) {
                await this.calculateAndStoreAffiliateRevenue(
                    tx,
                    data,
                    'movie',
                    movie.id,
                    Number(movie.commissionPercentage),
                    customer.id // Pass customer.id as referredUserId
                );
            }
        }

        return {purchase};
    }

    private static async processEventRevenues(tx: any, eventId: number, data: WebhookData): Promise<void> {
        const event = await tx.events.findUnique({
            where: {id: eventId},
            select: {
                id: true,
                userId: true,
                isaffiliate: true,
                commissionPercentage: true
            }
        });

        if (!event) {
            throw new Error(`Event not found for ID: ${eventId}`);
        }

        // Find the customer who made the purchase
        const customer = await tx.user.findUnique({
            where: {email: data.customer_email}
        });

        if (!customer) {
            throw new Error(`Customer not found for email: ${data.customer_email}`);
        }

        // Process creator revenue
        await this.calculateAndStoreCreatorRevenue(
            tx,
            data,
            'event',
            eventId,
            event.userId,
            customer.id // Pass customer.id as referredUserId
        );

        // Process affiliate revenue if applicable
        if (event.isaffiliate && event.commissionPercentage) {
            await this.calculateAndStoreAffiliateRevenue(
                tx,
                data,
                'event',
                eventId,
                Number(event.commissionPercentage),
                customer.id // Pass customer.id as referredUserId
            );
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

    // Add method to handle refunds
    static async processRefund(transactionId: string): Promise<PaymentResult> {
        return prisma.$transaction(async (tx: any) => {
            const payment = await tx.payments.findUnique({
                where: {transactionId},
                include: {ticket: true}
            });

            if (!payment) {
                throw new Error('Payment not found');
            }

            // Update payment status
            await tx.payments.update({
                where: {id: payment.id},
                data: {status: 'refunded'}
            });

            // Update ticket status
            if (payment.ticket) {
                await tx.tickets.update({
                    where: {id: payment.ticket.id},
                    data: {status: 'refunded'}
                });

                // Return ticket to available pool
                await tx.events.update({
                    where: {id: payment.ticket.eventId},
                    data: {
                        availableTickets: {increment: 1}
                    }
                });
            }

            // Reverse revenue entries
            await tx.creatorRevenue.updateMany({
                where: {transactionId},
                data: {status: 'refunded'}
            });

            await tx.affiliateRevenue.updateMany({
                where: {transactionId},
                data: {status: 'refunded'}
            });

            return {
                success: true,
                status: 'refunded',
                data: {transactionId}
            };
        });
    }
}

// interface CreatorPayout {
//     id: number;
//     creatorId: number;
//     totalAmount: number;    // Original full amount
//     commissionAmount: number; // 25% of total
//     payoutAmount: number;    // 75% of total
//     status: 'processing' | 'completed' | 'failed';
//     revenueIds: number[];
//     createdAt: Date;
//     updatedAt: Date;
// }

// export async function processCreatorPayout(creatorId: number, revenueIds: number[]) {
//     return prisma.$transaction(async (tx: any) => {
//         // Get all unpaid revenues
//         const revenues = await tx.creatorRevenue.findMany({
//             where: {
//                 id: { in: revenueIds },
//                 creatorId: creatorId,
//                 isPaid: false
//             }
//         });
//
//         const totalRevenue = revenues.reduce((sum, rev) => sum + Number(rev.amount), 0);
//         const commissionAmount = totalRevenue * 0.25; // 25% commission
//         const payoutAmount = totalRevenue * 0.75; // 75% for creator
//
//         // Create payout record
//         const payout = await tx.creatorPayouts.create({
//             data: {
//                 creatorId,
//                 totalAmount: totalRevenue,
//                 commissionAmount,
//                 payoutAmount,
//                 status: 'processing',
//                 revenueIds: revenueIds
//             }
//         });
//
//         // Mark revenues as paid
//         await tx.creatorRevenue.updateMany({
//             where: {
//                 id: { in: revenueIds }
//             },
//             data: {
//                 isPaid: true,
//                 payoutId: payout.id
//             }
//         });
//
//         // Update creator's balances
//         await tx.user.update({
//             where: { id: creatorId },
//             data: {
//                 current_balance: { increment: payoutAmount },
//                 // total_revenue remains unchanged as it shows the gross amount
//             }
//         });
//
//         return payout;
//     });
// }

