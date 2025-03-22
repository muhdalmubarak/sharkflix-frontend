import { read, utils } from 'xlsx';
import prisma from "@/app/utils/db";
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from "@prisma/client";
import EmailQueueService from "@/services/emailQueue.service";

interface PaymentRecord {
  transaction_id: string;
  order_id: string;
  customer_phone: string;
  amount: string;
  status: string;
  payment_method: string;
  merchant_email: string;
  created_at: string;
}

interface DuplicatePayment {
  merchant_email: string;
  transactions: Array<{
    transaction_id: string;
    amount: string;
    payment_method: string;
    created_at: string;
    order_id: string;
  }>;
}

export class PaymentRecoveryService {
  // Configure optimized transaction options
  private static readonly TRANSACTION_OPTIONS = {
    maxWait: 20000,     // 20 seconds to wait for a connection
    timeout: 120000,    // 2 minutes for transaction timeout
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
  };

  // Separate transaction options for TNG-EWALLET payments
  private static readonly TNG_EWALLET_TRANSACTION_OPTIONS = {
    maxWait: 30000,     // 30 seconds to wait for a connection
    timeout: 180000,    // 3 minutes for transaction timeout
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
  };

  // Use smaller batch size for processing
  private static readonly BATCH_SIZE = 25;
  private static readonly TNG_EWALLET_BATCH_SIZE = 10;

  private static mapPayHalalRecord(record: any): Partial<PaymentRecord> {
    // Extract Order ID and validate it's not N/A
    const orderId = record['Order ID']?.toString().trim();
    if (!orderId || orderId.toUpperCase() === 'N/A') {
      throw new Error('Order ID is missing or equals to N/A - cannot process this record');
    }

    return {
      transaction_id: record['Transaction ID']?.toString(),
      order_id: orderId, // Use the validated Order ID
      customer_phone: record['Customer(s)']?.toString(),
      amount: record['Amount']?.toString(),
      status: record['Status']?.toString(),
      payment_method: record['Method']?.toString(),
      merchant_email: record['Merchant Email']?.toString(),
      created_at: record['Date']?.toString()
    };
  }

  private static isEventOrderId(orderId: string): boolean {
    // Check if the order ID follows the EVENT_XX_TIMESTAMP pattern
    return /^EVENT_\d+_\d+$/.test(orderId);
  }

  private static validateRecord(record: Partial<PaymentRecord>): record is PaymentRecord {
    const requiredFields: (keyof PaymentRecord)[] = [
      'transaction_id',
      'order_id',
      'customer_phone',
      'amount',
      'status',
      'payment_method',
      'merchant_email',
      'created_at'
    ];

    const missingFields = requiredFields.filter(field => !record[field]);

    if (missingFields.length > 0) {
      const error = `Invalid record, missing fields: ${missingFields.join(', ')}`;
      console.warn(error, record);
      throw new Error(error);
    }

    // Additional validation for Order ID format and N/A check
    if (!record.order_id) {
      throw new Error('Order ID is required');
    }

    if (record.order_id.toUpperCase() === 'N/A') {
      throw new Error('Order ID cannot be N/A');
    }

    // Skip non-EVENT order IDs without error (e.g., Weekend_in_Taipei...)
    if (!this.isEventOrderId(record.order_id)) {
      console.log(`Skipping non-event order ID: ${record.order_id}`);
      return false; // Return false to indicate this should be skipped but is not an error
    }

    return true;
  }

  private static cleanRecords(rawRecords: any[]): PaymentRecord[] {
    const validRecords: PaymentRecord[] = [];
    const skippedRecords: any[] = [];
    const errors: string[] = [];

    for (const record of rawRecords) {
      try {
        const mappedRecord = this.mapPayHalalRecord(record);
        // If not an event order ID, skip without error
        if (!this.isEventOrderId(mappedRecord.order_id as string)) {
          skippedRecords.push({
            transaction_id: mappedRecord.transaction_id,
            order_id: mappedRecord.order_id,
            reason: "Not an event order ID"
          });
          continue;
        }

        if (this.validateRecord(mappedRecord)) {
          validRecords.push(mappedRecord);
        }
      } catch (error) {
        if (error instanceof Error) {
          errors.push(`Row processing error: ${error.message}`);
        }
      }
    }

    // Log skipped records for informational purposes
    if (skippedRecords.length > 0) {
      console.log(`Skipped ${skippedRecords.length} non-event records:`, skippedRecords);
    }

    if (errors.length > 0) {
      // Log all errors for debugging
      console.error('Validation errors:', errors);

      // Throw error with all validation issues
      throw new Error(`File processing failed:\n${errors.join('\n')}`);
    }

    return validRecords;
  }

  static async analyzePayments(file: File) {
    try {
      // Convert File to Buffer for server-side processing
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Read Excel file from buffer
      const workbook = read(buffer, {
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false
      });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRecords = utils.sheet_to_json(worksheet, {
        range: 1 // Start from second row to skip the "PayHalal | Merchant Dashboard" header
      });

      // Separate event and non-event records
      const allParsedRecords = rawRecords.map(record => this.mapPayHalalRecord(record));
      const eventRecords = allParsedRecords.filter(record => this.isEventOrderId(record.order_id as string));
      const nonEventRecords = allParsedRecords.filter(record => !this.isEventOrderId(record.order_id as string));

      // Clean and validate event records
      const records = this.cleanRecords(
        rawRecords.filter(record => {
          // Safely access 'Order ID' with proper type checking
          const orderId = typeof record === 'object' && record !== null && 'Order ID' in record
            ? String(record['Order ID']).trim()
            : '';
          return this.isEventOrderId(orderId);
        })
      );

      if (records.length === 0 && nonEventRecords.length === 0) {
        throw new Error('No valid records found in the file. Please check if this is a valid PayHalal export file.');
      }

      // Find and handle customer email duplicates
      const { uniqueRecords, duplicatesByEmail } = this.identifyEmailDuplicates(records);

      console.log(`\nAnalyzing PayHalal payments file...`);
      console.log(`Total records found: ${allParsedRecords.length}`);
      console.log(`Event records: ${eventRecords.length}`);
      console.log(`Non-event records (skipped): ${nonEventRecords.length}`);
      console.log(`Valid event records after cleaning: ${records.length}`);
      console.log(`Unique customers: ${uniqueRecords.length}`);
      console.log(`Customers with multiple payments: ${Object.keys(duplicatesByEmail).length}`);

      // Filter successful non-credit card payments
      const successfulRecords = uniqueRecords.filter(record =>
        record.status.toUpperCase() === 'SUCCESS'
      );

      console.log(`\nPayment methods breakdown:`);
      const paymentMethodCounts = records.reduce((acc: {[key: string]: number}, record) => {
        acc[record.payment_method] = (acc[record.payment_method] || 0) + 1;
        return acc;
      }, {});
      Object.entries(paymentMethodCounts).forEach(([method, count]) => {
        console.log(`${method}: ${count} transactions`);
      });

      // Check for existing payments
      const existingPayments = await Promise.all(
        successfulRecords.map(record =>
          prisma.payments.findUnique({
            where: { transactionId: record.transaction_id },
            include: { ticket: true }
          })
        )
      );

      const missingPayments = successfulRecords.filter((record, index) => !existingPayments[index]);

      // Format duplicates for display
      const formattedDuplicates = Object.entries(duplicatesByEmail).map(([email, transactions]) => ({
        merchant_email: email,
        transactions: transactions.map(t => ({
          transaction_id: t.transaction_id,
          amount: t.amount,
          payment_method: t.payment_method,
          created_at: t.created_at,
          order_id: t.order_id
        }))
      }));

      console.log(`\nAnalysis Results:`);
      console.log(`-------------------`);
      console.log(`Total successful payments: ${successfulRecords.length}`);
      console.log(`Already processed: ${successfulRecords.length - missingPayments.length}`);
      console.log(`Missing records to recover: ${missingPayments.length}`);
      console.log(`Customers with duplicate payments: ${Object.keys(duplicatesByEmail).length}`);
      console.log(`Non-event records (skipped): ${nonEventRecords.length}`);

      if (missingPayments.length > 0) {
        console.log(`\nTransactions to be recovered:`);
        console.log(`---------------------------`);
        missingPayments.forEach((record, index) => {
          console.log(`${index + 1}. Transaction ID: ${record.transaction_id}`);
          console.log(`   Customer Email: ${record.merchant_email}`);
          console.log(`   Amount: MYR ${record.amount}`);
          console.log(`   Payment Method: ${record.payment_method}`);
          console.log(`   Created At: ${record.created_at}`);
          console.log(`-------------------`);
        });
      }

      if (Object.keys(duplicatesByEmail).length > 0) {
        console.log(`\nCustomers with multiple payments (only first will be processed):`);
        console.log(`---------------------------`);
        formattedDuplicates.forEach((item, index) => {
          console.log(`${index + 1}. Customer Email: ${item.merchant_email}`);
          console.log(`   Total Transactions: ${item.transactions.length}`);
          console.log(`   To be processed: ${item.transactions[0].transaction_id} (${item.transactions[0].created_at})`);
          console.log(`   To be skipped: ${item.transactions.slice(1).map(t => t.transaction_id).join(', ')}`);
          console.log(`-------------------`);
        });
      }

      return {
        totalRecords: allParsedRecords.length,
        eventRecords: records.length,
        nonEventRecords: nonEventRecords.length,
        orderIds: records.map(r => r.order_id),
        successfulPayments: successfulRecords.length,
        missingRecords: missingPayments.length,
        recordsToRecover: missingPayments,
        skippedRecords: nonEventRecords.map(r => ({
          transaction_id: r.transaction_id,
          order_id: r.order_id
        })),
        duplicatePaymentsByEmail: formattedDuplicates,
        paymentMethodBreakdown: paymentMethodCounts
      };
    } catch (error) {
      console.error('Error analyzing payments:', error);
      // Enhance error handling to provide more specific messages
      if (error instanceof Error) {
        throw new Error(`Payment analysis failed: ${error.message}`);
      }
      throw new Error('An unexpected error occurred during payment analysis');
    }
  }

  private static identifyEmailDuplicates(records: PaymentRecord[]): {
    uniqueRecords: PaymentRecord[],
    duplicatesByEmail: { [email: string]: PaymentRecord[] }
  } {
    // Group records by merchant_email (customer email)
    const emailGroups: { [email: string]: PaymentRecord[] } = {};

    // Only consider successful transactions
    const successfulRecords = records.filter(record =>
      record.status.toUpperCase() === 'SUCCESS'
    );

    // Group by email
    successfulRecords.forEach(record => {
      if (!emailGroups[record.merchant_email]) {
        emailGroups[record.merchant_email] = [];
      }
      emailGroups[record.merchant_email].push(record);
    });

    // Separate into unique records (first transaction per email) and duplicates
    const uniqueRecords: PaymentRecord[] = [];
    const duplicatesByEmail: { [email: string]: PaymentRecord[] } = {};

    for (const [email, transactions] of Object.entries(emailGroups)) {
      // Sort transactions by date (earliest first)
      const sortedTransactions = [...transactions].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB;
      });

      // Add the first transaction to unique records
      uniqueRecords.push(sortedTransactions[0]);

      // If there are multiple transactions, add to duplicates
      if (sortedTransactions.length > 1) {
        duplicatesByEmail[email] = sortedTransactions;
      }
    }

    return { uniqueRecords, duplicatesByEmail };
  }

  static async analyzeAndRecoverPayments(file: File) {
    try {
      // Convert File to Buffer for server-side processing
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Read Excel file from buffer
      const workbook = read(buffer, {
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false
      });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRecords = utils.sheet_to_json(worksheet, {
        range: 1 // Skip first row
      });

      // Separate event and non-event records
      const allParsedRecords = rawRecords.map(record => this.mapPayHalalRecord(record));
      const eventRecords = allParsedRecords.filter(record => this.isEventOrderId(record.order_id as string));
      const nonEventRecords = allParsedRecords.filter(record => !this.isEventOrderId(record.order_id as string));

      // Clean and validate only event records
      const records = this.cleanRecords(
        rawRecords.filter(record => {
          // Safely access 'Order ID' with proper type checking
          const orderId = typeof record === 'object' && record !== null && 'Order ID' in record
            ? String(record['Order ID']).trim()
            : '';
          return this.isEventOrderId(orderId);
        })
      );

      if (records.length === 0) {
        if (nonEventRecords.length > 0) {
          console.log(`No valid event records found, but ${nonEventRecords.length} non-event records were skipped.`);
          return {
            success: true,
            totalRecords: allParsedRecords.length,
            eventRecords: 0,
            nonEventRecords: nonEventRecords.length,
            processed: 0,
            skipped: nonEventRecords.length,
            message: `No event records to process. ${nonEventRecords.length} non-event records were skipped.`
          };
        }
        throw new Error('No valid records found in the file. Please check if this is a valid PayHalal export file.');
      }

      console.log(`Total records found: ${allParsedRecords.length}`);
      console.log(`Valid event records: ${records.length}`);
      console.log(`Non-event records (skipped): ${nonEventRecords.length}`);

      // Identify and handle duplicate payments by email
      const { uniqueRecords, duplicatesByEmail } = this.identifyEmailDuplicates(records);

      console.log(`Unique customers: ${uniqueRecords.length}`);
      console.log(`Customers with duplicate payments: ${Object.keys(duplicatesByEmail).length}`);

      // Format duplicates for display and return
      const formattedDuplicates = Object.entries(duplicatesByEmail).map(([email, transactions]) => ({
        merchant_email: email,
        transactions: transactions.map(t => ({
          transaction_id: t.transaction_id,
          amount: t.amount,
          payment_method: t.payment_method,
          created_at: t.created_at,
          order_id: t.order_id
        }))
      }));

      // Log payment methods breakdown
      const paymentMethodCounts = records.reduce((acc: {[key: string]: number}, record) => {
        acc[record.payment_method] = (acc[record.payment_method] || 0) + 1;
        return acc;
      }, {});
      console.log('Payment methods breakdown:', paymentMethodCounts);

      // Only process SUCCESS status records
      const successfulRecords = uniqueRecords.filter(record =>
        record.status.toUpperCase() === 'SUCCESS'
      );

      // Split records by payment method for optimized processing
      const tngEwalletRecords = successfulRecords.filter(
        r => r.payment_method.toUpperCase().includes('TNG-EWALLET')
      );
      const otherRecords = successfulRecords.filter(
        r => !r.payment_method.toUpperCase().includes('TNG-EWALLET')
      );

      console.log(`Processing ${otherRecords.length} standard payment records...`);
      await this.processRecordsInBatches(otherRecords, this.BATCH_SIZE, this.TRANSACTION_OPTIONS);

      if (tngEwalletRecords.length > 0) {
        console.log(`Processing ${tngEwalletRecords.length} TNG-EWALLET records with extended timeout...`);
        await this.processRecordsInBatches(tngEwalletRecords, this.TNG_EWALLET_BATCH_SIZE, this.TNG_EWALLET_TRANSACTION_OPTIONS);
      }

      return {
        success: true,
        totalRecords: records.length,
        eventRecords: records.length,
        nonEventRecords: nonEventRecords.length,
        uniqueCustomers: uniqueRecords.length,
        duplicateCustomers: Object.keys(duplicatesByEmail).length,
        processed: successfulRecords.length,
        skipped: nonEventRecords.length,
        duplicatePayments: formattedDuplicates,
        paymentMethodBreakdown: paymentMethodCounts
      };
    } catch (error) {
      console.error('Error in payment recovery:', error);
      throw error;
    }
  }

  // Process records in smaller batches
  private static async processRecordsInBatches(records: PaymentRecord[], batchSize: number, txOptions: any) {
    // Create batches
    const batches: PaymentRecord[][] = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }

    console.log(`Processing ${records.length} records in ${batches.length} batches of size ${batchSize}`);

    // Set concurrency limit
    const concurrencyLimit = 3; // Process up to 3 batches at once

    // Process batches with controlled concurrency
    for (let i = 0; i < batches.length; i += concurrencyLimit) {
      const batchPromises = batches.slice(i, i + concurrencyLimit).map((batch, index) => {
        console.log(`Processing batch ${i + index + 1}/${batches.length} (${batch.length} records)...`);
        return this.processWithRetry(async () => {
          await this.processBatch(batch, txOptions);
        }, 3, 2000);
      });

      // Wait for current batch group to complete
      await Promise.all(batchPromises);
    }
  }

  // Retry mechanism for batch processing
  private static async processWithRetry(fn: () => Promise<void>, maxRetries = 3, initialDelay = 1000) {
    let retries = 0;
    while (true) {
      try {
        await fn();
        return;
      } catch (error) {
        if (retries >= maxRetries) throw error;

        retries++;
        const delay = initialDelay * Math.pow(2, retries - 1);
        console.log(`Retry ${retries} after ${delay}ms for error:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Process a batch of records inside a transaction
  private static async processBatch(records: PaymentRecord[], txOptions: any) {
    await prisma.$transaction(async (tx) => {
      for (const record of records) {
        // Check if payment already exists
        const existingPayment = await tx.payments.findUnique({
          where: { transactionId: record.transaction_id }
        });

        if (existingPayment) {
          continue; // Skip if payment already exists
        }

        // Extract the event ID from the order_id format "EVENT_26_1739880405583"
        const eventIdMatch = record.order_id.match(/EVENT_(\d+)_/);
        if (!eventIdMatch) {
          console.log(`Invalid order_id format: ${record.order_id}`);
          continue;
        }

        const parsedEventId = Number(eventIdMatch[1]);
        if (isNaN(parsedEventId)) {
          console.log(`Failed to parse event ID from order_id: ${record.order_id}`);
          continue;
        }

        // Process this payment record
        await this.processEventPayment(tx, record, parsedEventId);
      }
    }, txOptions);
  }

  // Process a single event payment - optimized approach
  private static async processEventPayment(tx: any, record: PaymentRecord, eventId: number) {
    try {
      // Execute critical operations in parallel where possible
      const [event, user] = await Promise.all([
        tx.events.findUnique({
          where: { id: eventId },
          select: {
            id: true, title: true, date: true, availableTickets: true,
            userId: true, isaffiliate: true, commissionPercentage: true
          }
        }),
        tx.user.findUnique({
          where: { email: record.merchant_email }
        })
      ]);

      if (!event) {
        console.log(`Event not found: ${eventId}`);
        return;
      }

      if (!user) {
        console.log(`User not found for email: ${record.merchant_email}`);
        return;
      }

      if (event.availableTickets <= 0) {
        console.log(`No tickets available for event: ${eventId}`);
        return;
      }

      // Create ticket and payment in parallel
      const [ticket, updatedEvent] = await Promise.all([
        tx.tickets.create({
          data: {
            ticketCode: uuidv4(),
            qrCode: `${eventId}_${Date.now()}_${record.merchant_email}`,
            status: 'active',
            eventId: eventId,
            userId: user.id,
          },
        }),
        tx.events.update({
          where: { id: eventId },
          data: { availableTickets: { decrement: 1 } }
        })
      ]);

      // Parse the amount - handle MYR prefix
      const cleanAmount = record.amount.replace(/MYR\s*/i, '').trim();
      const parsedAmount = parseFloat(cleanAmount);

      if (isNaN(parsedAmount)) {
        console.log(`Invalid amount format for transaction ${record.transaction_id}: ${record.amount}`);
        return;
      }

      // Create payment record
      const payment = await tx.payments.create({
        data: {
          amount: parsedAmount,
          status: 'completed',
          paymentMethod: record.payment_method.toLowerCase(),
          transactionId: record.transaction_id,
          ticketId: ticket.id
        },
      });

      // Process revenues in parallel
      await this.processEventRevenueParallel(tx, event, record, user.id, parsedAmount);

      // Queue notification - done outside the transaction for better performance
      await this.queueTicketNotification(tx, {
        userId: user.id,
        userEmail: record.merchant_email,
        eventId: event.id,
        eventTitle: event.title,
        ticketCode: ticket.ticketCode,
        amount: parsedAmount,
        paymentMethod: record.payment_method,
        transactionId: record.transaction_id,
        ticketId: ticket.id,
        eventDate: event.date
      });

      return { ticket, payment, event };
    } catch (error) {
      console.error(`Error processing payment for ${record.transaction_id}:`, error);
      throw error;
    }
  }

  // Process event revenue in parallel - similar to OptimizedPaymentService
  private static async processEventRevenueParallel(
    tx: any,
    event: any,
    record: PaymentRecord,
    userId: number,
    parsedAmount: number
  ) {
    const operations = [];

    // Add creator revenue operation
    const creatorId = Number(event.userId);
    operations.push(
      tx.creatorRevenue.create({
        data: {
          creatorId: creatorId,
          amount: parsedAmount,
          sourceType: 'event',
          sourceId: event.id,
          referredUserId: userId,
          transactionId: record.transaction_id,
          isPaid: false
        }
      })
    );

    // Update creator's total revenue
    operations.push(
      tx.user.update({
        where: { id: creatorId },
        data: {
          total_revenue: { increment: parsedAmount }
        }
      })
    );

    // Process affiliate revenue if applicable
    if (event.isaffiliate && event.commissionPercentage) {
      const customer = await tx.user.findUnique({
        where: { id: userId },
        include: {
          referredByUser: {
            select: {
              affiliateUser: {
                select: { id: true }
              }
            }
          }
        }
      });

      if (customer?.referredByUser?.[0]?.affiliateUser) {
        const affiliateId = customer.referredByUser[0].affiliateUser.id;
        const commissionAmount = parsedAmount * Number(event.commissionPercentage) / 100;

        // Create affiliate revenue
        operations.push(
          tx.affiliateRevenue.create({
            data: {
              affiliateId: affiliateId,
              amount: commissionAmount,
              sourceType: 'event',
              sourceId: event.id,
              referredUserId: userId,
              transactionId: record.transaction_id,
              isPaid: false
            }
          })
        );

        // Update affiliate's total revenue
        operations.push(
          tx.user.update({
            where: { id: affiliateId },
            data: {
              total_revenue: { increment: commissionAmount }
            }
          })
        );
      }
    }

    // Run all operations in parallel
    return Promise.all(operations);
  }

  // Queue ticket notification for better performance
  private static async queueTicketNotification(tx: any, data: any) {
    try {
      await EmailQueueService.addToQueue('ticket_recovered', {
        userId: data.userId,
        userEmail: data.userEmail,
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        ticketCode: data.ticketCode,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        ticketId: data.ticketId,
        eventDate: data.eventDate
      });

      // Create in-app notification
      await tx.notifications.create({
        data: {
          userId: data.userId,
          title: 'Ticket Recovered',
          message: `Your ticket for ${data.eventTitle} has been recovered and confirmed.`,
          type: 'ticket_recovered',
          metadata: {
            eventId: data.eventId,
            ticketCode: data.ticketCode,
            transactionId: data.transactionId
          }
        }
      });
    } catch (error) {
      console.error('Failed to queue notification:', error);
      // Continue processing even if notification fails
    }
  }
}
