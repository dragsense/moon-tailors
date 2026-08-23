/** Options for EmailService.send / sendAndRecord. */
export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  recipientUserId?: string | null;
  source?: string | null;
};

/** Inputs for EmailTemplateService HTML/text generation. */
export type EmailTemplateOptions = {
  title: string;
  greeting?: string;
  content: string;
  actionButton?: {
    text: string;
    url: string;
  };
  footerNote?: string;
  appName?: string;
  appUrl?: string;
};
