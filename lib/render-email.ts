import { render } from "@react-email/render";
import {
  WeeklyQuestionEmail,
  type WeeklyQuestionEmailProps,
} from "../emails/weekly-question.js";

const REPLY_INSTRUCTION =
  "Just hit reply and write as much or as little as you like. Photos welcome.";

export async function renderWeeklyQuestionEmail(
  props: WeeklyQuestionEmailProps,
): Promise<{ html: string; text: string }> {
  const html = await render(WeeklyQuestionEmail(props));
  const text = buildPlainText(props.questionText, props.weekNumber);

  return { html, text };
}

function buildPlainText(questionText: string, weekNumber?: number): string {
  const header =
    weekNumber !== undefined
      ? `Dad Tales — Question ${weekNumber}\n\n`
      : "Dad Tales\n\n";

  return `${header}This week's question:\n\n${questionText}\n\n---\n${REPLY_INSTRUCTION}`;
}
