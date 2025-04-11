// app/utils/hash.ts

import {createHash} from "crypto";
import {PayHalalService} from "@/services/payhalal.service";

interface PayHalalHashParams {
    amount: string;
    currency: string;
    product_description: string;
    order_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    transaction_id?: string;
    status?: string;
}

/**
 * Generates a hash for PayHalal payment initialization
 * @param params Payment data
 * @param customSecret Optional custom secret to use instead of the default
 * @returns Generated hash
 */
export async function generatePayHalalPaymentHash(params: Omit<PayHalalHashParams, 'transaction_id' | 'status'>, customSecret?: string): Promise<string> {
    // Use provided custom secret or get from service
    const app_secret = customSecret || PayHalalService.getSecret();

    const concatenatedString = [
        app_secret,
        params.amount,
        params.currency,
        params.product_description,
        params.order_id,
        params.customer_name,
        params.customer_email,
        params.customer_phone
    ].join('');

    return createHash("sha256").update(concatenatedString, "utf8").digest("hex");
}

export async function generateReconcileHash(merchantId: string, customSecret?: string): Promise<string> {
    // Use provided custom secret or get from service
    const app_id = PayHalalService.getAppId();
    const app_secret = customSecret || PayHalalService.getSecret();

    const concatenatedString = [merchantId, app_id, app_secret].join('');

    return createHash("md5").update(concatenatedString, "utf8").digest("hex");
}

/**
 * Generates a hash for verifying PayHalal webhook callbacks
 * @param params Callback data
 * @param customSecret Optional custom secret to use instead of the default
 * @returns Generated hash
 */
export function generatePayHalalCallbackHash(params: PayHalalHashParams, customSecret?: string): string {
    const app_secret = customSecret || PayHalalService.getSecret();

    const concatenatedString = [
        app_secret,
        params.amount,
        params.currency,
        params.product_description,
        params.order_id,
        params.customer_name,
        params.customer_email,
        params.customer_phone,
        params.transaction_id,
        params.status
    ].join('');

    return createHash("sha256").update(concatenatedString, "utf8").digest("hex");
}
