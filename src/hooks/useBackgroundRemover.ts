import { useState, useCallback, useRef } from 'react';
import { pipeline, env } from '@xenova/transformers';
import type { ImageFile } from './useFileHandler';
import {
  applyMaskToImage,
  createBlobPreviewUrl,
  revokePreviewUrl,
} from '../utils/imageProcessor';

// Configure transformers.js environment
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.backends.onnx.wasm.proxy = false;

export interface ProcessedImage extends ImageFile {
  status: 'pending' | 'processing' | 'completed' | 'error';
  processedBlob?: Blob;
  processedPreview?: string;
  error?: string;
}

export interface ProcessingState {
  isModelLoading: boolean;
  modelLoadProgress: number;
  isProcessing: boolean;
  processedImages: ProcessedImage[];
}

/**
 * Hook for background removal using RMBG-1.4 model
 */
export function useBackgroundRemover() {
  const [state, setState] = useState<ProcessingState>({
    isModelLoading: false,
    modelLoadProgress: 0,
    isProcessing: false,
    processedImages: [],
  });

  const segmenterRef = useRef<any>(null);
  const modelLoadingPromiseRef = useRef<Promise<any> | null>(null);

  /**
   * Load the RMBG-1.4 model
   */
  const loadModel = useCallback(async () => {
    // If model is already loaded, return it
    if (segmenterRef.current) {
      return segmenterRef.current;
    }

    // If model is currently loading, wait for it
    if (modelLoadingPromiseRef.current) {
      return modelLoadingPromiseRef.current;
    }

    // Start loading model
    setState((prev) => ({ ...prev, isModelLoading: true, modelLoadProgress: 0 }));

    const loadPromise = (async () => {
      try {
        // Create pipeline with progress callback
        const segmenter = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
              const progressValue = progress.progress || 0;
              setState((prev) => ({
                ...prev,
                modelLoadProgress: progressValue,
              }));
            }
          },
        });

        segmenterRef.current = segmenter;
        setState((prev) => ({
          ...prev,
          isModelLoading: false,
          modelLoadProgress: 100,
        }));

        return segmenter;
      } catch (error) {
        console.error('Model loading error:', error);
        setState((prev) => ({
          ...prev,
          isModelLoading: false,
          modelLoadProgress: 0,
        }));
        // Provide more helpful error message
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('SegformerForSemanticSegmentation')) {
          throw new Error(
            'Model type not supported. Please ensure you are using a compatible version of @xenova/transformers. ' +
            'The RMBG-1.4 model may require a specific model configuration.'
          );
        }
        throw error;
      } finally {
        modelLoadingPromiseRef.current = null;
      }
    })();

    modelLoadingPromiseRef.current = loadPromise;
    return loadPromise;
  }, []);

  /**
   * Process a single image
   */
  const processImage = useCallback(
    async (imageFile: ImageFile, segmenter: any): Promise<ProcessedImage> => {
      try {
        // Load image into an Image element
        const img = new Image();
        const imageUrl = URL.createObjectURL(imageFile.file);
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });
        
        // Create canvas for model input (resize to 1024x1024)
        const inputCanvas = document.createElement('canvas');
        inputCanvas.width = 1024;
        inputCanvas.height = 1024;
        const inputCtx = inputCanvas.getContext('2d');
        if (!inputCtx) {
          throw new Error('Failed to get canvas context');
        }
        inputCtx.drawImage(img, 0, 0, 1024, 1024);
        
        // Run segmentation with return_mask option
        const result = await segmenter(inputCanvas, { return_mask: true });
        
        // Extract mask from result
        // RMBG-1.4 returns a PIL Image or canvas with the mask
        let maskImage: HTMLImageElement | HTMLCanvasElement | null = null;
        
        // Handle different return types
        if (result instanceof HTMLImageElement || result instanceof HTMLCanvasElement) {
          maskImage = result;
        } else if (Array.isArray(result) && result.length > 0) {
          const firstResult = result[0];
          if (firstResult instanceof HTMLImageElement || firstResult instanceof HTMLCanvasElement) {
            maskImage = firstResult;
          } else if (firstResult.mask) {
            maskImage = firstResult.mask;
          }
        } else if (result && typeof result === 'object') {
          if (result.mask) {
            maskImage = result.mask;
          } else if (result instanceof HTMLImageElement || result instanceof HTMLCanvasElement) {
            maskImage = result;
          }
        }
        
        if (!maskImage) {
          console.error('Model output:', result);
          throw new Error('Failed to extract mask from model output. Model may not be compatible.');
        }
        
        // Convert mask to ImageData
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = maskImage instanceof HTMLImageElement ? maskImage.width : maskImage.width;
        maskCanvas.height = maskImage instanceof HTMLImageElement ? maskImage.height : maskImage.height;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) {
          throw new Error('Failed to get mask canvas context');
        }
        maskCtx.drawImage(maskImage, 0, 0);
        const mask = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        
        // Clean up
        URL.revokeObjectURL(imageUrl);
        
        // Apply mask to original image
        const processedBlob = await applyMaskToImage(imageFile.file, mask);
        const processedPreview = createBlobPreviewUrl(processedBlob);
        
        return {
          ...imageFile,
          status: 'completed',
          processedBlob,
          processedPreview,
        };
      } catch (error) {
        console.error('Error processing image:', error);
        return {
          ...imageFile,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    []
  );

  /**
   * Process all images
   */
  const processAllImages = useCallback(
    async (imageFiles: ImageFile[]) => {
      if (imageFiles.length === 0) return;

      // Initialize processed images
      const initialProcessed: ProcessedImage[] = imageFiles.map((img) => ({
        ...img,
        status: 'pending' as const,
      }));

      setState((prev) => ({
        ...prev,
        processedImages: initialProcessed,
        isProcessing: true,
      }));

      try {
        // Load model if not already loaded
        const segmenter = await loadModel();

        // Process all images in parallel
        const processPromises = initialProcessed.map(async (processedImg, index) => {
          // Update status to processing
          setState((prev) => {
            const updated = [...prev.processedImages];
            updated[index] = { ...updated[index], status: 'processing' };
            return { ...prev, processedImages: updated };
          });

          // Process image
          const result = await processImage(processedImg, segmenter);

          // Update with result
          setState((prev) => {
            const updated = [...prev.processedImages];
            updated[index] = result;
            return { ...prev, processedImages: updated };
          });

          return result;
        });

        await Promise.all(processPromises);
      } catch (error) {
        console.error('Error processing images:', error);
      } finally {
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [loadModel, processImage]
  );

  /**
   * Reset processed images
   */
  const resetProcessed = useCallback(() => {
    state.processedImages.forEach((img) => {
      if (img.processedPreview) {
        revokePreviewUrl(img.processedPreview);
      }
    });
    setState((prev) => ({
      ...prev,
      processedImages: [],
      isProcessing: false,
    }));
  }, [state.processedImages]);

  return {
    ...state,
    loadModel,
    processAllImages,
    resetProcessed,
  };
}

