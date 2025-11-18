/**
 * @file levels.ts
 * @description Levels adjustment implementation for image preprocessing
 */

import { LevelsSettings } from '../types';

/**
 * Apply Levels adjustment to a single pixel value
 */
export function applyLevels(
  value: number,
  blackPoint: number,
  midPoint: number,
  whitePoint: number
): number {
  // Clip to input range
  if (value <= blackPoint) return 0;
  if (value >= whitePoint) return 255;
  
  // Normalize to 0-1 range
  const normalized = (value - blackPoint) / (whitePoint - blackPoint);
  
  // Apply gamma (mid-point adjustment)
  const gamma = midPoint;
  const adjusted = Math.pow(normalized, 1 / gamma);
  
  // Return to 0-255 range
  return Math.round(adjusted * 255);
}

/**
 * Apply Levels to entire ImageData
 */
export function applyLevelsToImageData(
  imageData: ImageData,
  levels: LevelsSettings
): ImageData {
  const data = imageData.data;
  const { blackPoint, midPoint, whitePoint } = levels;
  
  // Process each pixel (skip alpha channel)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = applyLevels(data[i], blackPoint, midPoint, whitePoint);     // R
    data[i + 1] = applyLevels(data[i + 1], blackPoint, midPoint, whitePoint); // G
    data[i + 2] = applyLevels(data[i + 2], blackPoint, midPoint, whitePoint); // B
    // Alpha (data[i + 3]) unchanged
  }
  
  return imageData;
}
