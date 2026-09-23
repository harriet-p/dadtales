import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getMostRecentlySentQuestion,
  insertAnswer,
} from "../lib/db";
import {
  extractReplyBody,
} from "../lib/quote-stripper";
import {
  fetchImageAttachments,
  fetchReceivedEmail,
  notifyReplyReceived,
  verifyResendWebhook,
} from "../lib/email";
import { uploadPhotoAttachments } from "../lib/storage";
import type { ResendEmailReceivedWebhook } from "../lib/types";

export const config = {
  maxDuration: 30,
  api: {
    bodyParser: false,
  },
  includeFiles: ["lib/**", "emails/**"],
};

async function readRawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const rawBody = await readRawBody(req);

    const verified = verifyResendWebhook(rawBody, {
      id: req.headers["svix-id"] as string | undefined,
      timestamp: req.headers["svix-timestamp"] as string | undefined,
      signature: req.headers["svix-signature"] as string | undefined,
    });

    if (!verified) {
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    const event = JSON.parse(rawBody) as ResendEmailReceivedWebhook;

    if (event.type !== "email.received") {
      res.status(200).json({ ok: true, ignored: true });
      return;
    }

    const emailId = event.data.email_id;
    const email = await fetchReceivedEmail(emailId);
    const bodyText = extractReplyBody(email.text, email.html);

    if (!bodyText.trim()) {
      res.status(400).json({ error: "Reply body was empty after quote stripping" });
      return;
    }

    const question = await getMostRecentlySentQuestion();
    if (!question) {
      res.status(400).json({ error: "No sent question found to attach answer to" });
      return;
    }

    const imageAttachments = await fetchImageAttachments(emailId);
    const photoUrls = await uploadPhotoAttachments(imageAttachments, question.id);

    const answer = await insertAnswer(question.id, bodyText, photoUrls);

    try {
      await notifyReplyReceived({
        questionText: question.text,
        answerText: bodyText,
        photoUrls,
        from: email.from,
        weekNumber: question.send_order,
      });
    } catch (notifyError) {
      // Reply is already stored — don't fail the webhook if notify email fails
      console.error(
        "Failed to notify reply copy:",
        notifyError instanceof Error ? notifyError.message : notifyError,
      );
    }

    res.status(200).json({
      ok: true,
      answerId: answer.id,
      questionId: question.id,
      photoCount: photoUrls.length,
      from: email.from,
      subject: email.subject,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("inbound webhook failed:", message);
    res.status(500).json({ error: message });
  }
}
