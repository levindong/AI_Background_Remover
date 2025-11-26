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
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
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
        <label htmlFor="file-input" className="cursor-pointer">
          <div className="space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {isDragging ? 'Drop images here' : 'Drag and drop images here'}
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                or click to select files
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Supports JPG, PNG, WEBP, AVIF
              </p>
            </div>
          </div>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected Files ({files.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="w-full h-32 object-cover"
                />
                <button
                  onClick={() => onRemoveFile(file.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove file"
                >
                  <svg
                    className="w-4 h-4"
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
                <p className="p-2 text-xs text-gray-600 dark:text-gray-400 truncate">
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
