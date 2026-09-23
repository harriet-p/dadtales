import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";
import type { Answer, Question, QuestionWithAnswer } from "./types";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export async function getNextUnsentQuestion(): Promise<Question | null> {
  const { data, error } = await getSupabase()
    .from("questions")
    .select("*")
    .is("sent_at", null)
    .order("send_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch next question: ${error.message}`);
  return data;
}

export async function markQuestionSent(questionId: number): Promise<void> {
  const { error } = await getSupabase()
    .from("questions")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", questionId);

  if (error) throw new Error(`Failed to mark question sent: ${error.message}`);
}

export async function getMostRecentlySentQuestion(): Promise<Question | null> {
  const { data, error } = await getSupabase()
    .from("questions")
    .select("*")
    .not("sent_at", "is", null)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch most recent sent question: ${error.message}`);
  }
  return data;
}

export async function insertAnswer(
  questionId: number,
  bodyText: string,
  photoUrls: string[],
): Promise<Answer> {
  const { data, error } = await getSupabase()
    .from("answers")
    .insert({
      question_id: questionId,
      body_text: bodyText,
      photo_urls: photoUrls,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to insert answer: ${error.message}`);
  return data;
}

export async function getQuestionsWithAnswers(): Promise<QuestionWithAnswer[]> {
  const { data: questions, error: questionsError } = await getSupabase()
    .from("questions")
    .select("*")
    .order("send_order", { ascending: true });

  if (questionsError) {
    throw new Error(`Failed to fetch questions: ${questionsError.message}`);
  }

  const { data: answers, error: answersError } = await getSupabase()
    .from("answers")
    .select("*")
    .order("received_at", { ascending: true });

  if (answersError) {
    throw new Error(`Failed to fetch answers: ${answersError.message}`);
  }

  const answersByQuestion = new Map<number, Answer>();
  for (const answer of answers ?? []) {
    const existing = answersByQuestion.get(answer.question_id);
    if (!existing || answer.received_at > existing.received_at) {
      answersByQuestion.set(answer.question_id, answer);
    }
  }

  return (questions ?? []).map((question) => ({
    ...question,
    answer: answersByQuestion.get(question.id) ?? null,
  }));
}
