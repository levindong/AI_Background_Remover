# 模型文件上传指南

## 问题说明

Cloudflare Pages 限制单个文件最大 **25MB**，而我们的模型文件是 **168MB**，无法直接部署。

## 解决方案

将模型文件上传到外部 CDN，代码会自动从 CDN 加载。

## 方案 1: 使用 GitHub Releases（推荐）

### 步骤 1: 安装 GitHub CLI（如果还没有）

```bash
# macOS
brew install gh

# 或访问 https://cli.github.com/ 下载
```

### 步骤 2: 登录 GitHub CLI

```bash
gh auth login
```

### 步骤 3: 上传模型文件

```bash
# 运行上传脚本
./scripts/upload_model_to_github_release.sh
```

脚本会自动：
- 创建 GitHub Release `v1.0.0-model`
- 上传模型文件到 Release
- 提供 CDN URL

### 步骤 4: 验证

上传成功后，模型文件可以通过以下 URL 访问：
- jsDelivr CDN: `https://cdn.jsdelivr.net/gh/levindong/AI_Background_Remover@v1.0.0-model/public/models/rmbg-1.4.onnx`
- GitHub Releases: `https://github.com/levindong/AI_Background_Remover/releases/download/v1.0.0-model/rmbg-1.4.onnx`

## 方案 2: 手动上传到 GitHub Releases

1. 访问 https://github.com/levindong/AI_Background_Remover/releases
2. 点击 "Create a new release"
3. 填写信息：
   - Tag: `v1.0.0-model`
   - Title: `RMBG-1.4 Model File`
   - Description: `ONNX 格式的 RMBG-1.4 模型文件`
4. 将 `public/models/rmbg-1.4.onnx` 文件拖拽到 "Attach binaries" 区域
5. 点击 "Publish release"

## 方案 3: 使用 Cloudflare R2

如果你有 Cloudflare R2：

1. 创建 R2 Bucket
2. 上传模型文件到 R2
3. 配置公共访问
4. 更新 `public/rmbgWorker.js` 中的 `CDN_MODEL_URL`

## 方案 4: 使用其他 CDN

可以使用任何支持大文件存储的 CDN 服务：
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Blob Storage
- 其他 CDN 服务

上传后，更新 `public/rmbgWorker.js` 中的模型 URL。

## 当前配置

代码已配置为按以下顺序尝试加载模型：

1. **本地模型** (`/models/rmbg-1.4.onnx`) - 仅用于开发环境
2. **jsDelivr CDN** - 从 GitHub Releases 加载（推荐）
3. **GitHub Releases** - 直接下载（备用）

## 注意事项

- 模型文件大小：168MB
- 首次加载需要时间（取决于网络速度）
- 浏览器会自动缓存模型文件
- 确保 CDN 支持 CORS

## 验证部署

部署后，打开浏览器开发者工具：
1. 查看 Network 标签
2. 确认模型文件从 CDN 加载
3. 检查是否有 CORS 错误

