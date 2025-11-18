/**
 * @file floydSteinberg.ts
 * @description Floyd-Steinberg error diffusion dithering algorithm
 */

import { createImageData } from '../../utils/imageDataHelper';

/**
 * Find closest color in palette
 */
function findClosestColor(r: number, g: number, b: number, palette: string[]): [number, number, number] {
  let minDistance = Infinity;
  let closest: [number, number, number] = [0, 0, 0];
  
  for (const color of palette) {
    const pr = parseInt(color.slice(1, 3), 16);
    const pg = parseInt(color.slice(3, 5), 16);
    const pb = parseInt(color.slice(5, 7), 16);
    
    const distance = Math.sqrt(
      Math.pow(r - pr, 2) +
      Math.pow(g - pg, 2) +
      Math.pow(b - pb, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closest = [pr, pg, pb];
    }
  }
  
  return closest;
}

/**
 * Apply Floyd-Steinberg dithering
 * Error diffusion matrix:
 *         X   7/16
 *   3/16 5/16 1/16
 */
export function floydSteinberg(imageData: ImageData, palette: string[]): ImageData {
  const { width, height, data } = imageData;
  
  // Create output ImageData using helper (UXP compatible)
  const output = createImageData(width, height);
  const outputData = output.data;
  
  // Copy input to output
  for (let i = 0; i < data.length; i++) {
    outputData[i] = data[i];
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      const oldR = outputData[idx];
      const oldG = outputData[idx + 1];
      const oldB = outputData[idx + 2];
      
      // Find closest palette color
      const [newR, newG, newB] = findClosestColor(oldR, oldG, oldB, palette);
      
      // Set new color
      outputData[idx] = newR;
      outputData[idx + 1] = newG;
      outputData[idx + 2] = newB;
      
      // Calculate error
      const errR = oldR - newR;
      const errG = oldG - newG;
      const errB = oldB - newB;
      
      // Distribute error to neighboring pixels
      // Right pixel (x+1, y)
      if (x + 1 < width) {
        const rightIdx = (y * width + (x + 1)) * 4;
        outputData[rightIdx] = Math.max(0, Math.min(255, outputData[rightIdx] + errR * 7 / 16));
        outputData[rightIdx + 1] = Math.max(0, Math.min(255, outputData[rightIdx + 1] + errG * 7 / 16));
        outputData[rightIdx + 2] = Math.max(0, Math.min(255, outputData[rightIdx + 2] + errB * 7 / 16));
      }
      
      // Bottom-left pixel (x-1, y+1)
      if (x > 0 && y + 1 < height) {
        const blIdx = ((y + 1) * width + (x - 1)) * 4;
        outputData[blIdx] = Math.max(0, Math.min(255, outputData[blIdx] + errR * 3 / 16));
        outputData[blIdx + 1] = Math.max(0, Math.min(255, outputData[blIdx + 1] + errG * 3 / 16));
        outputData[blIdx + 2] = Math.max(0, Math.min(255, outputData[blIdx + 2] + errB * 3 / 16));
      }
      
      // Bottom pixel (x, y+1)
      if (y + 1 < height) {
        const bottomIdx = ((y + 1) * width + x) * 4;
        outputData[bottomIdx] = Math.max(0, Math.min(255, outputData[bottomIdx] + errR * 5 / 16));
        outputData[bottomIdx + 1] = Math.max(0, Math.min(255, outputData[bottomIdx + 1] + errG * 5 / 16));
        outputData[bottomIdx + 2] = Math.max(0, Math.min(255, outputData[bottomIdx + 2] + errB * 5 / 16));
      }
      
      // Bottom-right pixel (x+1, y+1)
      if (x + 1 < width && y + 1 < height) {
        const brIdx = ((y + 1) * width + (x + 1)) * 4;
        outputData[brIdx] = Math.max(0, Math.min(255, outputData[brIdx] + errR * 1 / 16));
        outputData[brIdx + 1] = Math.max(0, Math.min(255, outputData[brIdx + 1] + errG * 1 / 16));
        outputData[brIdx + 2] = Math.max(0, Math.min(255, outputData[brIdx + 2] + errB * 1 / 16));
      }
    }
  }
  
  return output;
}
