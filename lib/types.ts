export interface Question {
  id: number;
  text: string;
  send_order: number;
  theme: string;
  chronology_period: string;
  bonus: boolean;
  sent_at: string | null;
  created_at: string;
}

export interface Answer {
  id: number;
  question_id: number;
  body_text: string;
  photo_urls: string[];
  received_at: string;
}

export interface QuestionWithAnswer extends Question {
  answer: Answer | null;
}

export interface ExportEntry {
  question: string;
  answer_text: string | null;
  photo_urls: string[];
  date_answered: string | null;
}

/** Shape expected in data/questions.json for seeding. */
export interface SeedQuestion {
  text: string;
  send_order: number;
  theme: string;
  chronology_period: string;
  bonus?: boolean;
}

export interface ResendEmailReceivedWebhook {
  type: "email.received";
  created_at: string;
  data: {
    email_id: string;
    created_at: string;
    from: string;
    to: string[];
    subject: string;
    attachments: Array<{
      id: string;
      filename: string;
      content_type: string;
    }>;
  };
}
