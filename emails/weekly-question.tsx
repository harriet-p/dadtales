import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { colors, fonts } from "./theme";

export interface WeeklyQuestionEmailProps {
  questionText: string;
  weekNumber?: number;
}

const REPLY_INSTRUCTION =
  "Just hit reply and write as much or as little as you like. Photos welcome.";

export function WeeklyQuestionEmail({
  questionText,
  weekNumber,
}: WeeklyQuestionEmailProps) {
  const preview = questionText.slice(0, 90).trim();

  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
          * { box-sizing: border-box; }
          img { max-width: 100% !important; height: auto !important; }
          table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          .email-body { width: 100% !important; }
          .email-card { width: 100% !important; max-width: 560px !important; }
          .question-heading { word-break: break-word !important; overflow-wrap: anywhere !important; }
          @media only screen and (max-width: 620px) {
            .email-body { padding: 16px 12px !important; }
            .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
            .question-heading { font-size: 22px !important; line-height: 1.4 !important; }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body} className="email-body">
        <Container style={styles.container} className="email-card">
          <Section style={styles.accentBar} />

          <Section style={styles.content} className="email-pad">
            <Text style={styles.kicker}>Dad Tales</Text>
            {weekNumber !== undefined ? (
              <Text style={styles.weekLabel}>Question {weekNumber}</Text>
            ) : null}

            <Section style={styles.questionCard}>
              <Text style={styles.questionLabel}>This week&apos;s question</Text>
              <Heading as="h1" style={styles.question} className="question-heading">
                {questionText}
              </Heading>
            </Section>

            <Section style={styles.replyBlock}>
              <Text style={styles.replyText}>{REPLY_INSTRUCTION}</Text>
            </Section>

            <Hr style={styles.divider} />

            <Text style={styles.footer}>
              You&apos;re receiving this because someone who loves you is collecting
              your stories.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WeeklyQuestionEmail;

const styles = {
  body: {
    backgroundColor: colors.background,
    margin: "0",
    padding: "24px 12px",
    width: "100%",
    fontFamily: fonts.sans,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: "8px",
    border: `1px solid ${colors.border}`,
    margin: "0 auto",
    width: "100%",
    maxWidth: "560px",
  },
  accentBar: {
    backgroundColor: colors.accent,
    height: "6px",
    lineHeight: "6px",
    fontSize: "6px",
    margin: "0",
    width: "100%",
  },
  /** Single padded column — avoids horizontal margins that overflow in clients. */
  content: {
    padding: "28px 24px 24px",
    width: "100%",
  },
  kicker: {
    color: colors.accent,
    fontFamily: fonts.sans,
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "0.12em",
    margin: "0 0 4px",
    textTransform: "uppercase" as const,
  },
  weekLabel: {
    color: colors.textMuted,
    fontSize: "14px",
    margin: "0 0 20px",
  },
  questionCard: {
    borderLeft: `4px solid ${colors.accentMuted}`,
    margin: "0 0 20px",
    padding: "0 0 0 16px",
    width: "100%",
  },
  questionLabel: {
    color: colors.textMuted,
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    margin: "0 0 12px",
    textTransform: "uppercase" as const,
  },
  question: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: "24px",
    fontWeight: 400,
    lineHeight: "1.45",
    margin: "0",
    wordBreak: "break-word" as const,
    overflowWrap: "anywhere" as const,
  },
  replyBlock: {
    backgroundColor: colors.background,
    margin: "0 0 20px",
    padding: "14px 16px",
    borderRadius: "6px",
    width: "100%",
  },
  replyText: {
    color: colors.text,
    fontSize: "15px",
    lineHeight: "1.5",
    margin: "0",
    wordBreak: "break-word" as const,
  },
  divider: {
    borderColor: colors.border,
    margin: "0 0 16px",
    width: "100%",
  },
  footer: {
    color: colors.textMuted,
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0",
    textAlign: "center" as const,
  },
};
