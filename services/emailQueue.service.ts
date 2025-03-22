// services/emailQueue.service.ts
import { NotificationService } from './notification.service';

interface QueuedEmail {
  id: string;
  type: string;
  data: any;
  attempts: number;
  lastAttempt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

class EmailQueueService {
  private static instance: EmailQueueService;
  private queue: Map<string, QueuedEmail>;
  private isProcessing: boolean;
  private maxRetries: number;
  private processingInterval: number; // milliseconds

  private constructor() {
    this.queue = new Map();
    this.isProcessing = false;
    this.maxRetries = 3;
    this.processingInterval = 5000; // 5 seconds
    this.startProcessing();
  }

  public static getInstance(): EmailQueueService {
    if (!EmailQueueService.instance) {
      EmailQueueService.instance = new EmailQueueService();
    }
    return EmailQueueService.instance;
  }

  public async addToQueue(type: string, data: any): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.queue.set(id, {
      id,
      type,
      data,
      attempts: 0,
      status: 'pending'
    });

    console.log(`Added email to queue: ${id}`);
    return id;
  }

  private async startProcessing() {
    setInterval(async () => {
      if (this.isProcessing || this.queue.size === 0) return;

      this.isProcessing = true;
      try {
        await this.processQueue();
      } catch (error) {
        console.error('Error processing queue:', error);
      } finally {
        this.isProcessing = false;
      }
    }, this.processingInterval);
  }

  private async processEmail(email: QueuedEmail) {
    switch (email.type) {
      case 'mass_email':
        await NotificationService.sendMassEmail(email.data);
        break;
      case 'payment_pending':
        await NotificationService.notifyPaymentPending(email.data);
        break;
      case 'payment_failed':
        await NotificationService.notifyPaymentFailed(email.data);
        break;
      case 'ticket_purchase':
        await NotificationService.notifyTicketPurchase(email.data);
        break;
      case 'video_purchase':
        await NotificationService.notifyVideoPurchase(email.data);
        break;
      case 'event_reminder':
        await NotificationService.sendEventReminder(email.data);
        break;
      case 'booking_reminder':
        await NotificationService.sendBookingReminder(email.data);
        break;
      case 'refund_initiated':
        await NotificationService.notifyRefundInitiated(email.data);
        break;
      case 'ticket_recovered':
        await NotificationService.notifyTicketRecovered(email.data);
        break;
      case 'password_reset':
        await NotificationService.sendPasswordResetEmail(
          email.data.email,
          email.data.userId,
          email.data.eventId,
          email.data.refCode
        );
        break;
      case 'temporary_password':
        await NotificationService.sendTemporaryPasswordEmail(
          email.data.email,
          email.data.tempPassword
        );
        break;
      default:
        throw new Error(`Unknown email type: ${email.type}`);
    }
  }

  private async processQueue() {
    for (const [id, email] of Array.from(this.queue.entries())) {
      if (email.status === 'completed' || email.status === 'failed') continue;
      if (email.status === 'processing') continue;

      if (email.attempts >= this.maxRetries) {
        email.status = 'failed';
        continue;
      }

      try {
        email.status = 'processing';
        email.attempts++;
        email.lastAttempt = new Date();

        await this.processEmail(email);

        email.status = 'completed';
        console.log(`Successfully processed email: ${id}`);
      } catch (error) {
        console.error(`Error processing email ${id}:`, error);
        email.status = 'pending';
      }
    }

    this.cleanupQueue();
  }

  private cleanupQueue() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    Array.from(this.queue.entries()).forEach(([id, email]) => {
      if (
        (email.status === 'completed' || email.status === 'failed') &&
        email.lastAttempt &&
        email.lastAttempt < oneDayAgo
      ) {
        this.queue.delete(id);
      }
    });
  }

  // Add method to get email status by ID
  public getEmailStatus(id: string): QueuedEmail | undefined {
    return this.queue.get(id);
  }

  // Add method to retry failed email
  public async retryEmail(id: string): Promise<void> {
    const email = this.queue.get(id);
    if (!email) {
      throw new Error('Email not found');
    }
    if (email.status !== 'failed') {
      throw new Error('Can only retry failed emails');
    }

    email.status = 'pending';
    email.attempts = 0;
  }

  public getQueueStatus(): { total: number, pending: number, processing: number, completed: number, failed: number } {
    let pending = 0, processing = 0, completed = 0, failed = 0;

    Array.from(this.queue.values()).forEach(email => {
      switch (email.status) {
        case 'pending':
          pending++;
          break;
        case 'processing':
          processing++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
      }
    });

    return {
      total: this.queue.size,
      pending,
      processing,
      completed,
      failed
    };
  }
}

export default EmailQueueService.getInstance();
