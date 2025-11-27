# ONNX 模型设置说明

## 关于 RMBG-1.4 ONNX 模型

RMBG-1.4 模型需要转换为 ONNX 格式才能在浏览器中使用 ONNX Runtime Web 运行。

## 获取 ONNX 模型的几种方式

### 方式 1: 从 Hugging Face 下载并转换

1. **下载 PyTorch 模型**：
   ```bash
   # 使用 huggingface_hub
   pip install huggingface_hub
   python -c "from huggingface_hub import snapshot_download; snapshot_download('briaai/RMBG-1.4', local_dir='./models/RMBG-1.4')"
   ```

2. **转换为 ONNX 格式**：
   ```python
   import torch
   from transformers import AutoModelForImageSegmentation
   import onnx
   from onnxruntime.tools import convert_onnx
   
   # 加载模型
   model = AutoModelForImageSegmentation.from_pretrained('briaai/RMBG-1.4', trust_remote_code=True)
   model.eval()
   
   # 创建示例输入
   dummy_input = torch.randn(1, 3, 1024, 1024)
   
   # 导出为 ONNX
   torch.onnx.export(
       model,
       dummy_input,
       "model.onnx",
       input_names=['input'],
       output_names=['output'],
       opset_version=11,
       dynamic_axes={'input': {0: 'batch'}, 'output': {0: 'batch'}}
   )
   ```

### 方式 2: 使用预转换的 ONNX 模型

如果已经有预转换的 ONNX 模型，可以：

1. 将模型文件放在 `public/models/` 目录
2. 更新 `src/workers/rmbgWorker.ts` 中的 `MODEL_URL`：
   ```typescript
   const MODEL_URL = '/models/rmbg-1.4.onnx';
   ```

### 方式 3: 使用 CDN 托管

如果模型已托管在 CDN 上，更新 `MODEL_URL` 为 CDN 地址。

## 模型文件位置

- **开发环境**: 模型将从 `MODEL_URL` 指定的 URL 下载
- **生产环境**: 建议将模型文件放在 `public/models/` 目录，或使用 CDN

## 注意事项

1. **模型大小**: RMBG-1.4 模型约 44MB，首次加载需要时间
2. **CORS**: 如果从外部 URL 加载，确保服务器支持 CORS
3. **缓存**: 浏览器会自动缓存下载的模型文件

## 测试模型加载

在浏览器控制台中检查：
- 网络请求是否成功下载模型
- Worker 是否正常初始化
- 是否有错误信息

