/**
 * @file App.tsx
 * @description Main application component for Dithering Studio
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  PreviewState, 
  DEFAULT_LEVELS, 
  DEFAULT_PALETTE, 
  AlgorithmType,
  ALGORITHM_NAMES 
} from './types';
import { applyLevelsToImageData } from './utils/levels';
import { floydSteinberg } from './dithering/algorithms/floydSteinberg';
import { getCompositeImageData } from './core/documentValidator';
import { 
  getBorderMessage,
  getBorderStyle 
} from './utils/displayCalculator';

const App: React.FC = () => {
  // State
  const [previewState, setPreviewState] = useState<Partial<PreviewState>>({
    processingScale: 10,
    displayZoom: 100,
    algorithm: 'floyd-steinberg',
    levels: DEFAULT_LEVELS,
    palette: DEFAULT_PALETTE,
    livePreview: true,
    isProcessing: false,
  });
  
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cachedRawImageRef = useRef<ImageData | null>(null);
  
  // Handle processing scale change
  const handleProcessingScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setPreviewState(prev => ({ ...prev, processingScale: value }));
  };
  
  // Handle display zoom change
  const handleDisplayZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewState(prev => ({ ...prev, displayZoom: parseInt(e.target.value) }));
    // Canvas will re-render automatically via useEffect
  };
  
  // Handle algorithm change
  const handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPreviewState(prev => ({ ...prev, algorithm: e.target.value as AlgorithmType }));
  };
  
  // Handle levels changes
  const handleLevelsChange = (type: 'blackPoint' | 'midPoint' | 'whitePoint', value: number) => {
    setPreviewState(prev => ({
      ...prev,
      levels: { ...prev.levels!, [type]: value }
    }));
  };
  
  // Process image from active Photoshop document
  const processImage = async (useCache: boolean = false) => {
    console.log('===========================');
    console.log('🔥 NEW CODE VERSION LOADED 🔥');
    console.log('Build timestamp:', new Date().toISOString());
    console.log('===========================');
    console.log('Process button clicked - starting image processing...');
    setPreviewState(prev => ({ ...prev, isProcessing: true }));
    setError(null);
    
    try {
      const t0 = performance.now();
      
      // Get raw image data (from Photoshop or cache)
      let rawImageData: ImageData;
      
      if (useCache && cachedRawImageRef.current) {
        console.log('⏱️ Using cached image data...');
        rawImageData = cachedRawImageRef.current;
      } else {
        console.log(`⏱️ Getting composite image data at ${previewState.processingScale}% scale...`);
        const t1 = performance.now();
        rawImageData = await getCompositeImageData(previewState.processingScale!);
        const t2 = performance.now();
        console.log(`✅ Photoshop API took ${Math.round(t2 - t1)}ms - Got ${rawImageData.width}x${rawImageData.height}`);
        // Cache for future live adjustments
        cachedRawImageRef.current = rawImageData;
      }
      
      // Apply levels adjustment
      const t3 = performance.now();
      const leveled = applyLevelsToImageData(rawImageData, previewState.levels!);
      const t4 = performance.now();
      console.log(`✅ Levels adjustment took ${Math.round(t4 - t3)}ms`);
      
      // Apply dithering (synchronous - UXP doesn't support Web Workers)
      const t5 = performance.now();
      const dithered = floydSteinberg(leveled, previewState.palette!);
      const t6 = performance.now();
      console.log(`✅ Floyd-Steinberg dithering took ${Math.round(t6 - t5)}ms`);
      
      const tTotal = performance.now();
      console.log(`🏁 TOTAL TIME: ${Math.round(tTotal - t0)}ms`);
      console.log(`👍 Cached mode: ${useCache ? 'YES (fast!)' : 'NO (full Photoshop read)'}`);
      
      // Update state
      setPreviewState(prev => ({
        ...prev,
        processedImageData: dithered,
        processedSize: { width: dithered.width, height: dithered.height },
        isProcessing: false,
      }));
      console.log('Preview state updated successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      const errorStack = err instanceof Error ? err.stack : '';
      console.error('Processing failed:', err);
      console.error('Error stack:', errorStack);
      
      // Don't show scary error for "No active document" - just log it
      if (errorMessage.includes('No active document')) {
        console.log('ℹ️ No document open - please open a document to process');
        setError(null); // Clear error
      } else if (errorMessage.includes('Worker is not defined')) {
        setError('UXP does not support Web Workers. Using synchronous processing.');
      } else {
        setError(`${errorMessage}\n\nStack: ${errorStack}`);
      }
      setPreviewState(prev => ({ ...prev, isProcessing: false }));
    }
  };
  
  // Don't auto-process on mount - wait for user to click Process button
  // useEffect(() => {
  //   processImage();
  // }, []);
  
  // Re-process when settings change (if live preview is on)
  useEffect(() => {
    if (previewState.livePreview && cachedRawImageRef.current) {
      // Use cache for live adjustments (levels, palette) - fast!
      const timeout = setTimeout(() => processImage(true), 300);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [previewState.algorithm, previewState.levels, previewState.palette]);
  
  // Re-read from Photoshop when scale changes
  useEffect(() => {
    if (previewState.livePreview && cachedRawImageRef.current) {
      // Scale changed - need to re-read from Photoshop
      const timeout = setTimeout(() => {
        cachedRawImageRef.current = null; // Clear cache
        processImage(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [previewState.processingScale]);
  
  // Render canvas when processed image or zoom changes
  useEffect(() => {
    if (previewState.processedImageData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const { processedImageData, displayZoom } = previewState;
      const zoom = (displayZoom || 100) / 100;
      const pixelSize = Math.max(1, Math.round(zoom));
      
      const displayWidth = processedImageData.width * pixelSize;
      const displayHeight = processedImageData.height * pixelSize;
      
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      // Render pixels directly (UXP doesn't support putImageData)
      const data = processedImageData.data;
      for (let y = 0; y < processedImageData.height; y++) {
        for (let x = 0; x < processedImageData.width; x++) {
          const i = (y * processedImageData.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }
  }, [previewState.processedImageData, previewState.displayZoom]);
  
  // Calculate border message
  const borderMessage = previewState.processedSize 
    ? getBorderMessage(previewState.displayZoom || 100, previewState.processedSize)
    : '';
  
  const borderStyle = getBorderStyle(previewState.borderColor || 'green');
  
  return (
    <div className="app">
      <div style={{background: 'orange', color: 'white', padding: '20px', fontWeight: 'bold', fontSize: '24px'}}>
        ⚡ V9034 - OPTIMIZED SYNC ⚡
      </div>
      {error && <div className="error-message">{error}</div>}
      
      {/* Preview Canvas */}
      <div className="preview-container" style={borderStyle}>
        <canvas ref={canvasRef} className="preview-canvas" />
        {previewState.processedSize && (
          <div className="preview-info">
            {borderMessage}
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="controls">
        {/* Processing Scale Slider */}
        <div className="control-group">
          <label className="control-label">Processing Scale: {previewState.processingScale}%</label>
          <div className="slider-container">
            <input
              type="range"
              className="slider"
              min="5"
              max="50"
              value={previewState.processingScale}
              onChange={handleProcessingScaleChange}
            />
            <input
              type="number"
              className="slider-text-input"
              min="5"
              max="50"
              value={previewState.processingScale}
              onChange={(e) => setPreviewState(prev => ({ ...prev, processingScale: Math.max(5, Math.min(50, parseInt(e.target.value) || 5)) }))}
              style={{width: '50px', marginLeft: '10px'}}
            />
          </div>
        </div>
        
        {/* Display Zoom Slider */}
        <div className="control-group">
          <label className="control-label">Display Zoom: {previewState.displayZoom}%</label>
          <div className="slider-container">
            <input
              type="range"
              className="slider"
              min="50"
              max="200"
              value={previewState.displayZoom}
              onChange={handleDisplayZoomChange}
            />
            <input
              type="number"
              className="slider-text-input"
              min="50"
              max="200"
              value={previewState.displayZoom}
              onChange={(e) => setPreviewState(prev => ({ ...prev, displayZoom: Math.max(50, Math.min(200, parseInt(e.target.value) || 100)) }))}
              style={{width: '50px', marginLeft: '10px'}}
            />
          </div>
        </div>
        
        {/* Algorithm Selector */}
        <div className="control-group">
          <label className="control-label">Algorithm</label>
          <select value={previewState.algorithm} onChange={handleAlgorithmChange}>
            {Object.entries(ALGORITHM_NAMES).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>
        
        {/* Levels Controls */}
        <div className="control-group">
          <label className="control-label">Black Point: {previewState.levels?.blackPoint}</label>
          <div className="slider-container">
            <input
              type="range"
              className="slider"
              min="0"
              max="255"
              value={previewState.levels?.blackPoint || 0}
              onChange={(e) => handleLevelsChange('blackPoint', parseInt(e.target.value))}
            />
            <input
              type="number"
              className="slider-text-input"
              min="0"
              max="255"
              value={previewState.levels?.blackPoint || 0}
              onChange={(e) => handleLevelsChange('blackPoint', Math.max(0, Math.min(255, parseInt(e.target.value) || 0)))}
              style={{width: '50px', marginLeft: '10px'}}
            />
          </div>
        </div>
        
        <div className="control-group">
          <label className="control-label">Mid Point (Gamma): {previewState.levels?.midPoint.toFixed(1)}</label>
          <div className="slider-container">
            <input
              type="range"
              className="slider"
              min="0.1"
              max="10.0"
              step="0.1"
              value={previewState.levels?.midPoint || 1.0}
              onChange={(e) => handleLevelsChange('midPoint', parseFloat(e.target.value))}
            />
            <input
              type="number"
              className="slider-text-input"
              min="0.1"
              max="10.0"
              step="0.1"
              value={previewState.levels?.midPoint || 1.0}
              onChange={(e) => handleLevelsChange('midPoint', Math.max(0.1, Math.min(10.0, parseFloat(e.target.value) || 1.0)))}
              style={{width: '50px', marginLeft: '10px'}}
            />
          </div>
        </div>
        
        <div className="control-group">
          <label className="control-label">White Point: {previewState.levels?.whitePoint}</label>
          <div className="slider-container">
            <input
              type="range"
              className="slider"
              min="0"
              max="255"
              value={previewState.levels?.whitePoint || 255}
              onChange={(e) => handleLevelsChange('whitePoint', parseInt(e.target.value))}
            />
            <input
              type="number"
              className="slider-text-input"
              min="0"
              max="255"
              value={previewState.levels?.whitePoint || 255}
              onChange={(e) => handleLevelsChange('whitePoint', Math.max(0, Math.min(255, parseInt(e.target.value) || 255)))}
              style={{width: '50px', marginLeft: '10px'}}
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="button-group">
          <button onClick={() => processImage(false)} disabled={previewState.isProcessing}>
            {previewState.isProcessing ? 'Processing...' : 'Process'}
          </button>
          <button disabled>Export PNG</button>
        </div>
      </div>
    </div>
  );
};

export default App;
