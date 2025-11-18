/**
 * Create an ImageData-compatible object for UXP
 * UXP doesn't support new ImageData() or ctx.createImageData()
 */
export function createImageData(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  
  // Return an object that matches ImageData interface
  return {
    width,
    height,
    data,
    colorSpace: 'srgb'
  } as ImageData;
}

/**
 * Clone an ImageData object
 */
export function cloneImageData(imageData: ImageData): ImageData {
  const clone = createImageData(imageData.width, imageData.height);
  clone.data.set(imageData.data);
  return clone;
}
