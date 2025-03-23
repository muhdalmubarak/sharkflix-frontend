// services/notification.service.ts
import prisma from "@/app/utils/db";
import { Resend } from 'resend';
// import Logo from "../public/Red and Black Simple Modern Apparel Sport Logo.png";

// Types and Interfaces
interface EmailTemplate {
  subject: string;
  html: string;
}

interface BaseNotificationData {
  userEmail: string;
  userId?: number;
}

interface PaymentNotificationData extends BaseNotificationData {
  transactionId: string;
  amount: string | number;
  paymentMethod?: string;
}

interface TicketNotificationData extends PaymentNotificationData {
  eventId: number;
  eventTitle: string;
  ticketId?: number;
  ticketCode: string;
  eventDate?: Date;
}

interface EventReminderData extends BaseNotificationData {
  eventTitle: string;
  eventDate: Date;
  ticketCode: string;
  streamUrl?: string;
  hoursUntilStart: number;
}

interface RefundNotificationData extends BaseNotificationData {
  amount: number;
  transactionId: string;
  refundId: number;
}

interface VideoPurchaseData extends PaymentNotificationData {
  youtubeUrl: string;
}

export class NotificationService {
  private static resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY || "");
  private static fromEmail = "Sharkv <help@sharkv.my>";
  private static appName = "Sharkv";
  // private static logoUrl = "/Red and Black Simple Modern Apparel Sport Logo.png";

  // Base Template Methods
  private static getBaseEmailTemplate(content: string): string {
    return `
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; background-color: #f8f8f8; padding: 20px;">
                <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                    ${content}
                    <hr style="border-top: 1px solid #ccc; margin-top: 20px;">
                    <footer style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">
                        © ${new Date().getFullYear()} ${this.appName}. All rights reserved.
                        <p style="margin-top: 10px;">
                            If you have any questions, please contact our support team.
                        </p>
                    </footer>
                </div>
            </body>
        </html>`;
  }

  // Helper Methods
  private static formatCurrency(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `MYR ${numAmount.toFixed(2)}`;
  }

  private static formatPaymentMethod(method: string): string {
    return method
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private static async getUserId(email: string): Promise<number> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user?.id ? Number(user.id) : 0;
  }

  // Core Notification Methods
  private static async sendEmail(to: string, template: EmailTemplate) {
    try {
      console.log('Attempting to send email to:', to);
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: template.subject,
        html: this.getBaseEmailTemplate(template.html),
      });
      console.log('Email send result:', result);
      return result;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  static async createNotification(params: {
    userId: number;
    title: string;
    message: string;
    type: string;
    emailSent?: boolean;
    metadata?: any;
  }) {
    return prisma.notifications.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        metadata: params.metadata || {},
      },
    });
  }

  // Authentication Related Notifications
  static async sendPasswordResetEmail(email: string, userId: string, eventId?: string, refCode?: string) {
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);
    if (refCode) params.append('refCode', refCode);
    params.append('token', userId);

    const resetLink = `${process.env.NEXT_PUBLIC_URL}/reset-password/?${params.toString()}`;

    const template = {
      subject: "Reset Your Password",
      html: `
                <h2 style="color: #007BFF; text-align: center;">Password Reset Request</h2>
                <p style="font-size: 16px; color: #333;">Hello,</p>
                <p style="font-size: 16px; color: #333;">
                    We received a request to reset your password. Click the button below to create a new password:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" 
                       style="background: #e50914; text-decoration: none; font-weight: 500; color: #fff; 
                              text-transform: uppercase; font-size: 14px; padding: 10px 24px; 
                              display: inline-block; border-radius: 50px;">
                        Reset Password
                    </a>
                </div>
                <p style="font-size: 14px; color: #666; margin-top: 20px;">
                    If you didn't request this password reset, you can safely ignore this email.
                </p>
            `
    };

    await this.sendEmail(email, template);
  }

  static async sendTemporaryPasswordEmail(email: string, tempPassword: string) {
    const template = {
      subject: "Your Temporary Password",
      html: `
                <h2 style="color: #007BFF; text-align: center;">Welcome to ${this.appName}!</h2>
                <p style="font-size: 16px; color: #333;">
                    Your account has been created. Here is your temporary password:
                </p>
                <div style="text-align: center; font-size: 24px; font-weight: bold; 
                            margin: 20px 0; padding: 15px; background: #f5f5f5; 
                            border-radius: 5px; color: #007BFF;">
                    ${tempPassword}
                </div>
                <p style="font-size: 14px; color: #666; text-align: center;">
                    For security reasons, please change this password after logging in.
                </p>
            `
    };

    await this.sendEmail(email, template);
  }

  // Payment Related Notifications
  static async notifyPaymentPending(data: PaymentNotificationData & { eventTitle?: string }) {
    const template = {
      subject: `Payment Pending - ${data.eventTitle || 'Transaction'}`,
      html: `
                <h2 style="color: #007BFF; text-align: center;">Payment Processing</h2>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Amount:</strong> ${this.formatCurrency(data.amount)}</p>
                    <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
                    ${data.paymentMethod ? `<p style="margin: 5px 0;"><strong>Payment Method:</strong> ${this.formatPaymentMethod(data.paymentMethod)}</p>` : ''}
                    ${data.eventTitle ? `<p style="margin: 5px 0;"><strong>Event:</strong> ${data.eventTitle}</p>` : ''}
                </div>
                <p style="font-size: 14px; color: #666; text-align: center;">
                    We'll notify you once your payment is confirmed.
                </p>
            `
    };

    await this.sendEmail(data.userEmail, template);

    const userId = await this.getUserId(data.userEmail);
    if (userId) {
      await this.createNotification({
        userId,
        title: 'Payment Processing',
        message: `Your payment of ${this.formatCurrency(data.amount)} is being processed.`,
        type: 'payment_pending',
        metadata: {
          transactionId: data.transactionId,
          amount: data.amount,
          paymentMethod: data.paymentMethod
        }
      });
    }
  }

  static async notifyPaymentFailed(data: PaymentNotificationData) {
    const template = {
      subject: 'Payment Failed',
      html: `
                <h2 style="color: #dc3545; text-align: center;">Payment Failed</h2>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Amount:</strong> ${this.formatCurrency(data.amount)}</p>
                    <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
                </div>
                <p style="font-size: 14px; color: #666; text-align: center;">
                    Please try again or contact our support team if you continue to experience issues.
                </p>
            `
    };

    await this.sendEmail(data.userEmail, template);

    const userId = await this.getUserId(data.userEmail);
    if (userId) {
      await this.createNotification({
        userId,
        title: 'Payment Failed',
        message: `Your payment of ${this.formatCurrency(data.amount)} was unsuccessful.`,
        type: 'payment_failed',
        metadata: {
          transactionId: data.transactionId,
          amount: data.amount
        }
      });
    }
  }

  // Purchase Related Notifications
  static async notifyTicketPurchase(data: TicketNotificationData) {
    const template = {
      subject: `Ticket Confirmation - ${data.eventTitle}`,
      html: `
                <h2 style="color: #007BFF; text-align: center;">Your Ticket is Confirmed!</h2>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Event Details</h3>
                    <p style="margin: 5px 0;"><strong>Event:</strong> ${data.eventTitle}</p>
                    ${data.eventDate ? `<p style="margin: 5px 0;"><strong>Date:</strong> ${data.eventDate.toLocaleDateString()}</p>` : ''}
                    <p style="margin: 5px 0;"><strong>Ticket Code:</strong> ${data.ticketCode}</p>
                </div>
                <div style="background: #e8f4ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Payment Details</h3>
                    <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ${this.formatCurrency(data.amount)}</p>
                    ${data.paymentMethod ? `<p style="margin: 5px 0;"><strong>Payment Method:</strong> ${this.formatPaymentMethod(data.paymentMethod)}</p>` : ''}
                    <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
                </div>
            `
    };

    await this.sendEmail(data.userEmail, template);

    if (data.userId) {
      await this.createNotification({
        userId: data.userId,
        title: 'Ticket Purchase Successful',
        message: `Your ticket for ${data.eventTitle} has been confirmed.`,
        type: 'ticket_purchased',
        metadata: {
          eventId: data.eventId,
          ticketId: data.ticketId,
          transactionId: data.transactionId
        }
      });
    }
  }

  static async notifyVideoPurchase(data: VideoPurchaseData) {
    const template = {
      subject: 'Video Purchase Confirmation',
      html: `
                <h2 style="color: #007BFF; text-align: center;">Video Purchase Successful</h2>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Amount:</strong> ${this.formatCurrency(data.amount)}</p>
                    <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
                    ${data.paymentMethod ? `<p style="margin: 5px 0;"><strong>Payment Method:</strong> ${this.formatPaymentMethod(data.paymentMethod)}</p>` : ''}
                </div>
                <p style="font-size: 14px; color: #666; text-align: center;">
                    You can now access your purchased video content.
                </p>
            `
    };

    await this.sendEmail(data.userEmail, template);

    const userId = await this.getUserId(data.userEmail);
    if (userId) {
      await this.createNotification({
        userId,
        title: 'Video Purchase Successful',
        message: `Your video purchase was successful.`,
        type: 'video_purchased',
        metadata: {
          transactionId: data.transactionId,
          amount: data.amount,
          youtubeUrl: data.youtubeUrl
        }
      });
    }
  }

  // Event Related Notifications
  static async sendEventReminder(data: EventReminderData) {
    const template = {
      subject: `Reminder: ${data.eventTitle} Starting Soon`,
      html: `
                <h2 style="color: #007BFF; text-align: center;">Event Starting Soon!</h2>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Event:</strong> ${data.eventTitle}</p>
                    <p style="margin: 5px 0;"><strong>Starting In:</strong> ${data.hoursUntilStart} hours</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${data.eventDate.toLocaleDateString()}</p>
                    <p style="margin: 5px 0;"><strong>Ticket Code:</strong> ${data.ticketCode}</p>
                </div>
                ${data.streamUrl ? `
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${data.streamUrl}" 
                       style="background: #e50914; text-decoration: none; font-weight: 500; 
                              color: #fff; text-transform: uppercase; font-size: 14px; 
                              padding: 10px 24px; display: inline-block; border-radius: 50px;">
                        Join Stream
                    </a>
                </div>` : ''}
                <p style="font-size: 14px; color: #666; text-align: center;">
                    Get ready for an amazing experience!
                </p>
            `
    };

    await this.sendEmail(data.userEmail, template);

    const userId = await this.getUserId(data.userEmail);
    if (userId) {
      await this.createNotification({
        userId,
        title: 'Event Starting Soon',
        message: `${data.eventTitle} will start in ${data.hoursUntilStart} hours.`,
        type: 'event_reminder',
        metadata: {
          eventTitle: data.eventTitle,
          startTime: data.eventDate,
          ticketCode: data.ticketCode,
          streamUrl: data.streamUrl
        }
      });
    }
  }

  static async sendBookingReminder(data: {
    userEmail: string;
    eventTitle: string;
    bookingDate: Date;
    hoursUntilBooking: number;
  }) {
    const template = {
      subject: `Booking Opens Soon - ${data.eventTitle}`,
      html: `
                <h2 style="color: #007BFF; text-align: center;">Booking Opening Soon!</h2>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Event:</strong> ${data.eventTitle}</p>
                    <p style="margin: 5px 0;"><strong>Booking Opens In:</strong> ${data.hoursUntilBooking} hours</p>
                    <p style="margin: 5px 0;"><strong>Booking Time:</strong> ${data.bookingDate.toLocaleString()}</p>
                </div>
                <p style="font-size: 14px; color: #666; text-align: center;">
                    Don't miss your chance to get tickets!
                </p>
            `
    };

    await this.sendEmail(data.userEmail, template);

    const userId = await this.getUserId(data.userEmail);
    if (userId) {
      await this.createNotification({
        userId,
        title: 'Booking Opening Soon',
        message: `Booking for ${data.eventTitle} opens in ${data.hoursUntilBooking} hours.`,
        type: 'booking_reminder',
        metadata: {
          eventTitle: data.eventTitle,
          bookingTime: data.bookingDate
        }
      });
    }
  }

  // Refund Related Notifications
  static async notifyRefundInitiated(data: RefundNotificationData) {
    const template = {
      subject: 'Refund Initiated',
      html: `
                <h2 style="color: #007BFF; text-align: center;">Refund Initiated</h2>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Amount:</strong> ${this.formatCurrency(data.amount)}</p>
                    <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
                    <p style="margin: 5px 0;"><strong>Refund Reference:</strong> ${data.refundId}</p>
                </div>
                <p style="font-size: 14px; color: #666; text-align: center;">
                    The refund process typically takes 5-7 business days, depending on your bank.
                </p>
            `
    };

    await this.sendEmail(data.userEmail, template);

    const userId = await this.getUserId(data.userEmail);
    if (userId) {
      await this.createNotification({
        userId,
        title: 'Refund Initiated',
        message: `Your refund of ${this.formatCurrency(data.amount)} has been initiated.`,
        type: 'refund_initiated',
        metadata: {
          refundId: data.refundId,
          transactionId: data.transactionId,
          amount: data.amount
        }
      });
    }
  }

  // Ticket Recovery Notifications
  static async notifyTicketRecovered(data: TicketNotificationData) {
    const template = {
      subject: `Ticket Recovery Confirmation - ${data.eventTitle}`,
      html: `
                <h2 style="color: #007BFF; text-align: center;">Ticket Successfully Recovered!</h2>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Event Details</h3>
                    <p style="margin: 5px 0;"><strong>Event:</strong> ${data.eventTitle}</p>
                    <p style="margin: 5px 0;"><strong>Ticket Code:</strong> ${data.ticketCode}</p>
                </div>
                <div style="background: #e8f4ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Payment Details</h3>
                    <p style="margin: 5px 0;"><strong>Amount:</strong> ${data.amount}</p>
                    ${data.paymentMethod ? `<p style="margin: 5px 0;"><strong>Payment Method:</strong> ${this.formatPaymentMethod(data.paymentMethod)}</p>` : ''}
                    <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
                </div>
                <p style="font-size: 14px; color: #666; text-align: center;">
                    Please keep your ticket code safe as you'll need it to access the event.
                </p>
            `
    };

    await this.sendEmail(data.userEmail, template);

    if (data.userId) {
      await this.createNotification({
        userId: data.userId,
        title: 'Ticket Recovered Successfully',
        message: `Your ticket for ${data.eventTitle} has been recovered and confirmed.`,
        type: 'ticket_recovered',
        metadata: {
          eventId: data.eventId,
          ticketCode: data.ticketCode,
          transactionId: data.transactionId
        }
      });
    }
  }

  static async sendMassEmail(data: {
    userEmail: string;
    subject: string;
    content: string;
  }) {
    const template = {
      subject: data.subject,
      html: `
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          ${data.content}
        </div>
      `
    };

    await this.sendEmail(data.userEmail, template);
  }
}
