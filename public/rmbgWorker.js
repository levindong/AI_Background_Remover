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
// Cloudflare Pages 限制单个文件最大 25MB，模型文件 (168MB) 需要从外部 CDN 加载
// 优先尝试本地模型（仅用于开发环境），然后尝试 GitHub Releases CDN
const LOCAL_MODEL_URL = '/models/rmbg-1.4.onnx'; // 仅用于本地开发
// 使用 jsDelivr CDN 从 GitHub Releases 加载（推荐，速度快）
const CDN_MODEL_URL = 'https://cdn.jsdelivr.net/gh/levindong/AI_Background_Remover@v1.0.0-model/public/models/rmbg-1.4.onnx';
// 备用：直接从 GitHub Releases 加载
const GITHUB_RELEASE_URL = 'https://github.com/levindong/AI_Background_Remover/releases/download/v1.0.0-model/rmbg-1.4.onnx';
const MODEL_INPUT_SIZE = 1024;

let session = null;

/**
 * Load the ONNX model
 * 优先尝试本地模型，如果失败则从 Hugging Face CDN 加载
 */
async function loadModel(progressCallback) {
  if (session) {
    return; // Model already loaded
  }

  try {
    // Configure ONNX Runtime for better performance
    ort.env.wasm.numThreads = 2; // 使用 2 个线程（可根据 CPU 核心数调整）
    ort.env.wasm.simd = true; // 启用 SIMD 加速

    const options = {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    };

    if (progressCallback) {
      progressCallback(10);
    }

    // 优先尝试本地模型（仅用于开发环境）
    try {
      session = await ort.InferenceSession.create(LOCAL_MODEL_URL, options);
      if (progressCallback) {
        progressCallback(100);
      }
      return;
    } catch (localError) {
      console.log('Local model not found (expected in production), trying CDN...');
      if (progressCallback) {
        progressCallback(20);
      }
    }

    // 从 GitHub Releases CDN 加载
    if (progressCallback) {
      progressCallback(40);
    }
    session = await ort.InferenceSession.create(CDN_MODEL_URL, options);

    if (progressCallback) {
      progressCallback(100);
    }
  } catch (error) {
    console.error('Failed to load ONNX model:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`模型加载失败: ${errorMessage}。请确保模型文件已正确配置。详情请查看 RMBG_INTEGRATION_GUIDE.md`);
  }
}

/**
 * Bilinear interpolation for better image resizing
 */
function bilinearInterpolate(srcData, srcWidth, srcHeight, x, y) {
  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const x2 = Math.min(x1 + 1, srcWidth - 1);
  const y2 = Math.min(y1 + 1, srcHeight - 1);
  
  const dx = x - x1;
  const dy = y - y1;
  
  const getPixel = (px, py) => {
    const idx = (py * srcWidth + px) * 4;
    return [
      srcData[idx],
      srcData[idx + 1],
      srcData[idx + 2],
      srcData[idx + 3]
    ];
  };
  
  const p11 = getPixel(x1, y1);
  const p21 = getPixel(x2, y1);
  const p12 = getPixel(x1, y2);
  const p22 = getPixel(x2, y2);
  
  const interpolate = (a, b, c, d) => {
    return a * (1 - dx) * (1 - dy) + 
           b * dx * (1 - dy) + 
           c * (1 - dx) * dy + 
           d * dx * dy;
  };
  
  return [
    interpolate(p11[0], p21[0], p12[0], p22[0]),
    interpolate(p11[1], p21[1], p12[1], p22[1]),
    interpolate(p11[2], p21[2], p12[2], p22[2]),
    interpolate(p11[3], p21[3], p12[3], p22[3])
  ];
}

/**
 * Preprocess image for model input
 * 与官方实现保持一致：归一化到 [0,1] 然后标准化到 [-1,1]
 */
function preprocessImage(imageData) {
  const { width, height } = imageData;
  
  // Resize to 1024x1024 using bilinear interpolation
  let resizedData;
  
  if (width === MODEL_INPUT_SIZE && height === MODEL_INPUT_SIZE) {
    resizedData = imageData;
  } else {
    resizedData = new ImageData(MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
    const scaleX = width / MODEL_INPUT_SIZE;
    const scaleY = height / MODEL_INPUT_SIZE;
    
    for (let y = 0; y < MODEL_INPUT_SIZE; y++) {
      for (let x = 0; x < MODEL_INPUT_SIZE; x++) {
        const srcX = x * scaleX;
        const srcY = y * scaleY;
        const [r, g, b, a] = bilinearInterpolate(imageData.data, width, height, srcX, srcY);
        
        const dstIdx = (y * MODEL_INPUT_SIZE + x) * 4;
        resizedData.data[dstIdx] = r;
        resizedData.data[dstIdx + 1] = g;
        resizedData.data[dstIdx + 2] = b;
        resizedData.data[dstIdx + 3] = a;
      }
    }
  }

  // Convert to normalized tensor [1, 3, 1024, 1024]
  // 预处理流程（与官方实现一致）:
  // 1. 归一化到 [0, 1]: r / 255.0
  // 2. 标准化到 [-1, 1]: (r / 255.0 - 0.5) / 0.5 = (r / 255.0 - 0.5) * 2
  const tensorData = new Float32Array(1 * 3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);
  
  for (let i = 0; i < MODEL_INPUT_SIZE * MODEL_INPUT_SIZE; i++) {
    const r = resizedData.data[i * 4];
    const g = resizedData.data[i * 4 + 1];
    const b = resizedData.data[i * 4 + 2];
    
    // 标准化到 [-1, 1] 范围
    tensorData[i] = (r / 255.0 - 0.5) * 2;  // R channel
    tensorData[MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + i] = (g / 255.0 - 0.5) * 2;  // G channel
    tensorData[2 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + i] = (b / 255.0 - 0.5) * 2;  // B channel
  }

  return tensorData;
}

/**
 * Resize mask using bilinear interpolation
 */
function resizeMaskBilinear(maskData, srcWidth, srcHeight, dstWidth, dstHeight) {
  const resized = new Float32Array(dstWidth * dstHeight);
  const scaleX = srcWidth / dstWidth;
  const scaleY = srcHeight / dstHeight;
  
  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const srcX = x * scaleX;
      const srcY = y * scaleY;
      
      const x1 = Math.floor(srcX);
      const y1 = Math.floor(srcY);
      const x2 = Math.min(x1 + 1, srcWidth - 1);
      const y2 = Math.min(y1 + 1, srcHeight - 1);
      
      const dx = srcX - x1;
      const dy = srcY - y1;
      
      const v11 = maskData[y1 * srcWidth + x1];
      const v21 = maskData[y1 * srcWidth + x2];
      const v12 = maskData[y2 * srcWidth + x1];
      const v22 = maskData[y2 * srcWidth + x2];
      
      const interpolated = v11 * (1 - dx) * (1 - dy) +
                           v21 * dx * (1 - dy) +
                           v12 * (1 - dx) * dy +
                           v22 * dx * dy;
      
      resized[y * dstWidth + x] = interpolated;
    }
  }
  
  return resized;
}

/**
 * Postprocess model output to mask
 * 与官方实现保持一致：归一化输出到 [0,1]，然后调整回原始尺寸
 */
function postprocessMask(output, originalWidth, originalHeight) {
  const outputData = output.data;
  const [, , height, width] = output.dims;
  
  // 1. 归一化输出到 [0, 1] 范围（与官方实现一致）
  let min = Infinity;
  let max = -Infinity;
  
  for (let i = 0; i < outputData.length; i++) {
    if (outputData[i] < min) min = outputData[i];
    if (outputData[i] > max) max = outputData[i];
  }
  
  const range = max - min;
  if (range === 0) {
    // 如果所有值相同，返回全白掩码
    const maskData = new Uint8ClampedArray(originalWidth * originalHeight * 4);
    maskData.fill(255);
    return new ImageData(maskData, originalWidth, originalHeight);
  }
  
  // 归一化到 [0, 1]
  const normalized = new Float32Array(outputData.length);
  for (let i = 0; i < outputData.length; i++) {
    normalized[i] = (outputData[i] - min) / range;
  }
  
  // 2. 调整尺寸回原始大小（使用双线性插值）
  const resizedMask = resizeMaskBilinear(
    normalized,
    width,
    height,
    originalWidth,
    originalHeight
  );
  
  // 3. 转换为 ImageData (灰度掩码，RGBA 格式)
  const maskData = new Uint8ClampedArray(originalWidth * originalHeight * 4);
  for (let i = 0; i < originalWidth * originalHeight; i++) {
    const value = Math.round(resizedMask[i] * 255);
    maskData[i * 4] = value;      // R
    maskData[i * 4 + 1] = value;  // G
    maskData[i * 4 + 2] = value;  // B
    maskData[i * 4 + 3] = value;  // A (alpha channel)
  }

  return new ImageData(maskData, originalWidth, originalHeight);
}

/**
 * Process image and return mask
 */
async function processImage(imageData) {
  if (!session) {
    throw new Error('Model not loaded');
  }

  // 保存原始尺寸
  const originalWidth = imageData.width;
  const originalHeight = imageData.height;

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
  
  // Postprocess (传入原始尺寸以调整掩码大小)
  const mask = postprocessMask(output, originalWidth, originalHeight);
  
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

