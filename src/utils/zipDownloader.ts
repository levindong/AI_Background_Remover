/**
 * ZIP download utilities
 */
import JSZip from 'jszip';

export interface FileToZip {
  name: string;
  blob: Blob;
}

/**
 * Create and download ZIP file from processed images
 */
export async function downloadAsZip(files: FileToZip[]): Promise<void> {
  const zip = new JSZip();
  
  // Add all files to zip
  files.forEach((file) => {
    zip.file(file.name, file.blob);
  });
  
  // Generate ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  
  // Create download link
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `background-removed-${Date.now()}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

