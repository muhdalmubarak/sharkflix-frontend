// app/api/payment-recovery/route.ts
import { NextResponse } from 'next/server';
import { PaymentRecoveryService } from '@/services/payment-recovery.service';

export const maxDuration = 800; // This function can run for a maximum of 800 seconds

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const action = formData.get('action') as string;

    if (action === 'analyze') {
      const analysis = await PaymentRecoveryService.analyzePayments(file);
      return NextResponse.json(analysis);
    } else if (action === 'recover') {
      const result = await PaymentRecoveryService.analyzeAndRecoverPayments(file);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Payment recovery error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment recovery' },
      { status: 500 }
    );
  }
}
