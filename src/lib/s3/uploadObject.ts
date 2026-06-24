import 'server-only';
import { supabase, STORAGE_BUCKET } from './s3Client';

export async function uploadObject(file: Buffer, fileName: string, contentType: string) {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }
}
