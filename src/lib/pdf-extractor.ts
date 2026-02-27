// Server-side only — do not import in client components
import type { Buffer } from 'buffer';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // pdf-parse v2 uses class-based API: new PDFParse({ data: buffer })
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PDFParse } = require('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text as string;
}
