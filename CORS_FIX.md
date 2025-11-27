# CORS 问题修复说明

## 问题

GitHub Releases 的下载链接不支持 CORS，导致浏览器无法直接加载模型文件。

## 解决方案

使用 CORS 代理服务 `allorigins.win` 来绕过 CORS 限制。

### 当前配置

```javascript
const CDN_MODEL_URL = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://github.com/levindong/AI_Background_Remover/releases/download/v1.0.0-model/rmbg-1.4.onnx');
```

## 生产环境建议

### 方案 1: 使用 Cloudflare R2（推荐）

1. 创建 Cloudflare R2 Bucket
2. 上传模型文件到 R2
3. 配置公共访问和 CORS
4. 更新代码中的模型 URL

### 方案 2: 使用自己的 CORS 代理

创建一个简单的 Cloudflare Worker 作为 CORS 代理：

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')
  
  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }
  
  const response = await fetch(targetUrl)
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  return newResponse
}
```

### 方案 3: 使用其他支持 CORS 的 CDN

- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Blob Storage

## 样式更新问题

如果页面样式没有改变：

1. **清除浏览器缓存**：
   - Chrome/Edge: Ctrl+Shift+Delete (Windows) 或 Cmd+Shift+Delete (Mac)
   - 选择"缓存的图片和文件"
   - 点击"清除数据"

2. **强制刷新**：
   - Windows: Ctrl+F5
   - Mac: Cmd+Shift+R

3. **检查 Cloudflare Pages 部署**：
   - 确认最新构建已成功
   - 检查构建日志中的 CSS 文件

4. **验证 CSS 文件**：
   - 打开浏览器开发者工具
   - 查看 Network 标签
   - 确认 CSS 文件已加载且是最新版本

