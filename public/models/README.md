# ONNX 模型文件目录

## ✅ 模型已内置

`rmbg-1.4.onnx` 模型文件已经内置在项目中，用户无需单独下载。

- **文件大小**: 约 168MB
- **格式**: ONNX
- **位置**: `public/models/rmbg-1.4.onnx`
- **部署**: 模型文件会随项目一起部署到 Cloudflare Pages

## 模型信息

- **模型名称**: RMBG-1.4 (BRIA Background Removal)
- **输入尺寸**: 1024x1024
- **输出**: 背景掩码（mask）

## 如何更新模型

如果需要更新或重新转换模型：

```bash
# 运行转换脚本
python3 scripts/convert_rmbg_to_onnx.py public/models/rmbg-1.4.onnx

# 提交更改（使用 Git LFS）
git add public/models/rmbg-1.4.onnx
git commit -m "chore: 更新模型文件"
git push origin main
```

## 注意事项

- 模型文件使用 Git LFS 管理（见 `.gitattributes`）
- 首次加载模型需要一些时间（取决于网络速度）
- 浏览器会自动缓存模型文件
