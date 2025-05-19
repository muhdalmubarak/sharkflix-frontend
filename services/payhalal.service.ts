// services/payhalal.service.ts

import {generatePayHalalPaymentHash} from '@/app/utils/hash';
import { getServerSession } from 'next-auth';
import {NextResponse} from "next/server";

interface PayHalalConfig {
    testingMode: boolean;
    appId: {
        testing: string;
        live: string;
        alternativeTesting: string; // Added alternative testing app ID
    };
    endpoints: {
        testing: string;
        live: string;
    };
    secrets: {
        testing: string;
        live: string;
        alternativeTesting: string; // Added alternative testing secret
    };
    webhookEndpoints: {
        default: string;
        testing: string; // Added dedicated testing webhook endpoint
    };
}

interface PaymentDetails {
    userEmail: string;
    amount: number;
    product_description: string;
    order_id: string;
    customer_name?: string;
    customer_phone?: string;
    useTestEndpoint?: boolean; // Flag to use alternative test credentials
}

export class PayHalalService {
    private static config: PayHalalConfig = {
        /**************** TESTING OR LIVE MODE set here!!! ***********************/
        testingMode: (process.env.NEXT_PUBLIC_PAYMENT_API_TESTMODE?.toLowerCase() === "true"), // Default to testing mode !!!!!!
        appId: {
            testing: "app-testing-b0e9b5f922eb212825d0da91713657dd",
            live: "app-live-cce0532c77b7eacd5d96c8d26d957199",
            alternativeTesting: "app-testing-3e4ab923d97361eb4a06d60b935fc3e0"
        },
        endpoints: {
            testing: 'https://api-testing.payhalal.my/pay',
            live: 'https://api.payhalal.my/pay'
        },
        secrets: {
            testing: "secret-testing-d7608f377990ffcd94ac4a82c32f2e0c",
            live: "secret-29d1621b23f7f4e774a60082195e4cc4",
            alternativeTesting: "secret-testing-3bc80cba1708865d6e313271ce7cec75"
        },
        webhookEndpoints: {
            default: process.env.NEXT_PUBLIC_URL + "/api/charge-webhook",
            testing: process.env.NEXT_PUBLIC_URL + "/api/charge-webhook-test"
        }
    };

    static setTestingMode(isTestingMode: boolean) {
        this.config.testingMode = isTestingMode;
    }

    static isOnTestingMode() {
        return this.config.testingMode;
    }

    static getSecret(useAlternative: boolean = false): string {
        if (useAlternative) {
            return this.config.secrets.alternativeTesting;
        }

        return this.config.testingMode
            ? this.config.secrets.testing
            : this.config.secrets.live;
    }

    static getAppId(useAlternative: boolean = false): string {
        if (useAlternative) {
            return this.config.appId.alternativeTesting;
        }

        return this.config.testingMode
            ? this.config.appId.testing
            : this.config.appId.live;
    }

    static getEndpoint(useAlternative: boolean = false): string {
        if (useAlternative) {
            return this.config.endpoints.testing;
        }

        return this.config.testingMode
            ? this.config.endpoints.testing
            : this.config.endpoints.live;
    }

    static getWebhookUrl(useAlternative: boolean = false): string {
        if (useAlternative) {
            return this.config.webhookEndpoints.testing;
        }

        return this.config.testingMode
            ? this.config.webhookEndpoints.testing
            : this.config.webhookEndpoints.default;
    }

    private static async createPaymentUrl(details: PaymentDetails): Promise<string> {
        const {
            userEmail,
            amount,
            product_description,
            order_id,
            customer_name = "",
            customer_phone = "",
            useTestEndpoint = false
        } = details;

        const app_id = useTestEndpoint
            ? this.config.appId.alternativeTesting
            : this.getAppId();

        const endpoint = useTestEndpoint
            ? this.config.endpoints.testing
            : this.getEndpoint();

        // Select appropriate secret for hash generation
        const secret = useTestEndpoint
            ? this.config.secrets.alternativeTesting
            : this.getSecret();

        // Generate hash
        const hash = await generatePayHalalPaymentHash({
            amount: Number(amount).toFixed(2),
            currency: "MYR",
            product_description,
            order_id,
            customer_name,
            customer_email: userEmail,
            customer_phone
        }, secret);

        // Create payment URL with parameters
        const paymentUrl = new URL(endpoint);
        const params = {
            app_id,
            currency: "MYR",
            amount: Number(amount).toFixed(2),
            product_description,
            order_id,
            hash,
            customer_email: userEmail,
            customer_name,
            customer_phone,
            language: 'en'
        };

        // Add all parameters to URL
        Object.entries(params).forEach(([key, value]) => {
            paymentUrl.searchParams.append(key, value.toString());
        });

        return paymentUrl.toString();
    }

    static async initiateTicketPayment({
                                           userEmail,
                                           eventId,
                                           title,
                                           price,
                                           useTestEndpoint = false
                                       }: {
        userEmail: string;
        eventId: number;
        title: string;
        price: number;
        useTestEndpoint?: boolean;
    }): Promise<string> {
        if (!eventId) {
            throw new Error('Event ID is required');
        }

        // Ensure eventId is a valid number
        const validatedEventId = Number(eventId);
        if (isNaN(validatedEventId)) {
            throw new Error('Invalid event ID');
        }

        const timestamp = Date.now();
        const orderId = `EVENT_${validatedEventId}_${timestamp}`;

        return this.createPaymentUrl({
            userEmail,
            amount: price,
            product_description: `Event Ticket - ${title} (Event ID: ${validatedEventId})`,
            order_id: orderId,
            useTestEndpoint
        });
    }

    static async initiateTestTicketPayment({
                                               userEmail,
                                               eventId,
                                               title,
                                               price
                                           }: {
        userEmail: string;
        eventId: number;
        title: string;
        price: number;
    }): Promise<string> {
        return await this.initiateTicketPayment({
            userEmail,
            eventId,
            title,
            price,
            useTestEndpoint: true
        });
    }

    static async initiateVideoPayment({
                                          userEmail,
                                          movieId,
                                          price
                                      }: {
        userEmail: string;
        movieId: number;
        price: number;
    }): Promise<string> {
        if (!movieId) {
            throw new Error('Movie ID is required');
        }

        // Ensure movieId is a valid number
        const validatedMovieId = Number(movieId);
        if (isNaN(validatedMovieId)) {
            throw new Error('Invalid movie ID');
        }

        const timestamp = Date.now();
        const orderId = `MOVIE_${validatedMovieId}_${timestamp}`;

        return this.createPaymentUrl({
            userEmail,
            amount: price,
            product_description: "Video Purchase",
            order_id: orderId
        });
    }

    static async initiateStoragePayment({
                                            userId,
                                            userEmail,
                                            customer_name,
                                            customer_phone,
                                            selectedPlan,
                                            price,
                                            billingCycle = "monthly",
                                            useTestEndpoint = false
                                        }: {
        userId: number | null | undefined;
        userEmail: string;
        customer_name: string;
        customer_phone: string;
        selectedPlan: string | null;
        price: number;
        billingCycle?: "monthly" | "yearly";
        useTestEndpoint?: boolean;
    }): Promise<string> {
        if (!selectedPlan) {
            throw new Error('Selected plan is required');
        }
        if (price <= 0) {
            throw new Error("Price must be greater than 0");
        }
        if (!userId) {
            throw new Error("User session is invalid");
        }

        const timestamp = Date.now();
        const orderId = `STORAGE_${selectedPlan}_${userId}_${billingCycle}_${timestamp}`;

        return this.createPaymentUrl({
            userEmail,
            customer_name,
            customer_phone,
            amount: price,
            product_description: `Upgrade Storage Plan - ${selectedPlan}`,
            order_id: orderId,
            useTestEndpoint
        });
    }

    static async initiateTestStoragePayment({
                                                userId,
                                                userEmail,
                                                customer_name,
                                                customer_phone,
                                                selectedPlan,
                                                price,
                                                billingCycle = "monthly",
                                                useTestEndpoint = true
                                            }: {
        userId: number | null | undefined;
        userEmail: string;
        customer_name: string;
        customer_phone: string;
        selectedPlan: string | null;
        price: number;
        billingCycle?: "monthly" | "yearly";
        useTestEndpoint?: boolean
    }): Promise<string> {
        return await this.initiateStoragePayment({
            userId,
            userEmail,
            customer_name,
            customer_phone,
            selectedPlan,
            price,
            billingCycle,
            useTestEndpoint
        });
    }

    static async initiateBatchTransactionsSync({
                                                   startDate,
                                                   endDate
                                               }: {
        startDate: string;
        endDate: string;
    }) {

        const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/admin/payments/payhalal/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({startDate, endDate}),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Something went wrong');
        }

        const transactionsData = await response.json();

        if (transactionsData.Result) {
            throw new Error(transactionsData.Result);
        }

        return NextResponse.json(transactionsData);

    }

}