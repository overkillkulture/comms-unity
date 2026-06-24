import 'server-only';
import { supabase, STORAGE_BUCKET } from './s3Client';

export async function deleteObject(fileName: string) {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([fileName]);

  if (error) {
    throw new Error(`Supabase delete failed: ${error.message}`);
  }
}
