import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractReplyBody, stripQuotedReply } from "../lib/quote-stripper.js";

describe("stripQuotedReply", () => {
  it("keeps text before Gmail-style On ... wrote:", () => {
    const input = `Here is my answer about the old house.

On Sun, Jul 5, 2026 at 9:00 AM Questions <questions@example.com> wrote:
> What was your childhood home like?`;

    assert.equal(
      stripQuotedReply(input),
      "Here is my answer about the old house.",
    );
  });

  it("keeps text before Original Message divider", () => {
    const input = `My reply here.

-----Original Message-----
From: questions@example.com`;

    assert.equal(stripQuotedReply(input), "My reply here.");
  });

  it("removes lines starting with >", () => {
    const input = `Fresh reply.

> quoted line one
> quoted line two`;

    assert.equal(stripQuotedReply(input), "Fresh reply.");
  });

  it("removes Sent from my iPhone signature", () => {
    const input = `Short answer.

Sent from my iPhone`;

    assert.equal(stripQuotedReply(input), "Short answer.");
  });
});

describe("extractReplyBody", () => {
  it("prefers plain text over html", () => {
    assert.equal(
      extractReplyBody("Plain answer", "<p>HTML answer</p>"),
      "Plain answer",
    );
  });

  it("falls back to html when text is empty", () => {
    assert.equal(
      extractReplyBody(null, "<p>HTML <strong>answer</strong></p>"),
      "HTML answer",
    );
  });
});
