import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getNextUnsentQuestion,
  markQuestionSent,
} from "../../lib/db.js";
import { sendWeeklyQuestion } from "../../lib/email.js";
import { env } from "../../lib/env.js";

function isAuthorizedCron(req: VercelRequest): boolean {
  const secret = env.cronSecret();
  if (!secret) return true;

  const auth = req.headers.authorization;
  return auth === `Bearer ${secret}`;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isAuthorizedCron(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const question = await getNextUnsentQuestion();

    if (!question) {
      res.status(200).json({ ok: true, message: "All questions have been sent." });
      return;
    }

    await sendWeeklyQuestion(question.text, {
      weekNumber: question.send_order,
    });
    await markQuestionSent(question.id);

    res.status(200).json({
      ok: true,
      questionId: question.id,
      sendOrder: question.send_order,
      text: question.text,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("send-question cron failed:", message);
    res.status(500).json({ error: message });
  }
}
