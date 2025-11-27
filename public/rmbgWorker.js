/**
 * Web Worker for RMBG-1.4 model inference using ONNX Runtime
 * This file is loaded as a regular script worker
 * 
 * Note: ONNX Runtime will be loaded dynamically from the main thread
 * or you can use importScripts with a CDN URL
 */

// Try to use global ort if available, otherwise load from CDN
if (typeof ort === 'undefined') {
  importScripts('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/ort.min.js');
}

// Model configuration
const MODEL_URL = 'https://huggingface.co/briaai/RMBG-1.4/resolve/main/model.onnx';
const MODEL_INPUT_SIZE = 1024;

let session = null;

/**
 * Load the ONNX model
 */
async function loadModel(progressCallback) {
  if (session) {
    return; // Model already loaded
  }

  try {
    // Configure ONNX Runtime
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = true;

    // Load model with progress tracking
    const options = {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    };

    // For progress tracking, we'll simulate it
    if (progressCallback) {
      progressCallback(10);
    }

    session = await ort.InferenceSession.create(MODEL_URL, options);

    if (progressCallback) {
      progressCallback(100);
    }
  } catch (error) {
    console.error('Failed to load ONNX model:', error);
    throw error;
  }
}

/**
 * Preprocess image for model input
 */
function preprocessImage(imageData) {
  const { width, height } = imageData;
  
  // Resize to 1024x1024 if needed
  // Use createImageBitmap for resizing in Worker
  let resizedData;
  
  if (width === MODEL_INPUT_SIZE && height === MODEL_INPUT_SIZE) {
    resizedData = imageData;
  } else {
    // Create a temporary canvas-like structure for resizing
    // Since we're in a Worker, we'll do manual resizing
    resizedData = new ImageData(MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
    
    // Simple nearest-neighbor resize (can be improved with bilinear)
    const scaleX = width / MODEL_INPUT_SIZE;
    const scaleY = height / MODEL_INPUT_SIZE;
    
    for (let y = 0; y < MODEL_INPUT_SIZE; y++) {
      for (let x = 0; x < MODEL_INPUT_SIZE; x++) {
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);
        const srcIdx = (srcY * width + srcX) * 4;
        const dstIdx = (y * MODEL_INPUT_SIZE + x) * 4;
        
        resizedData.data[dstIdx] = imageData.data[srcIdx];
        resizedData.data[dstIdx + 1] = imageData.data[srcIdx + 1];
        resizedData.data[dstIdx + 2] = imageData.data[srcIdx + 2];
        resizedData.data[dstIdx + 3] = imageData.data[srcIdx + 3];
      }
    }
  }

  // Convert to normalized tensor [1, 3, 1024, 1024]
  const tensorData = new Float32Array(1 * 3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);
  
  for (let i = 0; i < MODEL_INPUT_SIZE * MODEL_INPUT_SIZE; i++) {
    const r = resizedData.data[i * 4];
    const g = resizedData.data[i * 4 + 1];
    const b = resizedData.data[i * 4 + 2];
    
    // Normalize to [-1, 1] range
    tensorData[i] = (r / 255.0 - 0.5) / 0.5;
    tensorData[MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + i] = (g / 255.0 - 0.5) / 0.5;
    tensorData[2 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + i] = (b / 255.0 - 0.5) / 0.5;
  }

  return tensorData;
}

/**
 * Postprocess model output to mask
 */
function postprocessMask(output) {
  const outputData = output.data;
  const [, , height, width] = output.dims;
  
  // Create mask image data
  const maskData = new Uint8ClampedArray(width * height * 4);
  
  for (let i = 0; i < width * height; i++) {
    const maskValue = outputData[i];
    const normalizedValue = Math.max(0, Math.min(255, (maskValue + 1) * 127.5));
    
    maskData[i * 4] = normalizedValue;
    maskData[i * 4 + 1] = normalizedValue;
    maskData[i * 4 + 2] = normalizedValue;
    maskData[i * 4 + 3] = normalizedValue;
  }

  return new ImageData(maskData, width, height);
}

/**
 * Process image and return mask
 */
async function processImage(imageData) {
  if (!session) {
    throw new Error('Model not loaded');
  }

  // Preprocess
  const inputTensor = preprocessImage(imageData);
  
  // Create ONNX tensor
  const tensor = new ort.Tensor('float32', inputTensor, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
  
  // Run inference
  const feeds = {};
  const inputName = session.inputNames[0];
  feeds[inputName] = tensor;
  
  const results = await session.run(feeds);
  
  // Get output
  const outputName = session.outputNames[0];
  const output = results[outputName];
  
  // Postprocess
  const mask = postprocessMask(output);
  
  return mask;
}

// Worker message handler
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'load':
        await loadModel((progress) => {
          self.postMessage({ type: 'progress', progress });
        });
        self.postMessage({ type: 'loaded' });
        break;

      case 'process':
        if (!session) {
          await loadModel();
        }
        // Reconstruct ImageData from serialized data
        const inputImageData = new ImageData(
          new Uint8ClampedArray(payload.imageData.data),
          payload.imageData.width,
          payload.imageData.height
        );
        const mask = await processImage(inputImageData);
        self.postMessage({ 
          type: 'result', 
          mask: {
            data: Array.from(mask.data),
            width: mask.width,
            height: mask.height,
          }
        });
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

