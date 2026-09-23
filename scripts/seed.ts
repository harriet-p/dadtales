import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getSupabase } from "../lib/db.js";
import type { SeedQuestion } from "../lib/types.js";

const questionsPath = join(process.cwd(), "data/questions.json");
const questions: SeedQuestion[] = JSON.parse(readFileSync(questionsPath, "utf8"));

function validateQuestions(rows: SeedQuestion[]): void {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("data/questions.json must be a non-empty JSON array");
  }

  const orders = new Set<number>();
  for (const [index, row] of rows.entries()) {
    if (!row.text?.trim()) {
      throw new Error(`Question at index ${index} is missing text`);
    }
    if (!Number.isInteger(row.send_order) || row.send_order < 1) {
      throw new Error(`Question at index ${index} needs a positive integer send_order`);
    }
    if (orders.has(row.send_order)) {
      throw new Error(`Duplicate send_order: ${row.send_order}`);
    }
    orders.add(row.send_order);
    if (!row.theme?.trim()) {
      throw new Error(`Question at index ${index} is missing theme`);
    }
    if (!row.chronology_period?.trim()) {
      throw new Error(`Question at index ${index} is missing chronology_period`);
    }
  }
}

async function seed(): Promise<void> {
  validateQuestions(questions);

  const supabase = getSupabase();

  const { count, error: countError } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(`Failed to check questions table: ${countError.message}`);
  }

  if ((count ?? 0) > 0) {
    console.log(`Skipping seed — ${count} questions already exist.`);
    return;
  }

  const rows = questions.map((question) => ({
    text: question.text.trim(),
    send_order: question.send_order,
    theme: question.theme.trim(),
    chronology_period: question.chronology_period.trim(),
    bonus: question.bonus ?? false,
  }));

  const { error } = await supabase.from("questions").insert(rows);

  if (error) {
    throw new Error(`Failed to seed questions: ${error.message}`);
  }

  const bonusCount = rows.filter((row) => row.bonus).length;
  console.log(
    `Seeded ${rows.length} questions (${rows.length - bonusCount} core, ${bonusCount} bonus).`,
  );
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
