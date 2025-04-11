// app/api/admin/payments/payhalal/transactions/route.ts
import {NextResponse} from 'next/server';
import {generateReconcileHash} from "@/app/utils/hash";

// POST /api/admin/payments/payhalal/transactions - Create new event
export async function POST(request: Request) {
    try {

        const merchantId = process.env.PAYHALAL_MERCHANT_ID;

        if (merchantId) {
            const {startDate, endDate} = await request.json();
            const hash = await generateReconcileHash(merchantId);
            const endPoint = (process.env.NEXT_PUBLIC_PAYMENT_API_TESTMODE?.toLowerCase() === "true") ? 'https://api-merchant-uat.payhalal.my/transaction_list.php' : 'https://api-merchant.payhalal.my/transaction_list.php';
            const response = await fetch(`${endPoint}?merchant_id=${merchantId}&hash=${hash}&sdate=${startDate}&edate=${endDate}`);

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData);
            }

            const transactionsData = await response.json();

            return NextResponse.json(transactionsData);
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
