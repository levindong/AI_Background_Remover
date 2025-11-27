import { useState, useCallback, useRef } from 'react';
import type { ImageFile } from './useFileHandler';
import {
  applyMaskToImage,
  createBlobPreviewUrl,
  revokePreviewUrl,
} from '../utils/imageProcessor';
import { ONNXModelLoader } from '../utils/onnxModelLoader';

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
  modelError: string | null;
}

/**
 * Hook for background removal using RMBG-1.4 model via ONNX Runtime
 */
export function useBackgroundRemover() {
  const [state, setState] = useState<ProcessingState>({
    isModelLoading: false,
    modelLoadProgress: 0,
    isProcessing: false,
    processedImages: [],
    modelError: null,
  });

  const modelLoaderRef = useRef<ONNXModelLoader | null>(null);
  const modelLoadingPromiseRef = useRef<Promise<ONNXModelLoader> | null>(null);

  /**
   * Load the RMBG-1.4 model
   */
  const loadModel = useCallback(async () => {
    // If model is already loaded, return
    if (modelLoaderRef.current && state.isModelLoading === false && state.modelError === null) {
      return modelLoaderRef.current;
    }

    // If model is currently loading, wait for it
    if (modelLoadingPromiseRef.current) {
      return modelLoadingPromiseRef.current.then(() => modelLoaderRef.current);
    }

    // Start loading model
    setState((prev) => ({ ...prev, isModelLoading: true, modelLoadProgress: 0, modelError: null }));

    const loadPromise = (async () => {
      try {
        // Create model loader
        if (!modelLoaderRef.current) {
          modelLoaderRef.current = new ONNXModelLoader();
        }

        // Load model with progress callback
        await modelLoaderRef.current.load((progress) => {
          setState((prev) => ({
            ...prev,
            modelLoadProgress: progress,
          }));
        });

        setState((prev) => ({
          ...prev,
          isModelLoading: false,
          modelLoadProgress: 100,
        }));

        return modelLoaderRef.current;
      } catch (error) {
        console.error('Model loading error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setState((prev) => ({
          ...prev,
          isModelLoading: false,
          modelLoadProgress: 0,
          modelError: errorMessage,
        }));
        throw error;
      } finally {
        modelLoadingPromiseRef.current = null;
      }
    })();

    modelLoadingPromiseRef.current = loadPromise;
    return loadPromise;
  }, [state.isModelLoading, state.modelError]);

  /**
   * Process a single image
   */
  const processImage = useCallback(
    async (imageFile: ImageFile, modelLoader: ONNXModelLoader): Promise<ProcessedImage> => {
      try {
        // Load image into an Image element
        const img = new Image();
        const imageUrl = URL.createObjectURL(imageFile.file);
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = imageUrl;
        });
        
        // Create canvas from image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Process with ONNX model
        const mask = await modelLoader.processImage(imageData);
        
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
        const modelLoader = await loadModel();
        if (!modelLoader) {
          throw new Error('Model loader not available');
        }

        // Process all images in parallel
        const processPromises = initialProcessed.map(async (processedImg, index) => {
          // Update status to processing
          setState((prev) => {
            const updated = [...prev.processedImages];
            updated[index] = { ...updated[index], status: 'processing' };
            return { ...prev, processedImages: updated };
          });

          // Process image
          const result = await processImage(processedImg, modelLoader);

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
