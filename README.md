# AI Background Remover

A privacy-first web application for removing backgrounds from images using AI. All processing happens directly in your browser - your images are never uploaded to any server.

## Features

- 🎯 **Privacy First**: All image processing happens in your browser
- 📁 **Batch Processing**: Support for drag-and-drop folders and multiple files
- 🚀 **Fast Processing**: Uses RMBG-1.4 model optimized for browser
- 📦 **ZIP Download**: Download all processed images as a single ZIP file
- 🎨 **Modern UI**: Clean and intuitive interface with dark mode support
- 📱 **Responsive**: Works on desktop and mobile devices

## Supported Image Formats

- JPEG/JPG
- PNG
- WEBP
- AVIF

## Technology Stack

- **Framework**: React + TypeScript + Vite
- **AI Model**: [RMBG-1.4](https://huggingface.co/briaai/RMBG-1.4) via [Transformers.js](https://github.com/xenova/transformers.js)
- **Styling**: Tailwind CSS
- **File Handling**: JSZip for batch downloads
- **Deployment**: Cloudflare Pages

## Development

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment

This project is configured for deployment on Cloudflare Pages:

1. Push code to the connected Git repository
2. Cloudflare Pages will automatically build and deploy
3. Build command: `npm run build`
4. Output directory: `dist`

## How It Works

1. **Model Loading**: On first use, the RMBG-1.4 model (~44MB) is downloaded and cached in your browser
2. **Image Processing**: Images are processed locally using WebAssembly/WebGPU
3. **Background Removal**: The AI model generates a mask and applies it to remove backgrounds
4. **Download**: Processed images are packaged into a ZIP file for download

## License

This project uses the RMBG-1.4 model which is available for non-commercial use under the [bria-rmbg-1.4 license](https://huggingface.co/briaai/RMBG-1.4). For commercial use, please contact [BRIA AI](https://bria.ai/).

## Privacy

- All processing happens locally in your browser
- No images are uploaded to any server
- No data is collected or stored
- Model files are cached locally for faster subsequent use

## Acknowledgments

- [BRIA AI](https://bria.ai/) for the RMBG-1.4 model
- [Transformers.js](https://github.com/xenova/transformers.js) for browser-based AI inference
- [Hugging Face](https://huggingface.co/) for hosting the model
