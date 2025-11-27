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
      {/* Top Navigation */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-mono text-gray-800">&lt; /&gt;</span>
            <span className="text-lg font-semibold text-gray-800">HTML.ZONE</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Share</a>
            <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800">
              Donate
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">
          AI Background Remover
        </h1>

        {/* Model Loading Indicator */}
        {isModelLoading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Loading AI Model... {modelLoadProgress > 0 && `${modelLoadProgress}%`}
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900">{modelError}</p>
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

        {/* Example Button and Model Info */}
        {fileHandler.files.length === 0 && !isProcessing && (
          <>
            <div className="text-center mb-4">
              <button className="px-6 py-2 border border-gray-300 bg-white text-gray-700 text-sm rounded hover:bg-gray-50">
                EXAMPLE
              </button>
            </div>
            <p className="text-center text-sm text-gray-600 mb-8">
              Model From <span className="font-semibold">RMBG-1.4</span>
            </p>
          </>
        )}

        {/* Privacy Statement */}
        {fileHandler.files.length === 0 && !isProcessing && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-12">
            <p className="text-sm text-gray-700">
              <strong className="text-gray-900">Privacy First:</strong> All image processing happens directly in your browser. Your images are never uploaded to any server, ensuring complete privacy and security of your data.
            </p>
          </div>
        )}

        {/* Processing Status */}
        {processedImages.length > 0 && (
          <div className="mb-12">
            <ProcessingList processedImages={processedImages} />
            <div className="mt-6 flex justify-center">
              <DownloadButton processedImages={processedImages} />
            </div>
          </div>
        )}

        {/* How to Use Section */}
        {fileHandler.files.length === 0 && !isProcessing && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              How to Use
            </h2>
            <ul className="space-y-2 text-sm text-gray-700 mb-8">
              <li>• Drag and drop your image into the upload area</li>
              <li>• Or click to select an image from your computer</li>
              <li>• Or paste your image directly (Ctrl+V / Cmd+V)</li>
              <li>• Wait for the AI model to process your image</li>
              <li>• Download the processed image with removed background</li>
            </ul>

            {/* FAQ Section */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">FAQ</h3>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  What image formats are supported?
                </h4>
                <p className="text-sm text-gray-600">
                  We support common image formats including JPG, PNG, WEBP, and AVIF.
                </p>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Why is the first processing slow?
                </h4>
                <p className="text-sm text-gray-600">
                  The first processing requires downloading and initializing the AI model in your browser. Subsequent processing will be much faster.
                </p>
              </div>

      <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Is there an image size limit?
                </h4>
                <p className="text-sm text-gray-600">
                  For optimal performance and browser stability, we recommend images under 10MB. Larger images may still work but could affect processing speed.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-mono text-gray-800">&lt; /&gt;</span>
              <span className="text-sm font-semibold text-gray-800">HTML.ZONE</span>
              <span className="text-sm text-gray-500 ml-4">© 2025 Web is Cool, Web is Best.</span>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                <a href="#" className="hover:text-gray-900">TempMail.Best</a>
                <a href="#" className="hover:text-gray-900">L(O*62).ONG</a>
                <a href="#" className="hover:text-gray-900">Sink.Cool</a>
                <a href="#" className="hover:text-gray-900">Beauty.Codes</a>
                <a href="#" className="hover:text-gray-900">DNS.Surf</a>
                <a href="#" className="hover:text-gray-900">Awesome Homelab</a>
              </div>
              
              <div className="flex items-center space-x-3">
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221c.313.082.586.262.787.513.201.25.312.56.312.886v8.76c0 .327-.111.636-.312.886-.201.25-.474.43-.787.513v.003H6.106c-.313-.082-.586-.262-.787-.513-.201-.25-.312-.56-.312-.886v-8.76c0-.327.111-.636.312-.886.201-.25.474-.43.787-.513V8.22zm-5.894 9.779c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 2h20v20H2V2zm9.5 17.5v-7H8v-2h3.5V6.5h3v4H17v2h-2.5v7h-3z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
        </a>
      </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
  );
}

export default App;
