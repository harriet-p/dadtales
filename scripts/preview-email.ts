import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getNextUnsentQuestion } from "../lib/db";
import { renderWeeklyQuestionEmail } from "../lib/render-email";

async function previewEmail(): Promise<void> {
  const question = await getNextUnsentQuestion();
  const questionText =
    question?.text ??
    "What is your earliest childhood memory?";
  const weekNumber = question?.send_order ?? 1;

  const { html } = await renderWeeklyQuestionEmail({
    questionText,
    weekNumber,
  });

  const outDir = join(process.cwd(), ".preview");
  const outPath = join(outDir, "weekly-question.html");

  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, html, "utf8");

  console.log(`Previewing question #${weekNumber}:`);
  console.log(questionText);
  console.log(`Wrote ${outPath}`);
  console.log("Open it in a browser to preview the layout.");
}

previewEmail().catch((error) => {
  console.error(error);
  process.exit(1);
});
