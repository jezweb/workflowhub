import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  TestTube, 
  Cloud, 
  HardDrive,
  Check,
  MessageSquare,
  FileText
} from 'lucide-react';
import type { StorageBucket } from '@/types/storage';

interface BucketListProps {
  buckets: StorageBucket[];
  onEdit: (bucket: StorageBucket) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
}

export function BucketList({ buckets, onEdit, onDelete, onTest }: BucketListProps) {
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'r2':
        return <Cloud className="h-4 w-4" />;
      case 's3':
        return <HardDrive className="h-4 w-4" />;
      default:
        return <HardDrive className="h-4 w-4" />;
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'r2':
        return 'Cloudflare R2';
      case 's3':
        return 'Amazon S3';
      default:
        return provider.toUpperCase();
    }
  };

  return (
    <div className="space-y-4">
      {buckets.map((bucket) => (
        <div
          key={bucket.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded">
              {getProviderIcon(bucket.provider)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{bucket.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {getProviderLabel(bucket.provider)}
                </Badge>
                {bucket.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    <Check className="mr-1 h-3 w-3" />
                    Default
                  </Badge>
                )}
                {bucket.is_default_chat && (
                  <Badge variant="secondary" className="text-xs">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    Chat
                  </Badge>
                )}
                {bucket.is_default_forms && (
                  <Badge variant="secondary" className="text-xs">
                    <FileText className="mr-1 h-3 w-3" />
                    Forms
                  </Badge>
                )}
              </div>
              {bucket.description && (
                <p className="text-sm text-muted-foreground">{bucket.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Created {new Date(bucket.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onTest(bucket.id)}
              title="Test Connection"
            >
              <TestTube className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(bucket)}
              title="Edit Bucket"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(bucket.id)}
              title="Delete Bucket"
              disabled={bucket.id === 'default-r2-bucket'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}