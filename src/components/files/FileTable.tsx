import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Trash2, ArrowUpDown, FileText } from 'lucide-react';
import { formatFileSize, getFileIcon } from '@/types/file';
import type { FileRecord } from '@/types/file';

interface FileTableProps {
  files: FileRecord[];
  onDownload: (file: FileRecord) => void;
  onDelete: (file: FileRecord) => void;
}

type SortField = 'name' | 'size' | 'created_at';
type SortOrder = 'asc' | 'desc';

export function FileTable({ files, onDownload, onDelete }: FileTableProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(files.map(f => f.id)));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const handleSelectFile = (fileId: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (checked) {
      newSelected.add(fileId);
    } else {
      newSelected.delete(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedFiles = [...files].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
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
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="w-12 p-3">
              <Checkbox
                checked={selectedFiles.size === files.length && files.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </th>
            <th className="text-left p-3">
              <Button
                variant="ghost"
                size="sm"
                className="font-medium"
                onClick={() => handleSort('name')}
              >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </th>
            <th className="text-left p-3">
              <Button
                variant="ghost"
                size="sm"
                className="font-medium"
                onClick={() => handleSort('size')}
              >
                Size
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </th>
            <th className="text-left p-3 hidden md:table-cell">Type</th>
            <th className="text-left p-3">
              <Button
                variant="ghost"
                size="sm"
                className="font-medium"
                onClick={() => handleSort('created_at')}
              >
                Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </th>
            <th className="text-right p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedFiles.map((file) => (
            <tr key={file.id} className="border-b hover:bg-gray-50">
              <td className="p-3">
                <Checkbox
                  checked={selectedFiles.has(file.id)}
                  onCheckedChange={(checked) => handleSelectFile(file.id, checked as boolean)}
                />
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getFileIcon(file.mime_type)}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" title={file.name}>
                      {file.name}
                    </p>
                  </div>
                </div>
              </td>
              <td className="p-3 text-sm text-gray-600">
                {formatFileSize(file.size)}
              </td>
              <td className="p-3 text-sm text-gray-600 hidden md:table-cell">
                {file.mime_type.split('/')[1] || 'unknown'}
              </td>
              <td className="p-3 text-sm text-gray-600">
                {formatDate(file.created_at)}
              </td>
              <td className="p-3">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownload(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => onDelete(file)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}