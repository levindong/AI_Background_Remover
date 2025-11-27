import { downloadAsZip } from '../utils/zipDownloader';
import type { ProcessedImage } from '../hooks/useBackgroundRemover';

interface DownloadButtonProps {
  processedImages: ProcessedImage[];
}

export function DownloadButton({ processedImages }: DownloadButtonProps) {
  const completedImages = processedImages.filter(
    (img) => img.status === 'completed' && img.processedBlob
  );

  const handleDownload = async () => {
    if (completedImages.length === 0) return;

    const filesToZip = completedImages.map((img) => ({
      name: img.file.name.replace(/\.[^/.]+$/, '') + '_no_bg.png',
      blob: img.processedBlob!,
    }));

    await downloadAsZip(filesToZip);
  };

  if (completedImages.length === 0) {
    return null;
  }

  return (
    <button
      onClick={handleDownload}
      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Download All ({completedImages.length} images) as ZIP
    </button>
  );
}
