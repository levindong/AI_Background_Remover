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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            AI Background Remover
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Remove backgrounds from your images using AI - all processing
            happens in your browser
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Privacy First: Your images are never uploaded to any server
          </p>
        </header>

        {/* Model Loading Indicator */}
        {isModelLoading && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Loading AI Model...
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  First time loading may take a moment. The model will be cached
                  for future use.
                </p>
                {modelLoadProgress > 0 && (
                  <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${modelLoadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* File Drop Zone */}
        <div className="mb-6">
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
          <>
            <ProcessingList processedImages={processedImages} />
            <div className="mt-6 flex justify-center">
              <DownloadButton processedImages={processedImages} />
            </div>
          </>
        )}

        {/* Instructions */}
        {fileHandler.files.length === 0 && !isProcessing && (
          <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              How to Use
            </h2>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Drag and drop your image files or folders into the upload area
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Or click to select files from your computer</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Wait for the AI model to process your images</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Download all processed images as a ZIP file</span>
              </li>
            </ul>
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> The first processing requires downloading
                and initializing the AI model (~44MB). Subsequent processing will
                be much faster as the model is cached in your browser.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
