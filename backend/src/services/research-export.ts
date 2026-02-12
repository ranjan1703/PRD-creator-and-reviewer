import * as XLSX from 'xlsx';
import { documentExportService } from './documentExport';
import type { SurveyQuestion, InterviewGuide } from '../../../shared/types/research';

/**
 * Research Export Service - Generate Excel templates and export reports
 * Handles Excel template generation and report exports to PDF/DOCX/Markdown
 */
export class ResearchExportService {
  private static instance: ResearchExportService;

  private constructor() {
    console.log('📊 Research Export Service initialized');
  }

  static getInstance(): ResearchExportService {
    if (!ResearchExportService.instance) {
      ResearchExportService.instance = new ResearchExportService();
    }
    return ResearchExportService.instance;
  }

  /**
   * Generate Excel template for survey data collection
   */
  async generateSurveyExcel(questions: SurveyQuestion[], sessionId: string): Promise<Buffer> {
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Create headers for the survey sheet
      const headers: string[] = [
        'Respondent ID',
        'Timestamp',
        ...questions.map((q, i) => `Q${i + 1}: ${q.text.substring(0, 50)}${q.text.length > 50 ? '...' : ''}`),
      ];

      // Create worksheet data
      const worksheetData: any[][] = [headers];

      // Add a sample row to show format
      const sampleRow = [
        'SAMPLE-001',
        new Date().toISOString(),
        ...questions.map((q) => {
          if (q.type === 'mcq' && q.options) {
            return q.options[0];
          } else if (q.type === 'likert') {
            return '3';
          } else if (q.type === 'open-ended') {
            return 'Your response here...';
          } else {
            return 'Yes';
          }
        }),
      ];
      worksheetData.push(sampleRow);

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Respondent ID
        { wch: 20 }, // Timestamp
        ...questions.map(() => ({ wch: 30 })), // Questions
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Survey Responses');

      // Create a second sheet with question details
      const questionDetails: any[][] = [
        ['Question ID', 'Question Text', 'Type', 'Options', 'Objective'],
        ...questions.map((q) => [
          q.id,
          q.text,
          q.type,
          q.options ? q.options.join('; ') : 'N/A',
          q.objective,
        ]),
      ];

      const detailsWorksheet = XLSX.utils.aoa_to_sheet(questionDetails);
      detailsWorksheet['!cols'] = [
        { wch: 12 },
        { wch: 50 },
        { wch: 15 },
        { wch: 40 },
        { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(workbook, detailsWorksheet, 'Question Details');

      // Write to buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return buffer;
    } catch (error: any) {
      console.error('Error generating survey Excel:', error);
      throw new Error(`Failed to generate survey Excel: ${error.message}`);
    }
  }

  /**
   * Generate Excel template for interview data collection
   */
  async generateInterviewExcel(guide: InterviewGuide, sessionId: string): Promise<Buffer> {
    try {
      const workbook = XLSX.utils.book_new();

      // Interview Guide Sheet
      const guideData: any[][] = [
        ['Interview Discussion Guide'],
        [''],
        ['Opening Script:'],
        [guide.openingScript],
        [''],
        ['Questions:'],
        ['#', 'Question', 'Probing Follow-ups'],
        ...guide.questions.map((q, i) => [
          i + 1,
          q.question,
          q.probes.join(' | '),
        ]),
        [''],
        ['Observation Checklist:'],
        ...guide.observationChecklist.map((item) => ['', item]),
        [''],
        ['Bias Avoidance Tips:'],
        ...guide.biasAvoidanceTips.map((tip) => ['', tip]),
      ];

      const guideWorksheet = XLSX.utils.aoa_to_sheet(guideData);
      guideWorksheet['!cols'] = [{ wch: 5 }, { wch: 60 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(workbook, guideWorksheet, 'Interview Guide');

      // Transcript Template Sheet
      const transcriptData: any[][] = [
        ['Interview Transcripts'],
        [''],
        ['Instructions:', 'Paste each interview transcript below, separated by "=== Interview N ===" headers'],
        [''],
        ['=== Interview 1 ==='],
        ['Interviewer: [Opening script]'],
        ['Respondent: [Response]'],
        ['Interviewer: [Question]'],
        ['Respondent: [Response]'],
        ['...'],
        [''],
        ['=== Interview 2 ==='],
        ['...'],
      ];

      const transcriptWorksheet = XLSX.utils.aoa_to_sheet(transcriptData);
      transcriptWorksheet['!cols'] = [{ wch: 15 }, { wch: 100 }];
      XLSX.utils.book_append_sheet(workbook, transcriptWorksheet, 'Transcripts Template');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return buffer;
    } catch (error: any) {
      console.error('Error generating interview Excel:', error);
      throw new Error(`Failed to generate interview Excel: ${error.message}`);
    }
  }

  /**
   * Export research report to PDF
   */
  async exportReportToPDF(markdown: string, metadata: {
    sessionId: string;
    title: string;
  }): Promise<Buffer> {
    try {
      return await documentExportService.exportToPDF(markdown, {
        title: metadata.title,
        author: 'Product Research Team',
      });
    } catch (error: any) {
      console.error('Error exporting report to PDF:', error);
      throw new Error(`Failed to export report to PDF: ${error.message}`);
    }
  }

  /**
   * Export research report to DOCX
   */
  async exportReportToDOCX(markdown: string, metadata: {
    sessionId: string;
    title: string;
  }): Promise<Buffer> {
    try {
      return await documentExportService.exportToDOCX(markdown, {
        title: metadata.title,
        author: 'Product Research Team',
      });
    } catch (error: any) {
      console.error('Error exporting report to DOCX:', error);
      throw new Error(`Failed to export report to DOCX: ${error.message}`);
    }
  }

  /**
   * Export research report to Markdown (with frontmatter)
   */
  exportReportToMarkdown(markdown: string, metadata: {
    sessionId: string;
    title: string;
    researchType: string;
    conductedDate: string;
    respondentCount: number;
  }): string {
    const frontmatter = `---
title: ${metadata.title}
type: Research Report
research_type: ${metadata.researchType}
session_id: ${metadata.sessionId}
conducted_date: ${metadata.conductedDate}
respondent_count: ${metadata.respondentCount}
generated_date: ${new Date().toISOString()}
---

`;

    return frontmatter + markdown;
  }
}

export const researchExportService = ResearchExportService.getInstance();
