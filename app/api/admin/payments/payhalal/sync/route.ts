// app/api/admin/payments/payhalal/sync/route.ts
import {NextResponse} from 'next/server';
import prisma from "@/app/utils/db";
import {generatePayHalalCallbackHash} from "@/app/utils/hash";
import {PayHalalService} from "@/services/payhalal.service";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/utils/auth";

// POST /api/admin/payments/payhalal/sync - Create new event
export async function POST(request: Request) {
    try {

        const session = await getServerSession(authOptions); // Add authOptions here
        if (session?.user?.role !== "admin") {
            return new NextResponse('Unauthorized', {status: 401});
        }

        const merchantId = process.env.PAYHALAL_MERCHANT_ID;

        if (merchantId) {

            const {startDate, endDate} = await request.json();

            const transactionsResponse = await PayHalalService.initiateBatchTransactionsSync({
                startDate,
                endDate
            });

            if (transactionsResponse.ok) {
                const transactions = await transactionsResponse.json();

                let totalTransactionsSynced = 0;
                const totalTransactionsMissing = transactions.length;
                const missingTransactions: any = [];
                const paymentTestMode = (process.env.NEXT_PUBLIC_PAYMENT_API_TESTMODE?.toLowerCase() === "true");

                await Promise.all(
                    transactions.map(async (transaction: any) => {
                        if (transaction.transaction_id) {
                            const dbTransaction = await prisma.payments.findUnique({
                                where: {transactionId: transaction.transaction_id},
                            });
                            if (!dbTransaction) {
                                const secret = paymentTestMode ? PayHalalService.getSecret(true) : PayHalalService.getSecret();
                                const expectedHash = generatePayHalalCallbackHash({
                                    amount: transaction?.amount,
                                    currency: transaction?.currency,
                                    product_description: transaction?.product_description,
                                    order_id: transaction?.customer_order_id,
                                    customer_name: transaction?.customer_name,
                                    customer_email: transaction?.customer_email,
                                    customer_phone: transaction?.customer_phone,
                                    transaction_id: transaction?.transaction_id,
                                    status: transaction?.status
                                }, secret);

                                missingTransactions.push({
                                    amount: transaction?.amount,
                                    currency: transaction?.currency,
                                    product_description: transaction?.product_description,
                                    order_id: transaction?.customer_order_id,
                                    customer_order_id: transaction?.customer_order_id,
                                    customer_name: transaction?.customer_name,
                                    customer_email: transaction?.customer_email,
                                    customer_phone: transaction?.customer_phone,
                                    transaction_id: transaction.transaction_id,
                                    status: transaction?.status,
                                    hash: expectedHash,
                                    channel: transaction?.source || 'UNKNOWN'
                                });
                            }
                        }
                    })
                );

                const endPoint = paymentTestMode ? `${process.env.NEXT_PUBLIC_URL}/api/charge-webhook-test` : `${process.env.NEXT_PUBLIC_URL}/api/charge-webhook`;

                await Promise.all(
                    missingTransactions.map(async (transaction: any) => {
                        const formData = new FormData()

                        for (const key in transaction) {
                            if (transaction[key] !== undefined && transaction[key] !== null) {
                                formData.append(key, transaction[key].toString())
                            }
                        }

                        const response = await fetch(`${endPoint}`, {
                            method: 'POST',
                            body: formData,
                        });

                        if (response.ok) {
                            const webhookResponse = await response.json();
                            if (webhookResponse.success) totalTransactionsSynced++;
                        }
                    })
                );

                const responseMessage = !totalTransactionsSynced ? 'Everything is up to date' : `${totalTransactionsSynced}/${totalTransactionsMissing} records synced.`;

                return NextResponse.json({'success': true, 'message': responseMessage});
            }

            throw new Error("Something went wrong.");

        } else {
            throw new Error("Merchant ID is missing.");
        }

    } catch (error: any) {
        return NextResponse.json(
            {error: error.message},
            {status: 500}
        );
    }
}
