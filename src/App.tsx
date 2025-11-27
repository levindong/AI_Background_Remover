import { useEffect } from 'react';
import { FileDropZone } from './components/FileDropZone';
import { ProcessingList } from './components/ProcessingList';
import { DownloadButton } from './components/DownloadButton';
import { useBackgroundRemover } from './hooks/useBackgroundRemover';
import { useFileHandler } from './hooks/useFileHandler';

function App() {
  const fileHandler = useFileHandler();
  const {
    isModelLoading,
    modelLoadProgress,
    isProcessing,
    processedImages,
    modelError,
    loadModel,
    processAllImages,
  } = useBackgroundRemover();

  // Load model on mount
  useEffect(() => {
    loadModel().catch((error) => {
      console.error('Failed to load model:', error);
    });
  }, [loadModel]);

  // Process images when files are selected
  useEffect(() => {
    if (
      fileHandler.files.length > 0 &&
      !isProcessing &&
      processedImages.length === 0
    ) {
      processAllImages(fileHandler.files);
    }
  }, [
    fileHandler.files,
    isProcessing,
    processedImages.length,
    processAllImages,
  ]);

  // Clean up preview URLs when files are removed
  useEffect(() => {
    return () => {
      fileHandler.files.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [fileHandler.files]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            AI Background Remover
          </h1>
          <p className="text-sm text-gray-600 mb-2">
            Model From <span className="font-semibold">RMBG-1.4</span>
          </p>
          <p className="text-sm text-gray-500">
            <strong>Privacy First:</strong> All image processing happens directly in your browser. Your images are never uploaded to any server, ensuring complete privacy and security of your data.
          </p>
        </header>

        {/* Model Loading Indicator */}
        {isModelLoading && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Loading AI Model...
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  First time loading may take a moment. The model will be cached for future use.
                </p>
                {modelLoadProgress > 0 && (
                  <div className="mt-2 w-full bg-blue-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${modelLoadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Model Error Display */}
        {modelError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 mb-2">
                  Model Loading Error
                </p>
                <p className="text-xs text-red-700 whitespace-pre-line">
                  {modelError}
                </p>
                <p className="text-xs text-red-600 mt-3">
                  <strong>Note:</strong> Transformers.js currently does not support the SegformerForSemanticSegmentation 
                  architecture used by RMBG-1.4. Consider using ONNX Runtime Web with ONNX model files, 
                  or use an alternative background removal service.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* File Drop Zone */}
        <div className="mb-8">
          <FileDropZone
            files={fileHandler.files}
            isDragging={fileHandler.isDragging}
            onDrop={fileHandler.handleDrop}
            onDragOver={fileHandler.handleDragOver}
            onDragLeave={fileHandler.handleDragLeave}
            onFileSelect={fileHandler.handleFileSelect}
            onRemoveFile={fileHandler.removeFile}
          />
        </div>

        {/* Processing Status */}
        {processedImages.length > 0 && (
          <div className="mb-8">
            <ProcessingList processedImages={processedImages} />
            <div className="mt-6 flex justify-center">
              <DownloadButton processedImages={processedImages} />
            </div>
          </div>
        )}

        {/* Instructions */}
        {fileHandler.files.length === 0 && !isProcessing && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              How to Use
            </h2>
            <ul className="space-y-2 text-sm text-gray-700 mb-6">
              <li>• Drag and drop your image into the upload area</li>
              <li>• Or click to select an image from your computer</li>
              <li>• Or paste your image directly (Ctrl+V / Cmd+V)</li>
              <li>• Wait for the AI model to process your image</li>
              <li>• Download the processed image with removed background</li>
            </ul>

            <div className="border-t pt-6">
              <h3 className="text-md font-semibold text-gray-900 mb-3">FAQ</h3>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  What image formats are supported?
                </h4>
                <p className="text-sm text-gray-600">
                  We support common image formats including JPG, PNG, WEBP, and AVIF.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  Why is the first processing slow?
                </h4>
                <p className="text-sm text-gray-600">
                  The first processing requires downloading and initializing the AI model in your browser. Subsequent processing will be much faster.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  Is there an image size limit?
                </h4>
                <p className="text-sm text-gray-600">
                  For optimal performance and browser stability, we recommend images under 10MB. Larger images may still work but could affect processing speed.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
