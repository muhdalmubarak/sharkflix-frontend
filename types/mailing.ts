// types/mailing.ts

export interface MailingContent {
  groups: string[];
  customEmails: string;
  subject: string;
  content: string;
  eventId?: string;
}

export interface Mailing {
  id: number;
  title: string;
  content: string | MailingContent; // Can be either string or parsed content
  status: 'draft' | 'sent';
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveMailingData {
  id?: number;
  title: string;
  groups: string[];
  customEmails: string;
  subject: string;
  content: string;
  status: 'draft' | 'sent';
  cloneFromId?: number;
}

export interface MailingResponse {
  message: string;
  mailing?: Mailing;
  error?: string;
}
