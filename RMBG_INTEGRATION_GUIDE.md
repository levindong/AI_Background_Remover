# RMBG-1.4 浏览器端集成完整指南

## 📋 目录

1. [概述](#概述)
2. [模型获取与转换](#模型获取与转换)
3. [正确的预处理/后处理实现](#正确的预处理后处理实现)
4. [浏览器端集成方案](#浏览器端集成方案)
5. [常见问题与解决方案](#常见问题与解决方案)
6. [性能优化建议](#性能优化建议)

---

## 概述

RMBG-1.4 是 BRIA AI 开发的高精度背景去除模型。要在浏览器中使用，需要：

1. **模型格式转换**：从 PyTorch 转换为 ONNX
2. **正确的预处理**：图像归一化、尺寸调整
3. **正确的后处理**：掩码处理、应用透明度
4. **浏览器运行时**：使用 ONNX Runtime Web

---

## 模型获取与转换

### 方案 A: 从 Hugging Face 下载并转换（推荐）

#### 步骤 1: 安装转换工具

```bash
pip install torch torchvision transformers onnx onnxruntime
```

#### 步骤 2: 创建转换脚本

创建 `scripts/convert_rmbg_to_onnx.py`:

```python
#!/usr/bin/env python3
"""
将 RMBG-1.4 PyTorch 模型转换为 ONNX 格式
"""

import torch
from transformers import AutoModelForImageSegmentation
import numpy as np

def convert_to_onnx():
    print("正在加载 RMBG-1.4 模型...")
    
    # 加载模型
    model = AutoModelForImageSegmentation.from_pretrained(
        'briaai/RMBG-1.4',
        trust_remote_code=True
    )
    model.eval()
    
    # 创建示例输入 [batch, channels, height, width]
    # RMBG-1.4 输入尺寸为 1024x1024
    dummy_input = torch.randn(1, 3, 1024, 1024)
    
    print("正在转换为 ONNX 格式...")
    
    # 导出为 ONNX
    torch.onnx.export(
        model,
        dummy_input,
        "rmbg-1.4.onnx",
        input_names=['input'],
        output_names=['output'],
        opset_version=14,  # 使用 opset 14 以获得更好的浏览器兼容性
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        },
        do_constant_folding=True,
        export_params=True,
        verbose=False
    )
    
    print("✅ 转换完成！模型已保存为 rmbg-1.4.onnx")
    print("📦 文件大小:", f"{os.path.getsize('rmbg-1.4.onnx') / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    import os
    convert_to_onnx()
```

#### 步骤 3: 运行转换

```bash
cd /Users/dongting/Projects/AIBgRemover
python3 scripts/convert_rmbg_to_onnx.py
```

#### 步骤 4: 放置模型文件

```bash
# 创建模型目录
mkdir -p public/models

# 移动模型文件
mv rmbg-1.4.onnx public/models/
```

### 方案 B: 使用预转换的 ONNX 模型

如果已经有预转换的 ONNX 模型：

1. 将模型文件放在 `public/models/rmbg-1.4.onnx`
2. 更新 `public/rmbgWorker.js` 中的 `MODEL_URL`:

```javascript
const MODEL_URL = '/models/rmbg-1.4.onnx';
```

---

## 正确的预处理/后处理实现

### 预处理步骤（与官方实现一致）

根据 `scripts/batch_remove_background.py` 和官方实现，正确的预处理流程：

1. **读取图像**：转换为 RGB 格式
2. **调整尺寸**：缩放到 1024x1024（保持宽高比或直接缩放）
3. **归一化**：
   - 像素值从 [0, 255] 归一化到 [0, 1]
   - 标准化：`(x - 0.5) / 0.5`，即 `(x - 0.5) * 2`
   - 最终范围：[-1, 1]

### 后处理步骤

1. **调整掩码尺寸**：从 1024x1024 调整回原始图像尺寸
2. **归一化掩码**：将输出值归一化到 [0, 1]
3. **应用透明度**：将掩码作为 alpha 通道应用到原图

### 当前实现的问题

查看 `public/rmbgWorker.js` 的预处理函数，发现以下问题：

1. **归一化不正确**：当前使用 `(r / 255.0 - 0.5) / 0.5`，但应该先归一化到 [0,1]，再标准化
2. **后处理不正确**：掩码处理逻辑需要与官方实现对齐

---

## 浏览器端集成方案

### 当前架构

```
┌─────────────────┐
│   React App     │
│  (Main Thread)  │
└────────┬────────┘
         │
         │ postMessage
         ▼
┌─────────────────┐
│  Web Worker     │
│  (rmbgWorker.js)│
│                 │
│  - ONNX Runtime │
│  - Model Load   │
│  - Inference    │
└─────────────────┘
```

### 需要修复的问题

#### 1. 预处理函数修复

当前 `public/rmbgWorker.js` 中的预处理需要修正：

```javascript
function preprocessImage(imageData) {
  const { width, height } = imageData;
  const MODEL_INPUT_SIZE = 1024;
  
  // 1. 调整尺寸到 1024x1024
  // 使用更好的插值方法（双线性）
  const resizedData = resizeImageDataBilinear(imageData, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  
  // 2. 转换为 tensor 格式 [1, 3, 1024, 1024]
  const tensorData = new Float32Array(1 * 3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);
  
  for (let i = 0; i < MODEL_INPUT_SIZE * MODEL_INPUT_SIZE; i++) {
    const r = resizedData.data[i * 4];
    const g = resizedData.data[i * 4 + 1];
    const b = resizedData.data[i * 4 + 2];
    
    // 正确的归一化流程：
    // 1. 归一化到 [0, 1]: r / 255.0
    // 2. 标准化到 [-1, 1]: (r / 255.0 - 0.5) / 0.5 = (r / 255.0 - 0.5) * 2
    const rNorm = (r / 255.0 - 0.5) * 2;
    const gNorm = (g / 255.0 - 0.5) * 2;
    const bNorm = (b / 255.0 - 0.5) * 2;
    
    // [C, H, W] 格式
    tensorData[i] = rNorm;  // R channel
    tensorData[MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + i] = gNorm;  // G channel
    tensorData[2 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + i] = bNorm;  // B channel
  }
  
  return tensorData;
}
```

#### 2. 后处理函数修复

```javascript
function postprocessMask(output, originalWidth, originalHeight) {
  const outputData = output.data;
  const [, , height, width] = output.dims;
  
  // 1. 将输出归一化到 [0, 1]
  let min = Infinity;
  let max = -Infinity;
  
  for (let i = 0; i < outputData.length; i++) {
    if (outputData[i] < min) min = outputData[i];
    if (outputData[i] > max) max = outputData[i];
  }
  
  const range = max - min;
  const normalized = new Float32Array(outputData.length);
  for (let i = 0; i < outputData.length; i++) {
    normalized[i] = (outputData[i] - min) / range;
  }
  
  // 2. 调整尺寸回原始大小
  // 这里需要在 Worker 中实现双线性插值
  const resizedMask = resizeMaskBilinear(normalized, width, height, originalWidth, originalHeight);
  
  // 3. 转换为 ImageData (灰度掩码)
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
```

#### 3. 模型加载优化

```javascript
async function loadModel(progressCallback) {
  if (session) {
    return;
  }

  try {
    // 配置 ONNX Runtime
    ort.env.wasm.numThreads = 2;  // 可以尝试增加线程数
    ort.env.wasm.simd = true;
    
    // 使用本地模型文件（推荐）
    const MODEL_URL = '/models/rmbg-1.4.onnx';
    
    const options = {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    };

    if (progressCallback) {
      progressCallback(10);
    }

    // 加载模型
    session = await ort.InferenceSession.create(MODEL_URL, options);

    if (progressCallback) {
      progressCallback(100);
    }
  } catch (error) {
    console.error('Failed to load ONNX model:', error);
    throw error;
  }
}
```

---

## 常见问题与解决方案

### 问题 1: 模型加载失败

**症状**：`Failed to load ONNX model`

**解决方案**：
1. 确认模型文件存在：检查 `public/models/rmbg-1.4.onnx` 是否存在
2. 检查文件大小：ONNX 模型应该约 40-50MB
3. 检查 CORS：如果从外部 URL 加载，确保服务器支持 CORS
4. 检查浏览器控制台：查看具体错误信息

### 问题 2: 预处理/后处理不正确

**症状**：背景去除效果差，边缘不准确

**解决方案**：
1. 确保预处理归一化正确：`(x / 255.0 - 0.5) * 2`
2. 确保后处理包含归一化步骤：`(output - min) / (max - min)`
3. 使用双线性插值进行尺寸调整，而不是最近邻

### 问题 3: 性能问题

**症状**：处理速度慢，浏览器卡顿

**解决方案**：
1. 使用 Web Worker（已实现）
2. 增加 ONNX Runtime 线程数：`ort.env.wasm.numThreads = 2`
3. 启用 SIMD：`ort.env.wasm.simd = true`
4. 考虑使用量化模型（INT8）以减少模型大小

### 问题 4: 内存不足

**症状**：浏览器崩溃或处理失败

**解决方案**：
1. 限制并发处理数量
2. 处理大图前先压缩
3. 及时释放 ImageData 和 Blob URL
4. 考虑分批处理而不是并行处理所有图片

---

## 性能优化建议

### 1. 模型优化

- **量化**：将 FP32 模型量化为 INT8，可减少 75% 的模型大小
- **剪枝**：移除不重要的权重
- **使用 TensorFlow.js**：如果 ONNX 性能不佳，考虑转换为 TensorFlow.js 格式

### 2. 运行时优化

- **启用 WASM SIMD**：`ort.env.wasm.simd = true`
- **多线程**：`ort.env.wasm.numThreads = 2`（根据 CPU 核心数调整）
- **缓存模型**：使用 Service Worker 缓存模型文件

### 3. 图像处理优化

- **预处理优化**：使用 `createImageBitmap` API 进行异步图像解码
- **批量处理**：限制同时处理的图片数量
- **渐进式处理**：先处理小图预览，再处理完整分辨率

### 4. UI/UX 优化

- **显示进度**：实时更新处理进度
- **错误处理**：友好的错误提示
- **取消功能**：允许用户取消正在进行的处理

---

## 下一步行动

基于以上分析，建议按以下步骤修复和优化：

1. ✅ **创建模型转换脚本**：`scripts/convert_rmbg_to_onnx.py`
2. ✅ **修复预处理函数**：确保归一化正确
3. ✅ **修复后处理函数**：实现正确的掩码归一化和尺寸调整
4. ✅ **优化模型加载**：使用本地模型文件
5. ✅ **添加错误处理**：更详细的错误信息
6. ✅ **性能测试**：测试不同尺寸图片的处理速度

---

## 参考资源

- [RMBG-1.4 Hugging Face](https://huggingface.co/briaai/RMBG-1.4)
- [ONNX Runtime Web 文档](https://onnxruntime.ai/docs/tutorials/web/)
- [BRIA-RMBG-1.4 ModelScope](https://www.modelscope.cn/studios/AI-ModelScope/BRIA-RMBG-1.4)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

---

## 总结

集成 RMBG-1.4 到浏览器的关键点：

1. **模型格式**：必须转换为 ONNX 格式
2. **预处理**：正确的归一化和标准化
3. **后处理**：正确的掩码归一化和应用
4. **性能**：使用 Web Worker 和优化配置
5. **错误处理**：完善的错误提示和恢复机制

遵循以上指南，应该能够成功集成 RMBG-1.4 模型到浏览器应用中。

