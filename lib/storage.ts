import { getSupabase } from "./db";
import { env } from "./env";
import type { ReceivedAttachment } from "./email";

export async function uploadPhotoAttachments(
  attachments: ReceivedAttachment[],
  questionId: number,
): Promise<string[]> {
  if (attachments.length === 0) return [];

  const supabase = getSupabase();
  const bucket = env.storageBucket();
  const urls: string[] = [];

  for (const attachment of attachments) {
    const response = await fetch(attachment.downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download attachment ${attachment.filename}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const safeName = sanitizeFilename(attachment.filename);
    const path = `question-${questionId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: attachment.contentType,
      upsert: false,
    });

    if (error) {
      throw new Error(`Failed to upload ${attachment.filename}: ${error.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}
