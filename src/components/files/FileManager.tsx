import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Grid3X3, 
  List, 
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { filesApi } from '@/lib/api';
import { DropZone } from './DropZone';
import { FileGrid } from './FileGrid';
import { FileTable } from './FileTable';
import { formatFileSize } from '@/types/file';
import type { FileRecord, ViewMode, FileUploadProgress } from '@/types/file';

export function FileManager() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [showDropZone, setShowDropZone] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await filesApi.list();
      setFiles(response.files || []);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load files',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {
    // Initialize upload progress
    const newProgress: FileUploadProgress[] = selectedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));
    setUploadProgress(newProgress);
    setShowDropZone(false);

    // Upload files
    try {
      const response = await filesApi.upload(selectedFiles);
      
      // Update progress to complete
      setUploadProgress(prev => prev.map(p => ({
        ...p,
        status: 'success',
        progress: 100
      })));

      // Show results
      const successCount = response.results.filter((r: any) => r.success).length;
      const failedCount = response.results.filter((r: any) => !r.success).length;

      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `Uploaded ${successCount} file${successCount > 1 ? 's' : ''}`,
        });
      }

      if (failedCount > 0) {
        const failedFiles = response.results
          .filter((r: any) => !r.success)
          .map((r: any) => `${r.name}: ${r.error}`)
          .join('\n');
        
        toast({
          title: 'Some files failed',
          description: failedFiles,
          variant: 'destructive',
        });
      }

      // Reload files list
      loadFiles();

      // Clear upload progress after 3 seconds
      setTimeout(() => setUploadProgress([]), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => prev.map(p => ({
        ...p,
        status: 'error',
        error: 'Upload failed'
      })));
      
      toast({
        title: 'Error',
        description: 'Failed to upload files',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (file: FileRecord) => {
    try {
      const link = document.createElement('a');
      link.href = `/api/files/${file.id}/download`;
      link.download = file.name;
      link.click();
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (file: FileRecord) => {
    if (!confirm(`Delete "${file.name}"?`)) return;

    try {
      await filesApi.delete(file.id);
      toast({
        title: 'Success',
        description: 'File deleted',
      });
      loadFiles();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  const calculateTotalSize = () => {
    return files.reduce((total, file) => total + file.size, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Files ({files.length} files, {formatFileSize(calculateTotalSize())})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setShowDropZone(!showDropZone)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Drop Zone */}
      {showDropZone && (
        <Card>
          <CardContent className="pt-6">
            <DropZone onFilesSelected={handleFilesSelected} />
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Uploading Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {uploadProgress.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                {item.status === 'pending' && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
                {item.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {item.status === 'success' && (
                  <FileText className="h-4 w-4 text-green-500" />
                )}
                {item.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.file.name}</p>
                  {item.error && (
                    <p className="text-xs text-red-500">{item.error}</p>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {formatFileSize(item.file.size)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* File Display */}
      {viewMode === 'grid' ? (
        <FileGrid 
          files={files}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      ) : (
        <FileTable
          files={files}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}