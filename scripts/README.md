# 批量背景去除 Python 脚本

使用 RMBG-1.4 模型在本地批量处理图片背景去除的 Python 脚本。

## 安装依赖

```bash
pip install -r requirements.txt
```

或者手动安装：

```bash
pip install torch torchvision transformers pillow numpy tqdm
```

## 使用方法

### 基本用法

```bash
# 处理指定目录，输出到指定目录
python batch_remove_background.py <输入目录> <输出目录>

# 处理指定目录，输出到默认位置（输入目录_no_bg）
python batch_remove_background.py <输入目录>
```

### 示例

```bash
# 处理 ./images 目录，输出到 ./output
python batch_remove_background.py ./images ./output

# 处理 ./photos 目录，输出到 ./photos_no_bg
python batch_remove_background.py ./photos

# 处理当前目录
python batch_remove_background.py .
```

### 高级选项

```bash
# 指定使用 CPU（默认自动选择 GPU 如果可用）
python batch_remove_background.py ./images ./output --device cpu

# 强制使用 CUDA
python batch_remove_background.py ./images ./output --device cuda
```

## 功能特点

- ✅ 支持批量处理整个目录
- ✅ 保持原始目录结构
- ✅ 支持递归处理子目录
- ✅ 支持多种图片格式：JPG, PNG, WEBP, AVIF
- ✅ 自动使用 GPU（如果可用）
- ✅ 显示处理进度
- ✅ 错误处理和报告

## 输出格式

- 所有处理后的图片保存为 PNG 格式（支持透明背景）
- 保持原始文件名（扩展名改为 .png）
- 保持原始目录结构

## 性能

- **GPU 模式**: 通常每张图片 1-3 秒（取决于图片大小和 GPU）
- **CPU 模式**: 通常每张图片 5-15 秒（取决于图片大小和 CPU）

## 注意事项

1. 首次运行会下载 RMBG-1.4 模型（约 44MB），需要一些时间
2. 模型会缓存在 `~/.cache/huggingface/` 目录
3. 确保有足够的磁盘空间存储输出图片
4. 处理大量图片时，建议使用 GPU 以加快速度

## 故障排除

### 模型下载失败
- 检查网络连接
- 如果在中国大陆，可能需要配置代理或使用镜像源

### CUDA 错误
- 确保安装了支持 CUDA 的 PyTorch 版本
- 检查 GPU 驱动是否正确安装
- 可以使用 `--device cpu` 强制使用 CPU

### 内存不足
- 减少同时处理的图片数量
- 使用 CPU 模式（内存占用更少）
- 处理较小的图片

