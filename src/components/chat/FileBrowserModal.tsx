import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, File, Image, FileText, FolderOpen } from 'lucide-react';
import { BucketSelector } from '@/components/storage/BucketSelector';
import { filesApi } from '@/lib/api';
import { formatBytes } from '@/lib/utils';
import type { ChatAttachment } from '@/types/chat';

interface StorageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  bucket_id: string;
  storage_key: string;
  created_at: string;
}

interface FileBrowserModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (attachments: ChatAttachment[]) => void;
  defaultBucketId?: string;
  multiple?: boolean;
}

export function FileBrowserModal({
  open,
  onClose,
  onSelect,
  defaultBucketId,
  multiple = true,
}: FileBrowserModalProps) {
  const [selectedBucket, setSelectedBucket] = useState(defaultBucketId || '');
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load files when bucket changes
  useEffect(() => {
    if (open && selectedBucket) {
      loadFiles();
    }
  }, [open, selectedBucket]);

  const loadFiles = async () => {
    if (!selectedBucket) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await filesApi.list({ bucket_id: selectedBucket });
      setFiles(response.files || []);
    } catch (err) {
      console.error('Failed to load files:', err);
      setError('Failed to load files from storage');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFileSelection = (fileId: string) => {
    if (!multiple) {
      // Single selection mode
      setSelectedFiles(new Set([fileId]));
    } else {
      // Multi-selection mode
      const newSelection = new Set(selectedFiles);
      if (newSelection.has(fileId)) {
        newSelection.delete(fileId);
      } else {
        newSelection.add(fileId);
      }
      setSelectedFiles(newSelection);
    }
  };

  const handleSelectFiles = () => {
    const selectedFileList = files.filter(f => selectedFiles.has(f.id));
    
    const attachments: ChatAttachment[] = selectedFileList.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      storage_file_id: file.id,
      bucket_id: file.bucket_id,
      storage_key: file.storage_key,
      is_storage_ref: true,
    } as ChatAttachment));
    
    onSelect(attachments);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFiles(new Set());
    setSearchQuery('');
    onClose();
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('text/') || type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Attach Files from Storage</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bucket Selector */}
          <BucketSelector
            value={selectedBucket}
            onChange={setSelectedBucket}
            label="Select Storage Bucket"
            description="Choose a bucket to browse files from"
          />

          {/* Search Bar */}
          {selectedBucket && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* File List */}
          {selectedBucket && (
            <ScrollArea className="h-[400px] border rounded-md p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>{error}</p>
                  <Button onClick={loadFiles} variant="ghost" size="sm" className="mt-2">
                    Retry
                  </Button>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No files found</p>
                  {searchQuery && (
                    <p className="text-sm mt-1">Try adjusting your search</p>
                  )}
                </div>
              ) : (
                <div className="grid gap-2">
                  {filteredFiles.map(file => (
                    <Card
                      key={file.id}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedFiles.has(file.id) 
                          ? 'bg-accent border-primary' 
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedFiles.has(file.id)}
                          onCheckedChange={() => toggleFileSelection(file.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {/* Selection Count */}
          {selectedFiles.size > 0 && (
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFiles(new Set())}
              >
                Clear selection
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSelectFiles}
            disabled={selectedFiles.size === 0}
          >
            Attach Selected ({selectedFiles.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}