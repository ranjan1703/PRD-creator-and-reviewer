import * as XLSX from 'xlsx';
import type { SurveyQuestion } from '../../../shared/types/research';

/**
 * Research Parser Service - Parse uploaded research data files
 * Handles Excel (.xlsx, .xls), CSV, and TXT files
 */
export class ResearchParserService {
  private static instance: ResearchParserService;

  private constructor() {
    console.log('📄 Research Parser Service initialized');
  }

  static getInstance(): ResearchParserService {
    if (!ResearchParserService.instance) {
      ResearchParserService.instance = new ResearchParserService();
    }
    return ResearchParserService.instance;
  }

  /**
   * Parse Excel survey responses
   */
  async parseSurveyExcel(buffer: Buffer): Promise<{
    data: any[];
    rowCount: number;
    columnCount: number;
  }> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (!data || data.length === 0) {
        throw new Error('Excel file is empty or has no data rows');
      }

      const columnCount = Object.keys(data[0] as object).length;

      return {
        data,
        rowCount: data.length,
        columnCount,
      };
    } catch (error: any) {
      console.error('Error parsing Excel file:', error);
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Parse CSV survey responses
   */
  async parseSurveyCsv(buffer: Buffer): Promise<{
    data: any[];
    rowCount: number;
    columnCount: number;
  }> {
    try {
      // Convert buffer to string
      const csvText = buffer.toString('utf-8');

      // Use XLSX to parse CSV (it handles CSV well)
      const workbook = XLSX.read(csvText, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const data = XLSX.utils.sheet_to_json(worksheet);

      if (!data || data.length === 0) {
        throw new Error('CSV file is empty or has no data rows');
      }

      const columnCount = Object.keys(data[0] as object).length;

      return {
        data,
        rowCount: data.length,
        columnCount,
      };
    } catch (error: any) {
      console.error('Error parsing CSV file:', error);
      throw new Error(`Failed to parse CSV file: ${error.message}`);
    }
  }

  /**
   * Parse interview transcripts (TXT files)
   */
  async parseInterviewTranscripts(buffer: Buffer): Promise<{
    transcripts: string[];
    count: number;
  }> {
    try {
      const text = buffer.toString('utf-8');

      // Try to split by common interview separators
      const separators = [
        /={3,}.*Interview\s+\d+.*={3,}/gi, // === Interview 1 ===
        /\-{3,}.*Interview\s+\d+.*\-{3,}/gi, // --- Interview 1 ---
        /Interview\s+\d+:/gi, // Interview 1:
        /##+\s*Interview\s+\d+/gi, // ## Interview 1
      ];

      let transcripts: string[] = [];

      // Try each separator
      for (const separator of separators) {
        const parts = text.split(separator);
        if (parts.length > 1) {
          // Filter out empty parts
          transcripts = parts.filter((part) => part.trim().length > 100);
          if (transcripts.length > 0) {
            break;
          }
        }
      }

      // If no separator found, treat as single interview
      if (transcripts.length === 0) {
        transcripts = [text.trim()];
      }

      return {
        transcripts,
        count: transcripts.length,
      };
    } catch (error: any) {
      console.error('Error parsing interview transcripts:', error);
      throw new Error(`Failed to parse interview transcripts: ${error.message}`);
    }
  }

  /**
   * Validate survey data structure
   */
  validateSurveyData(data: any[], questions: SurveyQuestion[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || data.length === 0) {
      errors.push('No data rows found in uploaded file');
      return { valid: false, errors, warnings };
    }

    // Check if data has reasonable column count
    const columnCount = Object.keys(data[0] as object).length;
    if (columnCount < 3) {
      warnings.push(`Only ${columnCount} columns found. Expected at least ${questions.length} columns for questions.`);
    }

    // Check for completely empty responses
    const emptyResponses = data.filter((row) => {
      const values = Object.values(row);
      return values.every((v) => !v || String(v).trim() === '');
    });

    if (emptyResponses.length > 0) {
      warnings.push(`${emptyResponses.length} empty response rows found and will be excluded from analysis`);
    }

    // Check for reasonable response count
    if (data.length < 5) {
      warnings.push(`Only ${data.length} responses. Analysis may be limited with fewer than 10 responses.`);
    }

    if (data.length > 5000) {
      warnings.push(`${data.length} responses found. Analysis may take longer for datasets over 1000 responses.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate interview data structure
   */
  validateInterviewData(transcripts: string[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!transcripts || transcripts.length === 0) {
      errors.push('No interview transcripts found');
      return { valid: false, errors, warnings };
    }

    // Check each transcript
    const shortTranscripts = transcripts.filter((t) => t.length < 500);
    if (shortTranscripts.length > 0) {
      warnings.push(`${shortTranscripts.length} transcripts are very short (< 500 characters). They may not provide enough depth for analysis.`);
    }

    // Check for reasonable transcript count
    if (transcripts.length < 3) {
      warnings.push(`Only ${transcripts.length} interviews. More interviews (5-10) typically yield better insights.`);
    }

    if (transcripts.length > 50) {
      warnings.push(`${transcripts.length} interviews found. Analysis may take longer for more than 20 interviews.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get preview of parsed data
   */
  getDataPreview(data: any[], limit: number = 5): any[] {
    return data.slice(0, limit);
  }
}

export const researchParserService = ResearchParserService.getInstance();
