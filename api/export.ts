import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getQuestionsWithAnswers } from "../lib/db";
import {
  formatAsJson,
  formatAsMarkdown,
  toExportEntries,
} from "../lib/export";
import { env } from "../lib/env";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const secret = req.query.secret;
  if (secret !== env.exportSecret()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const format = (req.query.format as string | undefined)?.toLowerCase() ?? "json";
    const rows = await getQuestionsWithAnswers();
    const entries = toExportEntries(rows);

    if (format === "markdown" || format === "md") {
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.status(200).send(formatAsMarkdown(entries));
      return;
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).send(formatAsJson(entries));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("export failed:", message);
    res.status(500).json({ error: message });
  }
}
