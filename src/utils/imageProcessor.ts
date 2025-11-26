/**
 * Image processing utilities for background removal
 */

export interface ProcessedImage {
  original: File;
  processed: Blob;
  preview: string;
  processedPreview: string;
}

/**
 * Convert image file to ImageData for model processing
 */
export async function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(imageData);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Resize image to model input size (1024x1024)
 */
export function resizeImageData(
  imageData: ImageData,
  targetSize: number = 1024
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Draw resized image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) {
    throw new Error('Failed to get temp canvas context');
  }
  
  tempCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(tempCanvas, 0, 0, targetSize, targetSize);
  
  return ctx.getImageData(0, 0, targetSize, targetSize);
}

/**
 * Apply mask to original image and return as Blob
 */
export async function applyMaskToImage(
  originalFile: File,
  mask: ImageData
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(originalFile);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Resize mask to match original image size
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      const maskCtx = maskCanvas.getContext('2d');
      
      if (!maskCtx) {
        reject(new Error('Failed to get mask canvas context'));
        return;
      }
      
      // Draw and resize mask
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = mask.width;
      tempCanvas.height = mask.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) {
        reject(new Error('Failed to get temp canvas context'));
        return;
      }
      
      tempCtx.putImageData(mask, 0, 0);
      maskCtx.drawImage(tempCanvas, 0, 0, img.width, img.height);
      
      // Get mask image data
      const resizedMask = maskCtx.getImageData(0, 0, img.width, img.height);
      
      // Apply mask as alpha channel
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const maskData = resizedMask.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Use mask alpha as the image alpha
        data[i + 3] = maskData[i + 3]; // alpha channel
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png');
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Create preview URL from file
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Create preview URL from blob
 */
export function createBlobPreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke preview URL to free memory
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

