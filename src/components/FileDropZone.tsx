import type { ImageFile } from '../hooks/useFileHandler';

interface FileDropZoneProps {
  files: ImageFile[];
  isDragging: boolean;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (id: string) => void;
}

export function FileDropZone({
  files,
  isDragging,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileSelect,
  onRemoveFile,
}: FileDropZoneProps) {
  return (
    <div className="w-full">
      <div
        className={`
          border-2 border-dashed rounded-lg p-16 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
          }
        `}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          type="file"
          id="file-input"
          className="hidden"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
          onChange={onFileSelect}
        />
        <label htmlFor="file-input" className="cursor-pointer block">
          <div className="space-y-4">
            {/* Cloud Upload Icon */}
            <div className="mx-auto w-20 h-20 flex items-center justify-center">
              <svg
                className="w-full h-full text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-base font-medium text-gray-700">
                Click to Pick
              </p>
              <p className="text-sm text-gray-600">
                Paste Image or Drag and Drop
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, WEBP, AVIF, ...
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Selected Files Preview */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Selected Files ({files.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white"
              >
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="w-full h-32 object-cover"
                />
                <button
                  onClick={() => onRemoveFile(file.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  aria-label="Remove file"
                >
                  <svg
                    className="w-3 h-3"
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
                </button>
                <p className="p-2 text-xs text-gray-600 truncate bg-gray-50">
                  {file.file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
