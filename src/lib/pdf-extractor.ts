// Server-side only — do not import in client components
import type { Buffer } from 'buffer';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Use lib path directly to avoid pdf-parse's index.js test code
  // which crashes on Vercel because module.parent is null in Node 22+
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js');
  const data = await pdfParse(buffer);
  return data.text as string;
}
