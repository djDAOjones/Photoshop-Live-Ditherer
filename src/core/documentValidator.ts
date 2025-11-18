/**
 * @file documentValidator.ts
 * @description Validate Photoshop documents for dithering compatibility
 */

import { DocumentInfo } from '../types';

/**
 * Validate that document is 8-bit RGB
 */
export function validateDocument(doc: any): DocumentInfo {
  const info: DocumentInfo = {
    width: doc.width,
    height: doc.height,
    mode: doc.mode,
    bitsPerChannel: doc.bitsPerChannel,
    isValid: true,
  };
  
  // Check if RGB mode
  if (doc.mode !== 'RGB') {
    info.isValid = false;
    info.errorMessage = 
      'Document must be in RGB mode. Please convert via Image > Mode > RGB Color';
    return info;
  }
  
  // Check if 8-bit
  if (doc.bitsPerChannel !== 8) {
    info.isValid = false;
    info.errorMessage = 
      'Document must be 8-bit. Please convert via Image > Mode > 8 Bits/Channel';
    return info;
  }
  
  return info;
}

/**
 * Get composite (flattened) image data from document
 * Extracts pixel data at specified scale using Photoshop UXP API
 */
export async function getCompositeImageData(scale: number = 100): Promise<ImageData> {
  console.log('=== getCompositeImageData called (NEW VERSION WITH LOGGING) ===');
  console.log(`Scale: ${scale}%`);
  
  // Access photoshop from global scope (UXP provides it)
  const photoshop = (window as any).require('photoshop');
  
  if (!photoshop || !photoshop.app) {
    throw new Error('Photoshop API not available - ensure plugin is running in Photoshop');
  }
  
  const app = photoshop.app;
  
  if (!app.activeDocument) {
    throw new Error('No active document - please open a document in Photoshop');
  }
  
  const doc = app.activeDocument;
  console.log(`Active document: ${doc.name} (${doc.width}x${doc.height})`);
  
  // Calculate target dimensions based on scale
  const scaleFactor = scale / 100;
  const targetWidth = Math.round(doc.width * scaleFactor);
  const targetHeight = Math.round(doc.height * scaleFactor);
  console.log(`Target size: ${targetWidth}x${targetHeight}`);
  
  // Try executeAsModal with simplest possible async function
  console.log('Attempting executeAsModal - simplest form...');
  
  let pixelData;
  try {
    pixelData = await photoshop.core.executeAsModal(
      async () => {
        // Duplicate document
        await photoshop.action.batchPlay([{
          _obj: 'duplicate',
          _target: [{ _ref: 'document', _enum: 'ordinal', _value: 'targetEnum' }]
        }], {});
        
        const dupDoc = app.activeDocument;
        
        // Flatten the duplicate to merge all layers
        await photoshop.action.batchPlay([{
          _obj: 'flattenImage'
        }], {});
        
        // Resize if needed
        if (scaleFactor !== 1) {
          await photoshop.action.batchPlay([{
            _obj: 'imageSize',
            width: { _unit: 'pixelsUnit', _value: targetWidth },
            height: { _unit: 'pixelsUnit', _value: targetHeight },
            interfaceIconFrameDimmed: { _enum: 'interpolationType', _value: 'bicubic' }
          }], {});
        }
        
        // Convert to RGB if needed
        if (dupDoc.mode !== 'RGB') {
          await photoshop.action.batchPlay([{
            _obj: 'convertMode',
            to: { _class: 'RGBColorMode' }
          }], {});
        }
        
        // Get pixels from the flattened, resized duplicate
        const pixelResult = await photoshop.imaging.getPixels({
          documentID: dupDoc.id,
          sourceBounds: { left: 0, top: 0, right: targetWidth, bottom: targetHeight },
          targetSize: { width: targetWidth, height: targetHeight },
          colorSpace: 'RGB',
          components: 4
        });
        
        // Close duplicate
        await photoshop.action.batchPlay([{
          _obj: 'close',
          saving: { _enum: 'yesNo', _value: 'no' }
        }], {});
        
        // imageData is PhotoshopImageData class - getData() returns a Promise!
        const ImageDataClass = pixelResult.imageData;
        
        // Await the getData() promise to get pixel bytes
        const pixels = await ImageDataClass.getData();
        
        if (!pixels || !pixels.length) {
          throw new Error(
            `getData() resolved but empty! Type: ${typeof pixels}, Length: ${pixels?.length || 0}`
          );
        }
        
        // Log pixel stats for debugging
        console.log('✅ Got pixels! Length:', pixels.length);
        console.log('Expected:', targetWidth * targetHeight * 4);
        console.log('First 20 values:', Array.from(pixels.slice(0, 20)));
        const minVal = Math.min(...pixels.slice(0, 1000));
        const maxVal = Math.max(...pixels.slice(0, 1000));
        console.log('Min/Max/Avg:', minVal, '/', maxVal, '/', Math.round(pixels.slice(0, 1000).reduce((a: number, b: number) => a + b, 0) / 1000));
        
        return pixels;
      },
      { commandName: 'Dithering Studio' }
    );
  } catch (err) {
    throw new Error(`executeAsModal error: ${err}`);
  }
  
  console.log('Returned from executeAsModal, pixelData type:', typeof pixelData);
  console.log('pixelData length:', pixelData?.length);
  
  // Create ImageData and copy pixels
  const { createImageData } = require('../utils/imageDataHelper');
  const imageData = createImageData(targetWidth, targetHeight);
  
  const expectedRGBA = targetWidth * targetHeight * 4;
  const expectedRGB = targetWidth * targetHeight * 3;
  
  if (pixelData && pixelData.length === expectedRGBA) {
    // RGBA data - copy directly
    imageData.data.set(pixelData);
    console.log('✓ RGBA pixel data copied successfully!');
  } else if (pixelData && pixelData.length === expectedRGB) {
    // RGB data without alpha - add alpha channel
    console.log('Got RGB data, adding alpha channel...');
    for (let i = 0; i < targetWidth * targetHeight; i++) {
      imageData.data[i * 4 + 0] = pixelData[i * 3 + 0]; // R
      imageData.data[i * 4 + 1] = pixelData[i * 3 + 1]; // G
      imageData.data[i * 4 + 2] = pixelData[i * 3 + 2]; // B
      imageData.data[i * 4 + 3] = 255;                   // A (opaque)
    }
    console.log('✓ RGB converted to RGBA successfully!');
  } else {
    throw new Error(
      `Invalid pixel data: expected ${expectedRGBA} bytes (RGBA) or ${expectedRGB} bytes (RGB), got ${pixelData?.length || 0}`
    );
  }
  
  return imageData;
}
