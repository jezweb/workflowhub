export interface FileRecord {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  r2_key: string;
  folder_path?: string;
  uploaded_by: string;
  created_at: string;
  url?: string; // Signed URL for access
}

export interface FileUploadConfig {
  maxFileSize: number; // Default 4MB for AutoRAG
  allowedTypes?: string[];
}

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export type ViewMode = 'grid' | 'table';

export const DEFAULT_MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

export const FILE_TYPE_ICONS: Record<string, string> = {
  // Images
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'image/webp': '🖼️',
  'image/svg+xml': '🎨',
  
  // Documents
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'text/plain': '📃',
  'text/markdown': '📋',
  
  // Spreadsheets
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'text/csv': '📊',
  
  // Code
  'text/javascript': '💻',
  'application/javascript': '💻',
  'text/typescript': '💻',
  'application/json': '📦',
  'text/html': '🌐',
  'text/css': '🎨',
  
  // Archives
  'application/zip': '📦',
  'application/x-zip-compressed': '📦',
  'application/x-tar': '📦',
  'application/gzip': '📦',
  
  // Default
  'default': '📎'
};

export function getFileIcon(mimeType: string): string {
  return FILE_TYPE_ICONS[mimeType] || FILE_TYPE_ICONS.default;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
  if (mimeType.startsWith('text/')) return 'text';
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gz')) return 'archive';
  return 'other';
}

export function validateFileSize(file: File, maxSize: number = DEFAULT_MAX_FILE_SIZE): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds ${formatFileSize(maxSize)} limit. Consider compressing or converting to PDF.`
    };
  }
  return { valid: true };
}

export function generateR2Key(filename: string, userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${timestamp}-${random}-${safeName}`;
}