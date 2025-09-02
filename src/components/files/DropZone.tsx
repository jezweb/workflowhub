import { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateFileSize, formatFileSize, DEFAULT_MAX_FILE_SIZE } from '@/types/file';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFileSize?: number;
  disabled?: boolean;
}

export function DropZone({ 
  onFilesSelected, 
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  disabled = false 
}: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [rejectedFiles, setRejectedFiles] = useState<Array<{ name: string; error: string }>>([]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || disabled) return;

    const validFiles: File[] = [];
    const rejected: Array<{ name: string; error: string }> = [];

    Array.from(fileList).forEach(file => {
      const validation = validateFileSize(file, maxFileSize);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        rejected.push({ name: file.name, error: validation.error || 'Invalid file' });
      }
    });

    setRejectedFiles(rejected);
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }

    // Clear rejected files after 5 seconds
    if (rejected.length > 0) {
      setTimeout(() => setRejectedFiles([]), 5000);
    }
  }, [onFilesSelected, maxFileSize, disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  }, [processFiles]);

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragActive && "border-blue-500 bg-blue-50",
          !isDragActive && "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
          disabled={disabled}
        />
        
        <label
          htmlFor="file-input"
          className={cn(
            "flex flex-col items-center justify-center cursor-pointer",
            disabled && "cursor-not-allowed"
          )}
        >
          <Upload className="h-12 w-12 text-gray-400 mb-3" />
          <p className="text-lg font-medium text-gray-700">
            {isDragActive ? 'Drop files here' : 'Drop files here or click to upload'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Maximum file size: {formatFileSize(maxFileSize)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Multiple files supported
          </p>
        </label>
      </div>

      {rejectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {rejectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{file.name}</p>
                <p className="text-xs text-red-600">{file.error}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}