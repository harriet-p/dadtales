/**
 * Strip quoted reply chains from email text bodies.
 * Handles common patterns from Gmail, Apple Mail, Outlook, and generic clients.
 */
export function stripQuotedReply(text: string): string {
  if (!text?.trim()) return "";

  let body = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Outlook / generic: -----Original Message-----
  const originalMessageIdx = body.search(/^-{2,}\s*Original Message\s*-{2,}/im);
  if (originalMessageIdx > 0) {
    body = body.slice(0, originalMessageIdx);
  }

  // Gmail / Apple Mail: "On Mon, Jan 1, 2024 at 9:00 AM Name <email> wrote:"
  const onWroteMatch = body.match(
    /\nOn .{10,120} wrote:\s*\n/i,
  );
  if (onWroteMatch?.index !== undefined && onWroteMatch.index > 0) {
    body = body.slice(0, onWroteMatch.index);
  }

  // Alternative: "On ... wrote:" without leading newline (start of quoted block)
  const onWroteAlt = body.search(/\nOn .+ wrote:\s*$/im);
  if (onWroteAlt > 0) {
    body = body.slice(0, onWroteAlt);
  }

  // Forwarded message header
  const forwardedIdx = body.search(/^-{2,}\s*Forwarded message\s*-{2,}/im);
  if (forwardedIdx > 0) {
    body = body.slice(0, forwardedIdx);
  }

  // Outlook-style From:/Sent:/To:/Subject: block
  const outlookHeaderIdx = body.search(
    /\nFrom:\s*.+\n(?:Sent|Date):\s*.+\nTo:\s*.+/i,
  );
  if (outlookHeaderIdx > 0) {
    body = body.slice(0, outlookHeaderIdx);
  }

  // Lines starting with > (classic quoting)
  const lines = body.split("\n");
  const quoteStart = lines.findIndex((line) => /^>/.test(line.trimStart()));
  if (quoteStart > 0) {
    body = lines.slice(0, quoteStart).join("\n");
  }

  // Mobile signatures often left behind
  body = body.replace(/\nSent from my (iPhone|iPad|Android|Galaxy).*/gi, "");

  // Trim trailing whitespace per line and overall
  return body
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

/**
 * Prefer plain text; fall back to a rough HTML-to-text conversion.
 */
export function extractReplyBody(text: string | null, html: string | null): string {
  if (text?.trim()) {
    return stripQuotedReply(text);
  }

  if (html?.trim()) {
    const roughText = html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');

    return stripQuotedReply(roughText);
  }

  return "";
}
