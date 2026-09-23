import type { ExportEntry, QuestionWithAnswer } from "./types";

/** Ordered by weekly send sequence (`send_order`). */
export function toExportEntries(rows: QuestionWithAnswer[]): ExportEntry[] {
  return rows.map((row) => ({
    question: row.text,
    answer_text: row.answer?.body_text ?? null,
    photo_urls: row.answer?.photo_urls ?? [],
    date_answered: row.answer?.received_at ?? null,
  }));
}

export function formatAsJson(entries: ExportEntry[]): string {
  return JSON.stringify({ entries }, null, 2);
}

export function formatAsMarkdown(entries: ExportEntry[]): string {
  const lines: string[] = ["# Dad Tales — Export", ""];

  for (const entry of entries) {
    lines.push(`## ${entry.question}`);

    if (entry.date_answered) {
      lines.push(`*Answered ${formatDate(entry.date_answered)}*`);
      lines.push("");
      lines.push(entry.answer_text ?? "");
    } else {
      lines.push("*No answer yet*");
    }

    lines.push("");

    for (const url of entry.photo_urls) {
      lines.push(`![photo](${url})`);
    }

    if (entry.photo_urls.length > 0) {
      lines.push("");
    }
  }

  return lines.join("\n").trim() + "\n";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
