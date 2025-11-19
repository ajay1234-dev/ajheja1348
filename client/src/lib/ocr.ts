import { createWorker, Word } from 'tesseract.js';
import type { Worker as TesseractWorker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

let worker: TesseractWorker | null = null;

// Initialize Tesseract worker
export const initializeOCR = async (): Promise<TesseractWorker> => {
  if (worker) return worker;

  worker = await createWorker('eng');
  
  // Configure for medical documents
  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:/%-() ',
    preserve_interword_spaces: '1',
  });

  return worker;
};

// Extract text from image file
export const extractTextFromImage = async (file: File): Promise<OCRResult> => {
  try {
    const ocrWorker = await initializeOCR();
    
    const result = await ocrWorker.recognize(file);
    
    // Tesseract.js types might not match actual runtime data structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const words = (result.data as any).words || [];
    
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: words.map((word: Word) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox
      }))
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`OCR processing failed: ${errorMessage}`);
  }
};

// Extract text from PDF using canvas
export const extractTextFromPDF = async (): Promise<string> => {
  try {
    // For client-side PDF processing, we would need pdf.js
    // This is a simplified implementation that assumes server-side processing
    console.warn('PDF processing should be handled server-side for better performance');
    
    // Convert first page to image and process with OCR
    return await convertPDFToImageAndOCR();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`PDF text extraction failed: ${errorMessage}`);
  }
};

// Helper function to convert PDF to image for OCR
const convertPDFToImageAndOCR = async (): Promise<string> => {
  // This would require pdf.js integration
  // For now, we'll throw an error suggesting server-side processing
  throw new Error('PDF processing requires server-side handling');
};

// Detect document type based on extracted text
export const detectDocumentType = (text: string): 'blood_test' | 'prescription' | 'x-ray' | 'general' => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('prescription') || lowerText.includes('medication') || lowerText.includes('dosage')) {
    return 'prescription';
  }
  
  if (lowerText.includes('blood') || lowerText.includes('glucose') || lowerText.includes('cholesterol') || 
      lowerText.includes('hemoglobin') || lowerText.includes('platelet')) {
    return 'blood_test';
  }
  
  if (lowerText.includes('x-ray') || lowerText.includes('radiograph') || 
      lowerText.includes('imaging')) {
    return 'x-ray';
  }
  
  return 'general';
};

// Clean up worker when done
export const terminateOCR = async (): Promise<void> => {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
};

// Progress callback type for OCR processing
export type OCRProgressCallback = (progress: number) => void;

// Process multiple files with progress tracking
export const processMultipleFiles = async (
  files: File[], 
  onProgress?: OCRProgressCallback
): Promise<OCRResult[]> => {
  const results: OCRResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Check file type
    if (file.type === 'application/pdf') {
      console.warn(`Skipping PDF file ${file.name}. Client-side PDF processing is not fully supported.`);
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100);
      }
      continue; // Skip to the next file
    }

    // Only process image files
    if (!file.type.startsWith('image/')) {
      console.warn(`Skipping unsupported file type ${file.type} for file ${file.name}. Only images are supported for client-side OCR.`);
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100);
      }
      continue; // Skip to the next file
    }
    
    try {
      const result = await extractTextFromImage(file);
      results.push(result);
      
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100);
      }
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error);
      // Continue with other files
    }
  }
  
  return results;
};