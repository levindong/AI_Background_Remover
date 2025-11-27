import type { ProcessedImage } from '../hooks/useBackgroundRemover';

interface ProcessingListProps {
  processedImages: ProcessedImage[];
}

export function ProcessingList({ processedImages }: ProcessingListProps) {
  if (processedImages.length === 0) {
    return null;
  }

  const completedCount = processedImages.filter(
    (img) => img.status === 'completed'
  ).length;
  const processingCount = processedImages.filter(
    (img) => img.status === 'processing'
  ).length;
  const errorCount = processedImages.filter(
    (img) => img.status === 'error'
  ).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Processing Status
        </h3>
        <p className="text-sm text-gray-600">
          Completed: <span className="font-medium text-green-600">{completedCount}</span> | 
          Processing: <span className="font-medium text-blue-600">{processingCount}</span> | 
          Errors: <span className="font-medium text-red-600">{errorCount}</span>
        </p>
      </div>

      <div className="space-y-2">
        {processedImages.map((img) => (
          <div
            key={img.id}
            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-white"
          >
            <div className="flex-shrink-0">
              {img.status === 'pending' && (
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              )}
              {img.status === 'processing' && (
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              )}
              {img.status === 'completed' && (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
              {img.status === 'error' && (
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {img.file.name}
              </p>
              {img.status === 'error' && img.error && (
                <p className="text-xs text-red-600 mt-1">{img.error}</p>
              )}
            </div>

            <div className="flex-shrink-0">
              {img.status === 'pending' && (
                <span className="text-xs text-gray-500">Pending</span>
              )}
              {img.status === 'processing' && (
                <span className="text-xs text-blue-600 font-medium">Processing...</span>
              )}
              {img.status === 'completed' && (
                <span className="text-xs text-green-600 font-medium">Completed</span>
              )}
              {img.status === 'error' && (
                <span className="text-xs text-red-600 font-medium">Error</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
