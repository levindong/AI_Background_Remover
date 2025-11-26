import { useState, useCallback } from 'react';

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Check if file is a supported image format
 */
function isSupportedImage(file: File): boolean {
  return SUPPORTED_FORMATS.includes(file.type.toLowerCase());
}

/**
 * Recursively read directory entries to get all files
 */
async function readDirectoryEntries(
  directoryEntry: FileSystemDirectoryEntry
): Promise<File[]> {
  return new Promise((resolve, reject) => {
    const reader = directoryEntry.createReader();
    const entries: FileSystemEntry[] = [];
    
    const readEntries = () => {
      reader.readEntries((results) => {
        if (results.length === 0) {
          // Process all entries
          Promise.all(
            entries.map(async (entry) => {
              if (entry.isFile) {
                return new Promise<File | null>((resolveFile, rejectFile) => {
                  (entry as FileSystemFileEntry).file(
                    (file) => {
                      if (isSupportedImage(file)) {
                        resolveFile(file);
                      } else {
                        resolveFile(null);
                      }
                    },
                    rejectFile
                  );
                });
              } else if (entry.isDirectory) {
                const dirFiles = await readDirectoryEntries(
                  entry as FileSystemDirectoryEntry
                );
                return dirFiles;
              }
              return [] as File[];
            })
          ).then((results) => {
            const allFiles = results.flat().filter((f): f is File => f !== null);
            resolve(allFiles);
          });
        } else {
          entries.push(...results);
          readEntries();
        }
      }, reject);
    };
    
    readEntries();
  });
}

/**
 * Hook for handling file selection and drag-drop
 */
export function useFileHandler() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback((newFiles: File[]) => {
    const imageFiles: ImageFile[] = newFiles
      .filter(isSupportedImage)
      .map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}`,
        file,
        preview: URL.createObjectURL(file),
      }));
    
    setFiles((prev) => [...prev, ...imageFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.preview));
      return [];
    });
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const items = Array.from(e.dataTransfer.items);
      const filesToProcess: File[] = [];

      for (const item of items) {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          
          if (entry) {
            if (entry.isFile) {
              const file = await new Promise<File>((resolve, reject) => {
                (entry as FileSystemFileEntry).file(resolve, reject);
              });
              if (isSupportedImage(file)) {
                filesToProcess.push(file);
              }
            } else if (entry.isDirectory) {
              const dirFiles = await readDirectoryEntries(
                entry as FileSystemDirectoryEntry
              );
              filesToProcess.push(...dirFiles);
            }
          }
        }
      }

      // Also check dataTransfer.files for direct file drops
      const directFiles = Array.from(e.dataTransfer.files).filter(
        isSupportedImage
      );
      filesToProcess.push(...directFiles);

      if (filesToProcess.length > 0) {
        addFiles(filesToProcess);
      }
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        addFiles(selectedFiles);
      }
      // Reset input to allow selecting same file again
      e.target.value = '';
    },
    [addFiles]
  );

  return {
    files,
    isDragging,
    addFiles,
    removeFile,
    clearFiles,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileSelect,
  };
}

