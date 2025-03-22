// utils/mailingHelpers.ts
import {MailingContent} from "@/types/mailing";

export const parseMailingContent = (content: string | MailingContent): MailingContent => {
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Error parsing mailing content:', error);
      return {
        groups: [],
        customEmails: '',
        subject: '',
        content: '',
        eventId: '',
      };
    }
  }
  return content;
};

export const formatDate = (dateString: string | Date | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
