# ONNX 模型设置说明

## 重要提示

RMBG-1.4 模型需要转换为 ONNX 格式才能在浏览器中使用。Hugging Face 上的原始模型是 PyTorch 格式，需要转换。

## 获取 ONNX 模型的几种方式

### 方式 1: 使用预转换的 ONNX 模型（推荐）

如果已经有预转换的 ONNX 模型：

1. **下载 ONNX 模型文件**（通常名为 `model.onnx` 或 `rmbg-1.4.onnx`）
2. **放置模型文件**：
   - 开发环境：放在 `public/models/` 目录
   - 生产环境：可以放在 `public/models/` 或使用 CDN
3. **更新 Worker 配置**：
   编辑 `public/rmbgWorker.js`，修改 `MODEL_URL`：
   ```javascript
   const MODEL_URL = '/models/rmbg-1.4.onnx';  // 本地文件
   // 或
   const MODEL_URL = 'https://your-cdn.com/models/rmbg-1.4.onnx';  // CDN
   ```

### 方式 2: 从 PyTorch 模型转换

如果只有 PyTorch 模型，需要转换：

#### 步骤 1: 安装依赖
```bash
pip install torch transformers onnx onnxruntime
```

#### 步骤 2: 转换脚本
创建 `convert_to_onnx.py`：

```python
import torch
from transformers import AutoModelForImageSegmentation
import onnx

# 加载模型
print("Loading model...")
model = AutoModelForImageSegmentation.from_pretrained(
    'briaai/RMBG-1.4',
    trust_remote_code=True
)
model.eval()

# 创建示例输入 (batch, channels, height, width)
dummy_input = torch.randn(1, 3, 1024, 1024)

# 导出为 ONNX
print("Converting to ONNX...")
torch.onnx.export(
    model,
    dummy_input,
    "rmbg-1.4.onnx",
    input_names=['input'],
    output_names=['output'],
    opset_version=14,  # 使用较高的 opset 版本以获得更好的兼容性
    dynamic_axes={
        'input': {0: 'batch_size'},
        'output': {0: 'batch_size'}
    },
    do_constant_folding=True,
    export_params=True,
)

print("Conversion complete! Model saved as rmbg-1.4.onnx")
```

#### 步骤 3: 运行转换
```bash
python convert_to_onnx.py
```

#### 步骤 4: 放置模型文件
将生成的 `rmbg-1.4.onnx` 文件放到 `public/models/` 目录

### 方式 3: 使用在线转换工具

可以使用在线工具将 PyTorch 模型转换为 ONNX：
- [Netron](https://netron.app/) - 可以查看和转换模型
- [ONNX Model Zoo](https://github.com/onnx/models) - 查找预转换的模型

## 模型文件位置

### 开发环境
- 模型文件应放在 `public/models/` 目录
- 访问路径：`/models/rmbg-1.4.onnx`

### 生产环境（Cloudflare Pages）
- 模型文件会自动部署到 `dist/models/` 目录
- 确保模型文件在 `public/models/` 目录中，构建时会复制到 `dist`

## 配置模型 URL

编辑 `public/rmbgWorker.js` 文件，找到以下行：

```javascript
const MODEL_URL = 'https://huggingface.co/briaai/RMBG-1.4/resolve/main/model.onnx';
```

根据你的模型位置修改：

```javascript
// 本地文件（推荐）
const MODEL_URL = '/models/rmbg-1.4.onnx';

// 或使用 CDN
const MODEL_URL = 'https://your-cdn.com/models/rmbg-1.4.onnx';
```

## 注意事项

1. **模型大小**: RMBG-1.4 ONNX 模型约 40-50MB，首次加载需要时间
2. **CORS**: 如果从外部 URL 加载，确保服务器支持 CORS
3. **缓存**: 浏览器会自动缓存下载的模型文件
4. **性能**: 模型在 Web Worker 中运行，不会阻塞主线程
5. **内存**: 确保浏览器有足够内存（建议至少 2GB 可用内存）

## 测试模型加载

1. 打开浏览器开发者工具（F12）
2. 查看 Network 标签，确认模型文件正在下载
3. 查看 Console 标签，检查是否有错误信息
4. 查看 Application > Service Workers，确认 Worker 正常运行

## 故障排除

### 模型加载失败
- 检查模型文件路径是否正确
- 确认模型文件存在且可访问
- 检查浏览器控制台的错误信息

### CORS 错误
- 如果从外部 URL 加载，确保服务器设置了正确的 CORS 头
- 考虑将模型文件放在自己的服务器或 CDN 上

### Worker 初始化失败
- 检查浏览器是否支持 Web Workers
- 确认 `public/rmbgWorker.js` 文件存在
- 检查浏览器控制台的错误信息

## 替代方案

如果无法获取 ONNX 模型，可以考虑：
1. 使用其他支持浏览器运行的背景去除模型
2. 使用第三方 API 服务（需要服务器端支持）
3. 等待 Hugging Face 提供预转换的 ONNX 模型
