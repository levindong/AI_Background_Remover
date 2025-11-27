#!/bin/bash
# 将模型文件上传到 GitHub Releases
# 使用方法: ./scripts/upload_model_to_github_release.sh

set -e

MODEL_FILE="public/models/rmbg-1.4.onnx"
REPO="levindong/AI_Background_Remover"
TAG="v1.0.0-model"

if [ ! -f "$MODEL_FILE" ]; then
    echo "❌ 模型文件不存在: $MODEL_FILE"
    echo "请先运行: python3 scripts/convert_rmbg_to_onnx.py $MODEL_FILE"
    exit 1
fi

echo "📦 准备上传模型文件到 GitHub Releases..."
echo "文件: $MODEL_FILE"
echo "仓库: $REPO"
echo "标签: $TAG"
echo ""

# 检查是否已安装 gh CLI
if ! command -v gh &> /dev/null; then
    echo "❌ 未安装 GitHub CLI (gh)"
    echo "请安装: brew install gh 或访问 https://cli.github.com/"
    exit 1
fi

# 检查是否已登录
if ! gh auth status &> /dev/null; then
    echo "❌ 未登录 GitHub CLI"
    echo "请运行: gh auth login"
    exit 1
fi

# 创建 release（如果不存在）
if ! gh release view "$TAG" --repo "$REPO" &> /dev/null; then
    echo "📝 创建新的 Release: $TAG"
    gh release create "$TAG" \
        --repo "$REPO" \
        --title "RMBG-1.4 Model File" \
        --notes "ONNX 格式的 RMBG-1.4 模型文件 (168MB)

使用方法:
1. 下载模型文件
2. 将文件放在项目的 public/models/ 目录（仅用于本地开发）
3. 生产环境会自动从 GitHub Releases CDN 加载

CDN URL: https://github.com/$REPO/releases/download/$TAG/rmbg-1.4.onnx"
else
    echo "✅ Release 已存在: $TAG"
fi

# 上传模型文件
echo "⬆️  上传模型文件..."
gh release upload "$TAG" "$MODEL_FILE" \
    --repo "$REPO" \
    --clobber

echo ""
echo "✅ 模型文件已上传到 GitHub Releases!"
echo ""
echo "📋 下一步:"
echo "1. 更新 public/rmbgWorker.js 中的模型 URL"
echo "2. 使用以下 CDN URL:"
echo "   https://github.com/$REPO/releases/download/$TAG/rmbg-1.4.onnx"
echo ""
echo "或者使用 jsDelivr CDN (更快):"
echo "   https://cdn.jsdelivr.net/gh/$REPO@$TAG/public/models/rmbg-1.4.onnx"

