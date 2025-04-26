// app/api/admin/mailings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from "@/app/utils/db";
import EmailQueueService from '@/services/emailQueue.service';
import {authOptions} from "@/app/utils/auth";
import {validateEmails} from "@/app/utils/validators";

// Get all mailings (both drafts and sent)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email ?? '' }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mailings = await prisma.mailing.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(mailings);
  } catch (error) {
    console.error('Error fetching mailings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mailings' },
      { status: 500 }
    );
  }
}

// Save new mailing or update existing
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email ?? '' }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, groups, customEmails, subject, content, status, cloneFromId, eventId } = body;

    const mailingData = {
      userId: user.id,
      title,
      content: JSON.stringify({
        groups,
        customEmails,
        subject,
        content,
        eventId,
      }),
      status: status || 'draft'
    };

    let mailing;

    if (cloneFromId) {
      // Clone existing mailing
      const existingMailing = await prisma.mailing.findUnique({
        where: { id: parseInt(cloneFromId) }
      });

      if (!existingMailing) {
        return NextResponse.json(
          { error: 'Original mailing not found' },
          { status: 404 }
        );
      }

      mailing = await prisma.mailing.create({
        data: {
          ...mailingData,
          status: 'draft', // Cloned mailing always starts as draft
          title: `${existingMailing.title} (Copy)`
        }
      });
    } else if (id) {
      // Update existing mailing
      mailing = await prisma.mailing.update({
        where: { id: parseInt(id) },
        data: mailingData
      });

      // If status is 'sent', queue the emails
      if (status === 'sent') {
        const { groups, customEmails, subject, content, eventId } = JSON.parse(mailingData.content);
        await queueEmails(groups, customEmails, subject, content, eventId);
      }
    } else {
      // Create new mailing
      mailing = await prisma.mailing.create({
        data: mailingData
      });
    }

    return NextResponse.json(mailing);
  } catch (error) {
    console.error('Error saving mailing:', error);
    return NextResponse.json(
      { error: 'Failed to save mailing' },
      { status: 500 }
    );
  }
}

// Delete mailing
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email ?? '' }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Mailing ID is required' },
        { status: 400 }
      );
    }

    await prisma.mailing.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Mailing deleted successfully' });
  } catch (error) {
    console.error('Error deleting mailing:', error);
    return NextResponse.json(
      { error: 'Failed to delete mailing' },
      { status: 500 }
    );
  }
}

async function queueEmails(groups: string[], customEmails: string, subject: string, content: string, eventId?: string) {
  let userEmails: string[] = [];

  if (groups && groups.length > 0) {
    // Handle regular user groups
    if (groups.some(g => g !== 'event_attendees')) {
      const regularUsers = await prisma.user.findMany({
        where: {
          role: {
            in: groups.filter(g => g !== 'event_attendees')
          }
        },
        select: {
          email: true
        }
      });

      userEmails = regularUsers.map(user => user.email).filter((email): email is string => email !== null);
    }

    // Handle event attendees
    if (groups.includes('event_attendees') && eventId) {
      const ticketHolders = await prisma.tickets.findMany({
        where: {
          eventId: parseInt(eventId),
          status: 'active'
        },
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      });

      const ticketHolderEmails = ticketHolders
        .map(ticket => ticket.user.email)
        .filter((email): email is string => email !== null);

      // Combine with existing emails, ensuring no duplicates
      userEmails = Array.from(new Set([...userEmails, ...ticketHolderEmails]));
    }
  }

  // Add and validate custom emails
  if (customEmails) {
    const { isValid, error } = validateEmails(customEmails);
    if (!isValid) {
      throw new Error(error);
    }

    const customEmailsList = customEmails.split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    const uniqueEmails = Array.from(new Set([...userEmails, ...customEmailsList]));
    userEmails = uniqueEmails;
  }

  // Validate we have recipients
  if (userEmails.length === 0) {
    throw new Error('No valid email recipients found');
  }

  // Queue emails
  const queuePromises = userEmails.map(email =>
    EmailQueueService.addToQueue('mass_email', {
      userEmail: email,
      subject,
      content: content.replace(/\n/g, '<br/>') // Convert newlines to HTML breaks
    })
  );

  try {
    await Promise.all(queuePromises);
  } catch (error) {
    console.error('Error queuing emails:', error);
    throw new Error('Failed to queue some emails');
  }
}
