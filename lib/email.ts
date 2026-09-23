import { Resend } from "resend";
import { env } from "./env";
import { renderWeeklyQuestionEmail } from "./render-email";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(env.resendApiKey());
  }
  return resend;
}

export interface SendWeeklyQuestionOptions {
  questionText: string;
  weekNumber?: number;
  to?: string;
}

export async function sendWeeklyQuestion(
  questionText: string,
  options: Omit<SendWeeklyQuestionOptions, "questionText"> = {},
): Promise<void> {
  const { html, text } = await renderWeeklyQuestionEmail({
    questionText,
    weekNumber: options.weekNumber,
  });

  const { error } = await getResend().emails.send({
    from: env.fromEmail(),
    to: options.to ?? env.dadEmail(),
    replyTo: env.replyToEmail(),
    subject: "This week's question",
    text,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export interface NotifyReplyOptions {
  questionText: string;
  answerText: string;
  photoUrls: string[];
  from: string;
  weekNumber?: number;
}

/** Email you a copy after Dad's reply is stored. */
export async function notifyReplyReceived(
  options: NotifyReplyOptions,
): Promise<void> {
  const to = env.notifyEmail();
  if (!to) return;

  const week =
    options.weekNumber !== undefined ? ` (question ${options.weekNumber})` : "";
  const photos =
    options.photoUrls.length > 0
      ? `\n\nPhotos:\n${options.photoUrls.map((url) => `- ${url}`).join("\n")}`
      : "";

  const text = [
    `Dad replied${week}.`,
    "",
    `From: ${options.from}`,
    "",
    "Question:",
    options.questionText,
    "",
    "Answer:",
    options.answerText,
    photos,
  ].join("\n");

  const photoHtml =
    options.photoUrls.length > 0
      ? `<p><strong>Photos</strong></p><ul>${options.photoUrls
          .map((url) => `<li><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`)
          .join("")}</ul>`
      : "";

  const { error } = await getResend().emails.send({
    from: env.fromEmail(),
    to,
    subject: `Dad Tales — new reply${week}`,
    text,
    html: `
      <p>Dad replied${escapeHtml(week)}.</p>
      <p><strong>From:</strong> ${escapeHtml(options.from)}</p>
      <p><strong>Question</strong></p>
      <p>${escapeHtml(options.questionText)}</p>
      <p><strong>Answer</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(options.answerText)}</p>
      ${photoHtml}
    `.trim(),
  });

  if (error) {
    throw new Error(`Failed to send reply notification: ${error.message}`);
  }
}

export function verifyResendWebhook(
  payload: string,
  headers: {
    id?: string;
    timestamp?: string;
    signature?: string;
  },
): boolean {
  try {
    getResend().webhooks.verify({
      payload,
      headers: {
        id: headers.id ?? "",
        timestamp: headers.timestamp ?? "",
        signature: headers.signature ?? "",
      },
      webhookSecret: env.resendWebhookSecret(),
    });
    return true;
  } catch {
    return false;
  }
}

export interface ReceivedEmailContent {
  text: string | null;
  html: string | null;
  from: string;
  subject: string;
}

export async function fetchReceivedEmail(
  emailId: string,
): Promise<ReceivedEmailContent> {
  const { data, error } = await getResend().emails.receiving.get(emailId);

  if (error || !data) {
    throw new Error(`Failed to fetch received email: ${error?.message ?? "unknown"}`);
  }

  return {
    text: data.text ?? null,
    html: data.html ?? null,
    from: data.from,
    subject: data.subject ?? "",
  };
}

export interface ReceivedAttachment {
  id: string;
  filename: string;
  contentType: string;
  downloadUrl: string;
}

export async function fetchImageAttachments(
  emailId: string,
): Promise<ReceivedAttachment[]> {
  const { data, error } = await getResend().emails.receiving.attachments.list({
    emailId,
  });

  if (error || !data) {
    throw new Error(`Failed to list attachments: ${error?.message ?? "unknown"}`);
  }

  return (data.data ?? [])
    .filter((attachment) => attachment.content_type && isImageContentType(attachment.content_type))
    .map((attachment) => ({
      id: attachment.id,
      filename: attachment.filename ?? `attachment-${attachment.id}`,
      contentType: attachment.content_type,
      downloadUrl: attachment.download_url,
    }));
}

function isImageContentType(contentType: string): boolean {
  return contentType.toLowerCase().startsWith("image/");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
