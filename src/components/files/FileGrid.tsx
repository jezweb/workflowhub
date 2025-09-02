import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, FileText } from 'lucide-react';
import { formatFileSize, getFileIcon, getFileCategory } from '@/types/file';
import type { FileRecord } from '@/types/file';

interface FileGridProps {
  files: FileRecord[];
  onDownload: (file: FileRecord) => void;
  onDelete: (file: FileRecord) => void;
}

export function FileGrid({ files, onDownload, onDelete }: FileGridProps) {
  const getImageThumbnail = (file: FileRecord) => {
    const category = getFileCategory(file.mime_type);
    
    if (category === 'image' && file.url) {
      return (
        <div className="h-32 w-full bg-gray-100 rounded overflow-hidden">
          <img
            src={file.url}
            alt={file.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="flex items-center justify-center h-full text-4xl">${getFileIcon(file.mime_type)}</div>`;
              }
            }}
          />
        </div>
      );
    }

    return (
      <div className="h-32 w-full bg-gray-50 rounded flex items-center justify-center">
        <span className="text-5xl">{getFileIcon(file.mime_type)}</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <FileText className="h-12 w-12 mb-3" />
        <p className="text-lg font-medium">No files uploaded yet</p>
        <p className="text-sm">Upload your first file to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {files.map((file) => (
        <Card key={file.id} className="group hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            {getImageThumbnail(file)}
            
            <div className="p-3 space-y-2">
              <div>
                <p className="font-medium text-sm truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(file.created_at)}
                </p>
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onDownload(file)}
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 hover:text-red-700"
                  onClick={() => onDelete(file)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}