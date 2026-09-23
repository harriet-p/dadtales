import "dotenv/config";
import { writeFileSync } from "node:fs";
import { getQuestionsWithAnswers } from "../lib/db.js";
import {
  formatAsJson,
  formatAsMarkdown,
  toExportEntries,
} from "../lib/export.js";

function parseFormat(): "json" | "markdown" {
  const arg = process.argv.find((value) => value.startsWith("--format"));
  if (!arg) return "json";

  const format = arg.includes("=") ? arg.split("=")[1] : process.argv[process.argv.indexOf(arg) + 1];
  if (format === "markdown" || format === "md") return "markdown";
  return "json";
}

async function runExport(): Promise<void> {
  const format = parseFormat();
  const rows = await getQuestionsWithAnswers();
  const entries = toExportEntries(rows);
  const output = format === "markdown" ? formatAsMarkdown(entries) : formatAsJson(entries);
  const filename = format === "markdown" ? "export.md" : "export.json";

  writeFileSync(filename, output, "utf8");
  console.log(`Wrote ${filename} (${entries.length} questions).`);
}

runExport().catch((error) => {
  console.error(error);
  process.exit(1);
});
