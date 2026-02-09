import { marked } from 'marked';
import puppeteer from 'puppeteer';
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Packer,
} from 'docx';

export interface ExportOptions {
  title?: string;
  author?: string;
}

export class DocumentExportService {
  /**
   * Export markdown to PDF
   */
  async exportToPDF(markdown: string, options: ExportOptions = {}): Promise<Buffer> {
    const html = this.markdownToHTML(markdown, options.title);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        printBackground: true,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Export markdown to DOCX
   */
  async exportToDOCX(markdown: string, options: ExportOptions = {}): Promise<Buffer> {
    const sections = this.parseMarkdown(markdown);
    const docElements: any[] = [];

    for (const section of sections) {
      switch (section.type) {
        case 'heading':
          docElements.push(
            new Paragraph({
              text: section.text,
              heading: this.getHeadingLevel(section.level),
              spacing: { before: 240, after: 120 },
            })
          );
          break;

        case 'paragraph':
          if (section.text.trim()) {
            docElements.push(
              new Paragraph({
                children: this.parseInlineFormatting(section.text),
                spacing: { after: 120 },
              })
            );
          }
          break;

        case 'list':
          section.items.forEach((item: string) => {
            docElements.push(
              new Paragraph({
                children: this.parseInlineFormatting(item),
                bullet: { level: 0 },
                spacing: { after: 60 },
              })
            );
          });
          break;

        case 'table':
          const table = this.createTable(section.headers, section.rows);
          docElements.push(table);
          docElements.push(new Paragraph({ text: '', spacing: { after: 120 } }));
          break;

        case 'code':
          docElements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: section.text,
                  font: 'Courier New',
                  size: 20,
                }),
              ],
              spacing: { after: 120 },
              shading: { fill: 'F5F5F5' },
            })
          );
          break;
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docElements,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Convert markdown to HTML with styling
   */
  private markdownToHTML(markdown: string, title?: string): string {
    const htmlContent = marked(markdown);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${title ? `<title>${title}</title>` : ''}
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    h1 {
      font-size: 32px;
      font-weight: 700;
      margin-top: 24px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
      color: #111827;
    }

    h2 {
      font-size: 24px;
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 12px;
      color: #1f2937;
    }

    h3 {
      font-size: 20px;
      font-weight: 600;
      margin-top: 20px;
      margin-bottom: 10px;
      color: #374151;
    }

    h4 {
      font-size: 18px;
      font-weight: 600;
      margin-top: 16px;
      margin-bottom: 8px;
      color: #4b5563;
    }

    p {
      margin-top: 0;
      margin-bottom: 12px;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 12px;
      padding-left: 24px;
    }

    li {
      margin-bottom: 6px;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
      font-size: 14px;
    }

    th {
      background-color: #f3f4f6;
      font-weight: 600;
      text-align: left;
      padding: 12px;
      border: 1px solid #d1d5db;
    }

    td {
      padding: 10px 12px;
      border: 1px solid #d1d5db;
    }

    tr:nth-child(even) {
      background-color: #f9fafb;
    }

    code {
      background-color: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      color: #dc2626;
    }

    pre {
      background-color: #f3f4f6;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 16px 0;
    }

    pre code {
      background-color: transparent;
      padding: 0;
      color: #1f2937;
    }

    blockquote {
      border-left: 4px solid #e5e7eb;
      padding-left: 16px;
      margin: 16px 0;
      color: #6b7280;
      font-style: italic;
    }

    strong {
      font-weight: 600;
      color: #111827;
    }

    em {
      font-style: italic;
    }

    a {
      color: #2563eb;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 24px 0;
    }

    @media print {
      body {
        max-width: none;
      }
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
    `;
  }

  /**
   * Parse markdown into structured sections
   */
  private parseMarkdown(markdown: string): any[] {
    const lines = markdown.split('\n');
    const sections: any[] = [];
    let currentSection: any = null;
    let inCodeBlock = false;
    let codeContent = '';
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          sections.push({ type: 'code', text: codeContent.trim() });
          codeContent = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        continue;
      }

      // Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        if (inTable) {
          sections.push({ type: 'table', headers: tableHeaders, rows: tableRows });
          inTable = false;
          tableHeaders = [];
          tableRows = [];
        }
        sections.push({
          type: 'heading',
          level: headingMatch[1].length,
          text: headingMatch[2].trim(),
        });
        continue;
      }

      // Tables
      if (line.includes('|')) {
        const cells = line
          .split('|')
          .map(c => c.trim())
          .filter(c => c.length > 0);

        if (cells.length > 0) {
          if (!inTable) {
            inTable = true;
            tableHeaders = cells;
          } else if (line.includes('---')) {
            // Skip separator row
            continue;
          } else {
            tableRows.push(cells);
          }
        }
        continue;
      } else if (inTable) {
        sections.push({ type: 'table', headers: tableHeaders, rows: tableRows });
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }

      // Lists
      const listMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
      if (listMatch) {
        if (currentSection?.type !== 'list') {
          currentSection = { type: 'list', items: [] };
          sections.push(currentSection);
        }
        currentSection.items.push(listMatch[1].trim());
        continue;
      } else if (currentSection?.type === 'list') {
        currentSection = null;
      }

      // Paragraphs
      if (line.trim()) {
        sections.push({ type: 'paragraph', text: line });
      }
    }

    // Flush remaining table if any
    if (inTable) {
      sections.push({ type: 'table', headers: tableHeaders, rows: tableRows });
    }

    return sections;
  }

  /**
   * Parse inline formatting (bold, italic, code)
   */
  private parseInlineFormatting(text: string): TextRun[] {
    const runs: TextRun[] = [];

    // Remove markdown syntax for DOCX
    let cleanText = text
      .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
      .replace(/\*(.+?)\*/g, '$1')     // Italic
      .replace(/`(.+?)`/g, '$1');      // Code

    // For simplicity, just return as plain text
    // In a more advanced implementation, you could parse and apply formatting
    runs.push(new TextRun({ text: cleanText }));

    return runs;
  }

  /**
   * Create a table for DOCX
   */
  private createTable(headers: string[], rows: string[][]): Table {
    const tableRows: TableRow[] = [];

    // Header row
    tableRows.push(
      new TableRow({
        children: headers.map(
          header =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: header, bold: true })],
                }),
              ],
              shading: { fill: 'F3F4F6' },
            })
        ),
      })
    );

    // Data rows
    rows.forEach(row => {
      tableRows.push(
        new TableRow({
          children: row.map(
            cell =>
              new TableCell({
                children: [new Paragraph({ text: cell })],
              })
          ),
        })
      );
    });

    return new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
  }

  /**
   * Get DOCX heading level
   */
  private getHeadingLevel(level: number): typeof HeadingLevel[keyof typeof HeadingLevel] {
    const levels: Record<number, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3,
      4: HeadingLevel.HEADING_4,
      5: HeadingLevel.HEADING_5,
      6: HeadingLevel.HEADING_6,
    };
    return levels[level] || HeadingLevel.HEADING_1;
  }
}

export const documentExportService = new DocumentExportService();
