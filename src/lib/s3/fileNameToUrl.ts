import 'server-only';

/**
 * The database only stores the `fileName` of the files (image/video),
 * use this function to get the full Supabase Storage URL of the file.
 */
export function fileNameToUrl(fileName: string | null) {
  if (!fileName) return null;
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/hq-posts/${fileName}`;
}
