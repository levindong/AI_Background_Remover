import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 自定义插件：排除大型模型文件从构建输出
    {
      name: 'exclude-model-files',
      closeBundle() {
        // 构建完成后，删除 dist/models 目录中的 .onnx 文件
        const distModelsDir = join(process.cwd(), 'dist', 'models')
        if (existsSync(distModelsDir)) {
          const modelFile = join(distModelsDir, 'rmbg-1.4.onnx')
          if (existsSync(modelFile)) {
            // 删除模型文件（模型从外部 CDN 加载）
            unlinkSync(modelFile)
            console.log('✓ Removed large model file from dist (loaded from CDN)')
          }
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'onnx': ['onnxruntime-web'],
        },
      },
    },
    // 排除大型模型文件
    copyPublicDir: true,
  },
  publicDir: 'public',
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
  worker: {
    format: 'es',
  },
})
