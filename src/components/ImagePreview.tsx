import type { ProcessedImage } from '../hooks/useBackgroundRemover';

interface ImagePreviewProps {
  processedImage: ProcessedImage;
}

export function ImagePreview({ processedImage }: ImagePreviewProps) {
  if (processedImage.status !== 'completed') {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Original
        </h4>
        <img
          src={processedImage.preview}
          alt="Original"
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
        />
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Background Removed
        </h4>
        {processedImage.processedPreview && (
          <img
            src={processedImage.processedPreview}
            alt="Processed"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
          />
        )}
      </div>
    </div>
  );
}

