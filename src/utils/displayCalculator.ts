/**
 * @file displayCalculator.ts
 * @description Calculate display sizes and border colors for two-slider preview system
 */

import React from 'react';
import { Size, BorderColor } from '../types';

/**
 * Calculate processed image size from document and processing scale
 */
export function calculateProcessedSize(
  docSize: Size,
  processingScale: number
): Size {
  const scale = processingScale / 100;
  return {
    width: Math.round(docSize.width * scale),
    height: Math.round(docSize.height * scale),
  };
}

/**
 * Calculate canvas display size from processed size and display zoom
 */
export function calculateCanvasSize(
  processedSize: Size,
  displayZoom: number
): Size {
  const zoom = displayZoom / 100;
  return {
    width: Math.round(processedSize.width * zoom),
    height: Math.round(processedSize.height * zoom),
  };
}

/**
 * Determine border color based on display zoom percentage
 */
export function getBorderColor(displayZoom: number): BorderColor {
  if (displayZoom === 100) return 'green';  // Pixel-perfect
  if (displayZoom < 100) return 'red';      // Downscaled
  return 'blue';                             // Upscaled
}

/**
 * Get border message for current display zoom
 */
export function getBorderMessage(displayZoom: number, processedSize: Size): string {
  if (displayZoom === 100) {
    return `✓ Pixel-perfect preview (${processedSize.width}×${processedSize.height})`;
  }
  
  if (displayZoom < 100) {
    return `⚠️ Downscaled to ${displayZoom}% - not showing all pixels`;
  }
  
  return `⚠️ Upscaled to ${displayZoom}% - may appear blurry`;
}

/**
 * Get CSS styles for border based on color
 */
export function getBorderStyle(borderColor: BorderColor): React.CSSProperties {
  const colorMap = {
    green: '#00ff00',
    red: '#ff0000',
    blue: '#0088ff',
  };
  
  return {
    border: `3px solid ${colorMap[borderColor]}`,
    boxShadow: `0 0 10px ${colorMap[borderColor]}`,
  };
}
