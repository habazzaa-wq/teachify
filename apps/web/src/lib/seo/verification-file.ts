/**
 * Google Search Console's HTML-file verification method gives each property a
 * file name such as `googleabc123.html`. Its content is always the same single
 * line, derived from that file name.
 *
 * Keeping only the file name in tenant settings (instead of arbitrary HTML)
 * avoids serving user-supplied markup from a tenant root while still letting
 * every tenant verify its own domain without a deploy.
 */
const GOOGLE_VERIFICATION_FILE = /^google[A-Za-z0-9_-]+\.html$/;

export function isGoogleVerificationFileName(value: string): boolean {
  return GOOGLE_VERIFICATION_FILE.test(value.trim());
}

export function googleVerificationFileContent(fileName: string): string {
  return `google-site-verification: ${fileName.trim()}`;
}
