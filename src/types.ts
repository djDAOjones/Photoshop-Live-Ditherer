/**
 * @file types.ts
 * @description Core TypeScript type definitions for Dithering Studio
 */

export type AlgorithmType = 
  | 'floyd-steinberg'
  | 'atkinson'
  | 'ordered'
  | 'sierra'
  | 'stucki'
  | 'burkes';

export type BorderColor = 'green' | 'red' | 'blue';

export interface Size {
  width: number;
  height: number;
}

export interface PreviewState {
  // Document
  documentSize: Size | null;
  documentValid: boolean;
  documentError: string | null;
  
  // Processing
  processingScale: number;  // 5-50
  processedSize: Size | null;
  processedImageData: ImageData | null;
  
  // Display
  displayZoom: number;  // 50-200
  canvasSize: Size | null;
  borderColor: BorderColor;
  borderMessage: string;
  
  // Settings
  algorithm: AlgorithmType;
  levels: LevelsSettings;
  palette: string[];
  livePreview: boolean;
  
  // State
  isProcessing: boolean;
}

export interface LevelsSettings {
  blackPoint: number;   // 0-255
  midPoint: number;     // 0.1-10.0 (gamma)
  whitePoint: number;   // 0-255
}

export interface DocumentInfo {
  width: number;
  height: number;
  mode: string;
  bitsPerChannel: number;
  isValid: boolean;
  errorMessage?: string;
}

export interface ProcessingMessage {
  type: 'PROCESS';
  imageData: ImageData;
  levels: LevelsSettings;
  palette: string[];
  algorithm: AlgorithmType;
}

export interface ProcessingResult {
  type: 'RESULT';
  imageData: ImageData;
  processingTime: number;
}

export const DEFAULT_LEVELS: LevelsSettings = {
  blackPoint: 0,
  midPoint: 1.0,
  whitePoint: 255,
};

export const DEFAULT_PALETTE: string[] = ['#000000', '#FFFFFF'];

export const ALGORITHM_NAMES: Record<AlgorithmType, string> = {
  'floyd-steinberg': 'Floyd-Steinberg',
  'atkinson': 'Atkinson',
  'ordered': 'Ordered (Bayer)',
  'sierra': 'Sierra',
  'stucki': 'Stucki',
  'burkes': 'Burkes',
};
