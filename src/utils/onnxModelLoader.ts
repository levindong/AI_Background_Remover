/**
 * ONNX Model Loader utility
 */

export class ONNXModelLoader {
  private worker: Worker | null = null;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    // Create worker from public directory
    // This avoids Vite's worker bundling issues
    this.worker = new Worker('/rmbgWorker.js', {
      type: 'classic',
      name: 'rmbg-worker'
    });
  }

  /**
   * Load the model
   */
  async load(progressCallback?: (progress: number) => void): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        const { type, progress, error } = event.data;

        if (type === 'progress' && progressCallback) {
          progressCallback(progress);
        } else if (type === 'loaded') {
          this.isLoaded = true;
          this.worker?.removeEventListener('message', handleMessage);
          resolve();
        } else if (type === 'error') {
          this.worker?.removeEventListener('message', handleMessage);
          reject(new Error(error));
        }
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.postMessage({ type: 'load' });
    });

    return this.loadPromise;
  }

  /**
   * Process an image and return mask
   */
  async processImage(imageData: ImageData): Promise<ImageData> {
    if (!this.isLoaded) {
      await this.load();
    }

    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        const { type, mask, error } = event.data;

        if (type === 'result') {
          if (this.worker) {
            this.worker.removeEventListener('message', handleMessage);
          }
          
          // Reconstruct ImageData from serialized data
          const maskData = new Uint8ClampedArray(mask.data);
          const canvas = document.createElement('canvas');
          canvas.width = mask.width;
          canvas.height = mask.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          const imageData = ctx.createImageData(mask.width, mask.height);
          imageData.data.set(maskData);
          resolve(imageData);
        } else if (type === 'error') {
          if (this.worker) {
            this.worker.removeEventListener('message', handleMessage);
          }
          reject(new Error(error));
        }
      };

      this.worker.addEventListener('message', handleMessage);
      
      // Serialize ImageData for transfer
      const serializedImageData = {
        data: Array.from(imageData.data),
        width: imageData.width,
        height: imageData.height,
      };
      
      this.worker.postMessage({ 
        type: 'process', 
        payload: { imageData: serializedImageData } 
      });
    });
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isLoaded = false;
    this.loadPromise = null;
  }
}

