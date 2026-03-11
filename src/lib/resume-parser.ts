import { PDFParse } from "pdf-parse";
import * as mammoth from "mammoth";
import fs from "fs";

export async function parseResume(
  filePath: string,
  fileType: string
): Promise<string> {
  const buffer = fs.readFileSync(filePath);

  switch (fileType) {
    case "pdf": {
      const pdf = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await pdf.getText();
      return result.text;
    }
    case "docx": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case "txt": {
      return buffer.toString("utf-8");
    }
    case "image": {
      // Image resumes are stored as-is; text extraction not supported
      return "[Image resume — text extraction not available. Use AI tools to review the uploaded image.]";
    }
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
