import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

export interface ParsedDocument {
  text: string;
  metadata?: {
    pageCount?: number;
    author?: string;
    title?: string;
  };
}

export class DocumentParserService {
  /**
   * Parse PDF file and extract text
   */
  async parsePDF(buffer: Buffer): Promise<ParsedDocument> {
    try {
      const data = await pdf(buffer);

      return {
        text: data.text,
        metadata: {
          pageCount: data.numpages,
          title: data.info?.Title,
          author: data.info?.Author,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * Parse DOCX file and extract text
   */
  async parseDOCX(buffer: Buffer): Promise<ParsedDocument> {
    try {
      const result = await mammoth.extractRawText({ buffer });

      return {
        text: result.value,
        metadata: {},
      };
    } catch (error: any) {
      throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
  }

  /**
   * Parse TXT file
   */
  parseTXT(buffer: Buffer): ParsedDocument {
    try {
      const text = buffer.toString('utf-8');

      return {
        text,
        metadata: {},
      };
    } catch (error: any) {
      throw new Error(`Failed to parse TXT: ${error.message}`);
    }
  }

  /**
   * Parse Excel file (XLSX, XLS, CSV) and extract text
   */
  parseExcel(buffer: Buffer): ParsedDocument {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let text = '';

      // Iterate through all sheets
      workbook.SheetNames.forEach((sheetName, index) => {
        const sheet = workbook.Sheets[sheetName];

        if (index > 0) {
          text += `\n\n--- Sheet: ${sheetName} ---\n\n`;
        } else {
          text += `Sheet: ${sheetName}\n\n`;
        }

        // Convert sheet to CSV format for better text representation
        const csv = XLSX.utils.sheet_to_csv(sheet);
        text += csv;
      });

      return {
        text,
        metadata: {
          title: workbook.SheetNames.join(', '),
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Parse document based on mime type
   */
  async parseDocument(buffer: Buffer, mimeType: string, filename: string): Promise<ParsedDocument> {
    console.log(`Parsing document: ${filename} (${mimeType})`);

    // Normalize mime type and check file extension as fallback
    const extension = filename.toLowerCase().split('.').pop() || '';

    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return this.parsePDF(buffer);
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      extension === 'docx'
    ) {
      return this.parseDOCX(buffer);
    } else if (
      mimeType === 'text/plain' ||
      extension === 'txt' ||
      extension === 'md'
    ) {
      return this.parseTXT(buffer);
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel' ||
      mimeType === 'text/csv' ||
      extension === 'xlsx' ||
      extension === 'xls' ||
      extension === 'csv'
    ) {
      return this.parseExcel(buffer);
    } else {
      throw new Error(`Unsupported file type: ${mimeType} (${extension})`);
    }
  }

  /**
   * Get supported file types
   */
  getSupportedTypes(): string[] {
    return [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    return ['pdf', 'docx', 'txt', 'md', 'xlsx', 'xls', 'csv'];
  }
}

export const documentParserService = new DocumentParserService();
