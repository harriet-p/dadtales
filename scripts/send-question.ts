import "dotenv/config";
import {
  getNextUnsentQuestion,
  markQuestionSent,
} from "../lib/db";
import { sendWeeklyQuestion } from "../lib/email";
import { env } from "../lib/env";

interface CliOptions {
  test: boolean;
  text?: string;
  to?: string;
  noMark: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { test: false, noMark: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--test") {
      options.test = true;
    } else if (arg === "--no-mark") {
      options.noMark = true;
    } else if (arg === "--text" && argv[i + 1]) {
      options.text = argv[++i];
    } else if (arg === "--to" && argv[i + 1]) {
      options.to = argv[++i];
    }
  }

  return options;
}

function resolveRecipient(options: CliOptions): string {
  if (options.to) return options.to;
  if (options.test) {
    const testEmail = env.testEmail();
    if (!testEmail) {
      throw new Error(
        "Test mode needs TEST_EMAIL in .env or --to you@example.com",
      );
    }
    return testEmail;
  }
  return env.dadEmail();
}

async function sendQuestion(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const recipient = resolveRecipient(options);

  if (options.text) {
    console.log(`Sending test question to ${recipient}...`);
    await sendWeeklyQuestion(options.text, { to: recipient, weekNumber: 1 });
    console.log("Sent:", options.text);
    return;
  }

  const question = await getNextUnsentQuestion();

  if (!question) {
    console.log("All questions have been sent.");
    return;
  }

  console.log(
    `Sending question #${question.send_order} to ${recipient}${options.test ? " (test)" : ""}...`,
  );

  await sendWeeklyQuestion(question.text, {
    to: recipient,
    weekNumber: question.send_order,
  });

  if (!options.noMark && !options.test) {
    await markQuestionSent(question.id);
  }

  console.log("Sent:", question.text);
}

sendQuestion().catch((error) => {
  console.error(error);
  process.exit(1);
});
