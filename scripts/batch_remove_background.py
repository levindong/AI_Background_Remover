#!/usr/bin/env python3
"""
批量图片背景去除工具
使用 RMBG-1.4 模型批量处理本地图片

使用方法:
    python batch_remove_background.py <输入目录> [输出目录]
    
示例:
    python batch_remove_background.py ./images ./output
    python batch_remove_background.py ./images  # 输出到 ./images_no_bg
"""

import os
import sys
import argparse
from pathlib import Path
from PIL import Image
import torch
import torch.nn.functional as F
from torchvision.transforms.functional import normalize
from transformers import AutoModelForImageSegmentation
import numpy as np
from tqdm import tqdm

# 支持的图片格式
SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.webp', '.avif'}

def preprocess_image(im: np.ndarray, model_input_size: list) -> torch.Tensor:
    """预处理图片为模型输入格式"""
    if len(im.shape) < 3:
        im = im[:, :, np.newaxis]
    
    # 转换为 tensor 并调整维度 [H, W, C] -> [C, H, W]
    im_tensor = torch.tensor(im, dtype=torch.float32).permute(2, 0, 1)
    
    # 添加 batch 维度并调整大小
    im_tensor = torch.unsqueeze(im_tensor, 0)
    im_tensor = F.interpolate(im_tensor, size=model_input_size, mode='bilinear', align_corners=False)
    
    # 归一化到 [0, 1]
    image = torch.divide(im_tensor, 255.0)
    
    # 标准化: (x - 0.5) / 0.5 = (x - 0.5) * 2
    image = normalize(image, [0.5, 0.5, 0.5], [1.0, 1.0, 1.0])
    
    return image

def postprocess_image(result: torch.Tensor, im_size: list) -> np.ndarray:
    """后处理模型输出为图片格式"""
    # 调整回原始尺寸
    result = torch.squeeze(F.interpolate(result, size=im_size, mode='bilinear', align_corners=False), 0)
    
    # 归一化到 [0, 1]
    ma = torch.max(result)
    mi = torch.min(result)
    result = (result - mi) / (ma - mi)
    
    # 转换为 numpy array [C, H, W] -> [H, W, C]
    im_array = (result * 255).permute(1, 2, 0).cpu().data.numpy().astype(np.uint8)
    im_array = np.squeeze(im_array)
    
    return im_array

def remove_background(image_path: Path, model, device, output_path: Path):
    """处理单张图片"""
    try:
        # 读取图片
        orig_im = np.array(Image.open(image_path).convert('RGB'))
        orig_im_size = orig_im.shape[0:2]
        model_input_size = [1024, 1024]
        
        # 预处理
        image = preprocess_image(orig_im, model_input_size).to(device)
        
        # 推理
        with torch.no_grad():
            result = model(image)
        
        # 后处理
        result_image = postprocess_image(result[0][0], orig_im_size)
        
        # 创建掩码
        mask = Image.fromarray(result_image).convert('L')
        
        # 应用掩码到原图
        orig_image = Image.open(image_path).convert('RGBA')
        no_bg_image = orig_image.copy()
        no_bg_image.putalpha(mask)
        
        # 保存结果
        output_path.parent.mkdir(parents=True, exist_ok=True)
        no_bg_image.save(output_path, 'PNG')
        
        return True
    except Exception as e:
        print(f"处理 {image_path} 时出错: {e}")
        return False

def get_image_files(input_dir: Path):
    """获取目录下所有支持的图片文件"""
    image_files = []
    for ext in SUPPORTED_FORMATS:
        image_files.extend(input_dir.rglob(f'*{ext}'))
        image_files.extend(input_dir.rglob(f'*{ext.upper()}'))
    return sorted(image_files)

def batch_process(input_dir: Path, output_dir: Path, model, device):
    """批量处理图片"""
    # 获取所有图片文件
    image_files = get_image_files(input_dir)
    
    if not image_files:
        print(f"在 {input_dir} 中未找到支持的图片文件")
        return
    
    print(f"找到 {len(image_files)} 张图片")
    print(f"输出目录: {output_dir}")
    print(f"开始处理...")
    
    # 加载模型
    print("正在加载模型...")
    model.eval()
    model.to(device)
    
    # 处理每张图片
    success_count = 0
    failed_count = 0
    
    for image_path in tqdm(image_files, desc="处理进度"):
        # 计算相对路径以保持目录结构
        try:
            relative_path = image_path.relative_to(input_dir)
            output_path = output_dir / relative_path.with_suffix('.png')
            
            if remove_background(image_path, model, device, output_path):
                success_count += 1
            else:
                failed_count += 1
        except Exception as e:
            print(f"处理 {image_path} 时出错: {e}")
            failed_count += 1
    
    print(f"\n处理完成!")
    print(f"成功: {success_count} 张")
    print(f"失败: {failed_count} 张")

def main():
    parser = argparse.ArgumentParser(
        description='使用 RMBG-1.4 模型批量去除图片背景',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 处理单个目录，输出到 ./output
  python batch_remove_background.py ./images ./output
  
  # 处理单个目录，输出到默认位置（输入目录_no_bg）
  python batch_remove_background.py ./images
  
  # 处理当前目录
  python batch_remove_background.py .
        """
    )
    
    parser.add_argument(
        'input_dir',
        type=str,
        help='输入图片目录路径'
    )
    
    parser.add_argument(
        'output_dir',
        type=str,
        nargs='?',
        default=None,
        help='输出目录路径（默认为输入目录_no_bg）'
    )
    
    parser.add_argument(
        '--device',
        type=str,
        default='auto',
        choices=['auto', 'cuda', 'cpu'],
        help='使用的设备 (默认: auto，自动选择)'
    )
    
    args = parser.parse_args()
    
    # 解析输入目录
    input_dir = Path(args.input_dir).resolve()
    if not input_dir.exists():
        print(f"错误: 输入目录不存在: {input_dir}")
        sys.exit(1)
    
    if not input_dir.is_dir():
        print(f"错误: 输入路径不是目录: {input_dir}")
        sys.exit(1)
    
    # 解析输出目录
    if args.output_dir:
        output_dir = Path(args.output_dir).resolve()
    else:
        output_dir = input_dir.parent / f"{input_dir.name}_no_bg"
    
    # 选择设备
    if args.device == 'auto':
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    else:
        device = torch.device(args.device)
    
    print(f"使用设备: {device}")
    if device.type == 'cuda':
        print(f"GPU: {torch.cuda.get_device_name(0)}")
    
    # 加载模型
    print("正在加载 RMBG-1.4 模型...")
    try:
        model = AutoModelForImageSegmentation.from_pretrained(
            'briaai/RMBG-1.4',
            trust_remote_code=True
        )
        print("模型加载成功!")
    except Exception as e:
        print(f"模型加载失败: {e}")
        print("\n请确保已安装必要的依赖:")
        print("  pip install torch torchvision transformers pillow numpy tqdm")
        sys.exit(1)
    
    # 批量处理
    batch_process(input_dir, output_dir, model, device)

if __name__ == '__main__':
    main()

