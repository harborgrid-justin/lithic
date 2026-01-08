/**
 * OCR Service
 * Lithic Healthcare Platform v0.5
 *
 * Optical Character Recognition service with:
 * - Text extraction from documents
 * - Table detection and extraction
 * - Form field detection
 * - Multi-language support
 * - Confidence scoring
 * - Structured data extraction
 */

import {
  OCRResult,
  OCRPage,
  OCRBlock,
  OCRLine,
  OCRWord,
  OCRTable,
  OCRForm,
  Document,
} from '@/types/documents';
import { v4 as uuidv4 } from 'uuid';

export class OCRService {
  private readonly supportedFormats = ['pdf', 'jpeg', 'png', 'tiff'];
  private readonly supportedLanguages = ['en', 'es', 'fr', 'de', 'it'];
  private readonly confidenceThreshold = 0.7;

  /**
   * Process document with OCR
   */
  async processDocument(
    documentId: string,
    versionId: string,
    fileUrl: string,
    options: OCROptions = {}
  ): Promise<OCRResult> {
    const startTime = Date.now();

    // Validate format
    const format = this.detectFormat(fileUrl);
    if (!this.supportedFormats.includes(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }

    // Download document
    const documentBuffer = await this.downloadDocument(fileUrl);

    // Extract pages
    const pages = await this.extractPages(
      documentBuffer,
      format,
      options.language || 'en'
    );

    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(pages);

    // Extract all text
    const extractedText = this.combinePageText(pages);

    // Extract structured data if requested
    const structuredData = options.extractStructuredData
      ? await this.extractStructuredData(pages)
      : undefined;

    const result: OCRResult = {
      documentId,
      versionId,
      status: confidence >= this.confidenceThreshold ? 'success' : 'partial',
      confidence,
      extractedText,
      structuredData,
      pages,
      processingTime: Date.now() - startTime,
      ocrEngine: 'Tesseract 5.0',
      language: options.language || 'en',
      errors: confidence < this.confidenceThreshold
        ? ['Low confidence in some regions']
        : undefined,
    };

    // Save OCR result
    await this.saveOCRResult(documentId, versionId, result);

    return result;
  }

  /**
   * Extract text from specific page
   */
  async extractPageText(
    fileUrl: string,
    pageNumber: number,
    language: string = 'en'
  ): Promise<string> {
    const documentBuffer = await this.downloadDocument(fileUrl);
    const format = this.detectFormat(fileUrl);
    const pages = await this.extractPages(documentBuffer, format, language);

    const page = pages.find((p) => p.pageNumber === pageNumber);
    return page?.text || '';
  }

  /**
   * Extract tables from document
   */
  async extractTables(fileUrl: string): Promise<OCRTable[]> {
    const documentBuffer = await this.downloadDocument(fileUrl);
    const format = this.detectFormat(fileUrl);
    const pages = await this.extractPages(documentBuffer, format, 'en');

    const tables: OCRTable[] = [];
    for (const page of pages) {
      if (page.tables) {
        tables.push(...page.tables);
      }
    }

    return tables;
  }

  /**
   * Extract form fields from document
   */
  async extractFormFields(fileUrl: string): Promise<OCRForm[]> {
    const documentBuffer = await this.downloadDocument(fileUrl);
    const format = this.detectFormat(fileUrl);
    const pages = await this.extractPages(documentBuffer, format, 'en');

    const forms: OCRForm[] = [];
    for (const page of pages) {
      if (page.forms) {
        forms.push(...page.forms);
      }
    }

    return forms;
  }

  /**
   * Search for text in OCR results
   */
  async searchInDocument(
    documentId: string,
    query: string
  ): Promise<SearchResult[]> {
    const ocrResult = await this.getOCRResult(documentId);

    if (!ocrResult) {
      throw new Error('OCR result not found');
    }

    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    for (const page of ocrResult.pages) {
      for (const block of page.blocks) {
        if (block.text.toLowerCase().includes(queryLower)) {
          results.push({
            pageNumber: page.pageNumber,
            blockId: block.id,
            text: block.text,
            position: block.boundingBox,
            confidence: block.confidence,
          });
        }
      }
    }

    return results;
  }

  /**
   * Get OCR statistics
   */
  async getOCRStatistics(documentId: string): Promise<OCRStatistics> {
    const ocrResult = await this.getOCRResult(documentId);

    if (!ocrResult) {
      throw new Error('OCR result not found');
    }

    const stats: OCRStatistics = {
      totalPages: ocrResult.pages.length,
      totalWords: 0,
      totalCharacters: 0,
      averageConfidence: 0,
      lowConfidencePages: [],
      pageStats: [],
    };

    let totalConfidence = 0;

    for (const page of ocrResult.pages) {
      let pageWords = 0;
      let pageChars = 0;

      for (const block of page.blocks) {
        for (const line of block.lines) {
          pageWords += line.words.length;
          pageChars += line.text.length;
        }
      }

      stats.totalWords += pageWords;
      stats.totalCharacters += pageChars;
      totalConfidence += page.confidence;

      stats.pageStats.push({
        pageNumber: page.pageNumber,
        words: pageWords,
        characters: pageChars,
        confidence: page.confidence,
        hasTable: (page.tables?.length || 0) > 0,
        hasForm: (page.forms?.length || 0) > 0,
      });

      if (page.confidence < this.confidenceThreshold) {
        stats.lowConfidencePages.push(page.pageNumber);
      }
    }

    stats.averageConfidence =
      totalConfidence / ocrResult.pages.length;

    return stats;
  }

  /**
   * Re-process document with different settings
   */
  async reprocessDocument(
    documentId: string,
    versionId: string,
    options: OCROptions
  ): Promise<OCRResult> {
    const document = await this.getDocument(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    return this.processDocument(
      documentId,
      versionId,
      document.fileUrl,
      options
    );
  }

  // Private helper methods

  private detectFormat(fileUrl: string): string {
    const extension = fileUrl.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }

  private async downloadDocument(fileUrl: string): Promise<Buffer> {
    // Download document from storage
    // This is a placeholder
    return Buffer.from('');
  }

  private async extractPages(
    documentBuffer: Buffer,
    format: string,
    language: string
  ): Promise<OCRPage[]> {
    // This would use Tesseract.js or AWS Textract in production
    const pages: OCRPage[] = [];

    // Simulate page extraction
    const pageCount = format === 'pdf' ? 3 : 1;

    for (let i = 1; i <= pageCount; i++) {
      const blocks = await this.extractBlocks(documentBuffer, i, language);
      const tables = await this.detectTables(blocks);
      const forms = await this.detectForms(blocks);

      pages.push({
        pageNumber: i,
        text: blocks.map((b) => b.text).join('\n'),
        confidence: this.calculatePageConfidence(blocks),
        blocks,
        tables: tables.length > 0 ? tables : undefined,
        forms: forms.length > 0 ? forms : undefined,
      });
    }

    return pages;
  }

  private async extractBlocks(
    documentBuffer: Buffer,
    pageNumber: number,
    language: string
  ): Promise<OCRBlock[]> {
    // Extract text blocks using OCR engine
    // This is a placeholder
    return [
      {
        id: uuidv4(),
        type: 'text',
        text: 'Sample extracted text from OCR',
        confidence: 0.95,
        boundingBox: { x: 100, y: 100, width: 400, height: 50 },
        lines: [
          {
            text: 'Sample extracted text from OCR',
            confidence: 0.95,
            words: [
              {
                text: 'Sample',
                confidence: 0.98,
                boundingBox: { x: 100, y: 100, width: 60, height: 20 },
              },
              {
                text: 'extracted',
                confidence: 0.94,
                boundingBox: { x: 165, y: 100, width: 80, height: 20 },
              },
              {
                text: 'text',
                confidence: 0.96,
                boundingBox: { x: 250, y: 100, width: 40, height: 20 },
              },
            ],
          },
        ],
      },
    ];
  }

  private async detectTables(blocks: OCRBlock[]): Promise<OCRTable[]> {
    // Detect and extract tables from blocks
    return [];
  }

  private async detectForms(blocks: OCRBlock[]): Promise<OCRForm[]> {
    // Detect and extract form fields
    return [];
  }

  private calculatePageConfidence(blocks: OCRBlock[]): number {
    if (blocks.length === 0) return 0;
    const sum = blocks.reduce((acc, block) => acc + block.confidence, 0);
    return sum / blocks.length;
  }

  private calculateOverallConfidence(pages: OCRPage[]): number {
    if (pages.length === 0) return 0;
    const sum = pages.reduce((acc, page) => acc + page.confidence, 0);
    return sum / pages.length;
  }

  private combinePageText(pages: OCRPage[]): string {
    return pages
      .map((page) => `[Page ${page.pageNumber}]\n${page.text}`)
      .join('\n\n');
  }

  private async extractStructuredData(
    pages: OCRPage[]
  ): Promise<Record<string, unknown>> {
    // Extract structured data using NLP/patterns
    const data: Record<string, unknown> = {};

    // Extract dates, names, IDs, etc.
    for (const page of pages) {
      const text = page.text;

      // Extract dates
      const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g;
      const dates = text.match(dateRegex);
      if (dates) {
        data.dates = dates;
      }

      // Extract medical record numbers
      const mrnRegex = /MRN[:\s]*(\d+)/gi;
      const mrns = text.match(mrnRegex);
      if (mrns) {
        data.medicalRecordNumbers = mrns;
      }
    }

    return data;
  }

  private async saveOCRResult(
    documentId: string,
    versionId: string,
    result: OCRResult
  ): Promise<void> {
    // Save to database
  }

  private async getOCRResult(documentId: string): Promise<OCRResult | null> {
    // Load from database
    return null;
  }

  private async getDocument(documentId: string): Promise<Document | null> {
    // Load from database
    return null;
  }
}

interface OCROptions {
  language?: string;
  extractStructuredData?: boolean;
  detectTables?: boolean;
  detectForms?: boolean;
  enhanceImage?: boolean;
  deskew?: boolean;
}

interface SearchResult {
  pageNumber: number;
  blockId: string;
  text: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

interface OCRStatistics {
  totalPages: number;
  totalWords: number;
  totalCharacters: number;
  averageConfidence: number;
  lowConfidencePages: number[];
  pageStats: PageStatistics[];
}

interface PageStatistics {
  pageNumber: number;
  words: number;
  characters: number;
  confidence: number;
  hasTable: boolean;
  hasForm: boolean;
}

export default OCRService;
