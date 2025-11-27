# WASM 文件加载问题修复

## 问题

1. **WASM 文件路径错误**：ONNX Runtime 尝试加载 `ort-wasm-simd-threaded.mjs`，但路径解析失败
2. **多线程要求**：多线程需要 `crossOriginIsolated` 模式，Cloudflare Pages 可能不支持
3. **MIME 类型错误**：服务器返回 `text/html` 而不是 JavaScript 模块

## 解决方案

### 1. 配置 WASM 文件路径

在 Worker 中配置 ONNX Runtime 从 CDN 加载 WASM 文件：

```javascript
// 配置 WASM 文件路径（从 CDN 加载）
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/';
```

### 2. 使用单线程版本

多线程需要 `crossOriginIsolated` headers，这在 Cloudflare Pages 上可能不可用。使用单线程版本更稳定：

```javascript
ort.env.wasm.numThreads = 1; // 使用单线程（避免 crossOriginIsolated 要求）
ort.env.wasm.simd = true; // 启用 SIMD 加速
```

### 3. 更新 ONNX Runtime 版本

使用最新版本（1.23.2）以获得更好的兼容性：

```javascript
importScripts('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/ort.min.js');
```

## 修复内容

- ✅ 配置 WASM 文件从 CDN 加载
- ✅ 使用单线程版本（避免 crossOriginIsolated 要求）
- ✅ 更新 ONNX Runtime 到 1.23.2
- ✅ 修复模型 URL 配置

## 性能影响

使用单线程版本的性能影响：
- **处理速度**：可能比多线程慢 20-30%
- **稳定性**：更稳定，兼容性更好
- **内存使用**：略低

对于大多数用例，单线程版本已经足够快。

## 如果仍需要多线程

如果确实需要多线程性能，需要：

1. **配置 Cloudflare Pages Headers**：
   ```
   Cross-Origin-Embedder-Policy: require-corp
   Cross-Origin-Opener-Policy: same-origin
   ```

2. **更新代码**：
   ```javascript
   ort.env.wasm.numThreads = 2; // 或更多
   ```

3. **使用多线程 WASM 文件**：
   ```javascript
   ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/';
   ```

## 验证

部署后，检查浏览器控制台：
- ✅ 没有 WASM 文件加载错误
- ✅ 模型可以正常加载
- ✅ 背景去除功能正常工作

