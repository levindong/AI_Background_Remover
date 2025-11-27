#!/usr/bin/env python3
"""
将 RMBG-1.4 PyTorch 模型转换为 ONNX 格式
用于浏览器端部署

使用方法:
    python convert_rmbg_to_onnx.py [输出路径]
    
示例:
    python convert_rmbg_to_onnx.py
    python convert_rmbg_to_onnx.py ../public/models/rmbg-1.4.onnx
"""

import os
import sys
import torch
from transformers import AutoModelForImageSegmentation

def convert_to_onnx(output_path: str = "rmbg-1.4.onnx"):
    """
    将 RMBG-1.4 模型转换为 ONNX 格式
    
    Args:
        output_path: 输出 ONNX 模型文件路径
    """
    print("=" * 60)
    print("RMBG-1.4 模型转换工具")
    print("=" * 60)
    
    print("\n📥 正在从 Hugging Face 下载模型...")
    print("   这可能需要几分钟，取决于网络速度...")
    
    try:
        # 加载模型
        model = AutoModelForImageSegmentation.from_pretrained(
            'briaai/RMBG-1.4',
            trust_remote_code=True
        )
        model.eval()
        print("✅ 模型加载成功！")
    except Exception as e:
        print(f"❌ 模型加载失败: {e}")
        print("\n提示:")
        print("1. 确保已安装 transformers: pip install transformers")
        print("2. 确保网络连接正常")
        print("3. 如果下载失败，可以手动下载模型文件")
        sys.exit(1)
    
    print("\n🔄 正在转换为 ONNX 格式...")
    
    # 创建示例输入 [batch, channels, height, width]
    # RMBG-1.4 输入尺寸为 1024x1024
    dummy_input = torch.randn(1, 3, 1024, 1024)
    
    try:
        # 导出为 ONNX
        torch.onnx.export(
            model,
            dummy_input,
            output_path,
            input_names=['input'],
            output_names=['output'],
            opset_version=14,  # 使用 opset 14 以获得更好的浏览器兼容性
            dynamic_axes={
                'input': {0: 'batch_size'},
                'output': {0: 'batch_size'}
            },
            do_constant_folding=True,
            export_params=True,
            verbose=False
        )
        
        # 检查文件大小
        file_size = os.path.getsize(output_path) / 1024 / 1024
        print(f"✅ 转换完成！")
        print(f"📦 模型文件: {output_path}")
        print(f"📊 文件大小: {file_size:.2f} MB")
        
        # 验证文件
        if file_size < 10:
            print("⚠️  警告: 模型文件似乎太小，可能转换失败")
        elif file_size > 200:
            print("⚠️  警告: 模型文件似乎太大，可能包含不必要的权重")
        else:
            print("✅ 文件大小正常")
        
        print("\n📋 下一步:")
        print(f"1. 将模型文件移动到 public/models/ 目录:")
        print(f"   mkdir -p public/models")
        print(f"   mv {output_path} public/models/rmbg-1.4.onnx")
        print("2. 更新 public/rmbgWorker.js 中的 MODEL_URL:")
        print("   const MODEL_URL = '/models/rmbg-1.4.onnx';")
        
    except Exception as e:
        print(f"❌ 转换失败: {e}")
        print("\n提示:")
        print("1. 确保已安装 onnx: pip install onnx")
        print("2. 确保有足够的磁盘空间")
        print("3. 检查 PyTorch 版本兼容性")
        sys.exit(1)

def main():
    """主函数"""
    if len(sys.argv) > 1:
        output_path = sys.argv[1]
    else:
        output_path = "rmbg-1.4.onnx"
    
    # 确保输出目录存在
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
        print(f"📁 创建输出目录: {output_dir}")
    
    convert_to_onnx(output_path)

if __name__ == "__main__":
    main()

