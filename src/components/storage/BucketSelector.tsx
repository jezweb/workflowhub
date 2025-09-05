import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { HardDrive, Cloud, Loader2, AlertCircle } from 'lucide-react';
import { storageApi } from '@/lib/api';
import type { StorageBucket } from '@/types/storage';

interface BucketSelectorProps {
  value?: string;
  onChange: (bucketId: string) => void;
  context?: 'general' | 'chat' | 'forms';
  label?: string;
  description?: string;
  className?: string;
  showDefault?: boolean;
}

export function BucketSelector({
  value,
  onChange,
  context = 'general',
  label = 'Storage Bucket',
  description,
  className = '',
  showDefault = true,
}: BucketSelectorProps) {
  const [buckets, setBuckets] = useState<StorageBucket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<{
    general?: string;
    chat?: string;
    forms?: string;
  }>({});

  useEffect(() => {
    loadBuckets();
    if (showDefault) {
      loadDefaults();
    }
  }, [showDefault]);

  const loadBuckets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await storageApi.listBuckets();
      console.log('Loaded buckets:', response);
      setBuckets(response.buckets || []);
    } catch (err) {
      console.error('Failed to load buckets:', err);
      setError('Failed to load storage buckets');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaults = async () => {
    try {
      const response = await storageApi.getDefaults();
      setDefaults(response.defaults || {});
    } catch (err) {
      console.error('Failed to load default buckets:', err);
    }
  };

  const getDefaultForContext = () => {
    switch (context) {
      case 'chat':
        return defaults.chat || defaults.general;
      case 'forms':
        return defaults.forms || defaults.general;
      default:
        return defaults.general;
    }
  };

  const getProviderIcon = (provider: string) => {
    return provider === 's3' ? <Cloud className="h-3 w-3" /> : <HardDrive className="h-3 w-3" />;
  };

  const isDefault = (bucket: StorageBucket) => {
    if (context === 'chat' && bucket.is_default_chat) return true;
    if (context === 'forms' && bucket.is_default_forms) return true;
    if (context === 'general' && bucket.is_default) return true;
    return false;
  };

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && <Label>{label}</Label>}
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      <Select
        value={value || getDefaultForContext() || undefined}
        onValueChange={(newValue) => {
          // Only call onChange if we have a valid value
          if (newValue) {
            onChange(newValue);
          }
        }}
        disabled={isLoading || buckets.length === 0}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? 'Loading buckets...' : 'Select a storage bucket'}>
            {isLoading && (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading buckets...
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {buckets.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              No storage buckets available
            </div>
          ) : (
            buckets.map((bucket) => {
              // Skip buckets without valid IDs
              if (!bucket.id) {
                console.warn('Bucket without ID found:', bucket);
                return null;
              }
              
              return (
                <SelectItem key={bucket.id} value={bucket.id}>
                  <div className="flex items-center gap-2">
                    {getProviderIcon(bucket.provider)}
                    <span>{bucket.name}</span>
                    {isDefault(bucket) && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Default
                      </Badge>
                    )}
                    {bucket.provider === 's3' && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        S3
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>
      
      {value && !isLoading && (
        <p className="text-xs text-muted-foreground">
          Files will be stored in the selected bucket
        </p>
      )}
    </div>
  );
}