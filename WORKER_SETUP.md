# Cloudflare Worker CORS 代理设置

## 概述

由于 GitHub Releases 不支持 CORS，我们创建了一个 Cloudflare Worker 作为 CORS 代理。

## Worker 文件

- **位置**: `functions/cors-proxy.js`
- **功能**: 代理 GitHub Releases 的模型文件，添加 CORS 头

## 自动部署

Cloudflare Pages 会自动检测 `functions/` 目录中的 Worker 文件并部署。

## 验证部署

部署完成后，Worker 可以通过以下 URL 访问：
```
https://ai-background-remover-by9.pages.dev/cors-proxy?url=<encoded-url>
```

## 测试 Worker

可以使用以下命令测试 Worker：

```bash
curl "https://ai-background-remover-by9.pages.dev/cors-proxy?url=https://github.com/levindong/AI_Background_Remover/releases/download/v1.0.0-model/rmbg-1.4.onnx" -I
```

应该返回：
- `Access-Control-Allow-Origin: *`
- `Content-Type: application/octet-stream`
- `200 OK` 状态码

## 故障排除

如果 Worker 不工作：

1. **检查 Cloudflare Pages 设置**：
   - 确保 Functions 已启用
   - 检查部署日志中是否有 Worker 相关的错误

2. **检查 Worker 文件**：
   - 确保 `functions/cors-proxy.js` 存在
   - 确保文件语法正确

3. **手动测试**：
   - 访问 Worker URL 查看是否有错误
   - 检查浏览器控制台的网络请求

## 替代方案

如果 Worker 不可用，可以考虑：

1. **使用 Cloudflare R2**：
   - 上传模型文件到 R2
   - 配置公共访问和 CORS
   - 更新代码中的模型 URL

2. **使用其他 CDN**：
   - AWS S3 + CloudFront
   - Google Cloud Storage
   - Azure Blob Storage

3. **使用其他 CORS 代理服务**：
   - 注意：公共代理服务可能不稳定

