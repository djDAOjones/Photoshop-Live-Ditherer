// Web Worker for offloading dithering computation
import { floydSteinberg } from '../dithering/algorithms/floydSteinberg';

interface WorkerMessage {
  type: 'DITHER';
  imageData: ImageData;
  algorithm: string;
  palette: string[];
}

interface WorkerResponse {
  type: 'DITHER_COMPLETE' | 'ERROR';
  imageData?: ImageData;
  error?: string;
  timing?: number;
}

// Worker message handler
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, imageData, algorithm, palette } = e.data;
  
  if (type === 'DITHER') {
    try {
      const t0 = performance.now();
      
      let result: ImageData;
      
      switch (algorithm) {
        case 'floyd-steinberg':
          result = floydSteinberg(imageData, palette);
          break;
        default:
          throw new Error(`Unknown algorithm: ${algorithm}`);
      }
      
      const t1 = performance.now();
      
      const response: WorkerResponse = {
        type: 'DITHER_COMPLETE',
        imageData: result,
        timing: Math.round(t1 - t0)
      };
      
      // @ts-ignore - Worker postMessage
      self.postMessage(response);
    } catch (error) {
      const response: WorkerResponse = {
        type: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      // @ts-ignore - Worker postMessage
      self.postMessage(response);
    }
  }
};

export {};
