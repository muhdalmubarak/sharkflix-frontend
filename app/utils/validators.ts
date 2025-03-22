// app/utils/validators.ts
export const validateEmails = (emails: string): { isValid: boolean; error?: string } => {
  if (!emails.trim()) {
    return { isValid: true }; // Empty is valid as it's optional
  }

  const emailRegex = /^[\W]*([\w+\-.%]+@[\w\-.]+\.[A-Za-z]{2,4}[\W]*,{1}[\W]*)*([\w+\-.%]+@[\w\-.]+\.[A-Za-z]{2,4})[\W]*$/;

  if (!emailRegex.test(emails)) {
    return {
      isValid: false,
      error: 'Invalid email format. Please provide valid email addresses separated by commas.'
    };
  }

  return { isValid: true };
};
