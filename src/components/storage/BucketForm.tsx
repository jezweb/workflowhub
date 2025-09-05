import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { storageApi } from '@/lib/api';
import type { StorageBucket, CreateBucketInput, R2Config, S3Config } from '@/types/storage';

interface BucketFormProps {
  bucket?: StorageBucket | null;
  onSubmit: (data: CreateBucketInput) => void;
  onClose: () => void;
}

export function BucketForm({ bucket, onSubmit, onClose }: BucketFormProps) {
  const [formData, setFormData] = useState({
    name: bucket?.name || '',
    description: bucket?.description || '',
    provider: bucket?.provider || 'r2' as 'r2' | 's3',
    is_default: bucket?.is_default || false,
    is_default_chat: bucket?.is_default_chat || false,
    is_default_forms: bucket?.is_default_forms || false,
    
    // R2 Config
    r2_bucket_name: '',
    r2_use_binding: true,
    r2_account_id: '',
    r2_access_key_id: '',
    r2_secret_access_key: '',
    
    // S3 Config
    s3_bucket_name: '',
    s3_region: 'us-east-1',
    s3_access_key_id: '',
    s3_secret_access_key: '',
    s3_endpoint: '',
    s3_force_path_style: false,
  });
  
  const [loading, setLoading] = useState(false);

  // Fetch full bucket config when editing
  useEffect(() => {
    if (bucket?.id) {
      setLoading(true);
      storageApi.getBucketWithConfig(bucket.id)
        .then((response) => {
          if (response.success && response.bucket) {
            const bucketData = response.bucket;
            const config = bucketData.config || {};
            
            setFormData(prev => ({
              ...prev,
              name: bucketData.name || '',
              description: bucketData.description || '',
              provider: bucketData.provider || 'r2',
              is_default: bucketData.is_default || false,
              is_default_chat: bucketData.is_default_chat || false,
              is_default_forms: bucketData.is_default_forms || false,
              
              // R2 Config
              r2_bucket_name: bucketData.provider === 'r2' ? (config.bucket_name || '') : prev.r2_bucket_name,
              r2_use_binding: bucketData.provider === 'r2' ? (config.use_binding ?? true) : prev.r2_use_binding,
              r2_account_id: bucketData.provider === 'r2' ? (config.account_id || '') : prev.r2_account_id,
              r2_access_key_id: bucketData.provider === 'r2' ? (config.access_key_id || '') : prev.r2_access_key_id,
              r2_secret_access_key: bucketData.provider === 'r2' ? (config.secret_access_key || '') : prev.r2_secret_access_key,
              
              // S3 Config
              s3_bucket_name: bucketData.provider === 's3' ? (config.bucket_name || '') : prev.s3_bucket_name,
              s3_region: bucketData.provider === 's3' ? (config.region || 'us-east-1') : prev.s3_region,
              s3_access_key_id: bucketData.provider === 's3' ? (config.access_key_id || '') : prev.s3_access_key_id,
              s3_secret_access_key: bucketData.provider === 's3' ? (config.secret_access_key || '') : prev.s3_secret_access_key,
              s3_endpoint: bucketData.provider === 's3' ? (config.endpoint || '') : prev.s3_endpoint,
              s3_force_path_style: bucketData.provider === 's3' ? (config.force_path_style || false) : prev.s3_force_path_style,
            }));
          }
        })
        .catch((error) => {
          console.error('Failed to load bucket config:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [bucket?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let config: R2Config | S3Config;
    
    if (formData.provider === 'r2') {
      config = {
        bucket_name: formData.r2_bucket_name,
        use_binding: formData.r2_use_binding,
        account_id: formData.r2_account_id,
        access_key_id: formData.r2_access_key_id,
        secret_access_key: formData.r2_secret_access_key,
      };
    } else {
      config = {
        bucket_name: formData.s3_bucket_name,
        region: formData.s3_region,
        access_key_id: formData.s3_access_key_id,
        secret_access_key: formData.s3_secret_access_key,
        endpoint: formData.s3_endpoint || undefined,
        force_path_style: formData.s3_force_path_style,
      };
    }
    
    const data = {
      name: formData.name,
      description: formData.description || undefined,
      provider: formData.provider,
      is_default: formData.is_default,
      is_default_chat: formData.is_default_chat,
      is_default_forms: formData.is_default_forms,
      config,
    };
    
    onSubmit(data);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{bucket ? 'Edit Storage Bucket' : 'Add Storage Bucket'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Storage Bucket"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value: 'r2' | 's3') => setFormData({ ...formData, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="r2">Cloudflare R2</SelectItem>
                    <SelectItem value="s3">Amazon S3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this storage bucket..."
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Default Settings</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked as boolean })}
                  />
                  <Label htmlFor="is_default" className="text-sm font-normal">
                    Set as default storage bucket
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default_chat"
                    checked={formData.is_default_chat}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default_chat: checked as boolean })}
                  />
                  <Label htmlFor="is_default_chat" className="text-sm font-normal">
                    Default for chat attachments
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default_forms"
                    checked={formData.is_default_forms}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default_forms: checked as boolean })}
                  />
                  <Label htmlFor="is_default_forms" className="text-sm font-normal">
                    Default for form uploads
                  </Label>
                </div>
              </div>
            </div>
            
            <Tabs value={formData.provider} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="r2" disabled={formData.provider !== 'r2'}>R2 Configuration</TabsTrigger>
                <TabsTrigger value="s3" disabled={formData.provider !== 's3'}>S3 Configuration</TabsTrigger>
              </TabsList>
              
              <TabsContent value="r2" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="r2_bucket_name">Bucket Name</Label>
                  <Input
                    id="r2_bucket_name"
                    value={formData.r2_bucket_name}
                    onChange={(e) => setFormData({ ...formData, r2_bucket_name: e.target.value })}
                    placeholder="my-r2-bucket"
                    required={formData.provider === 'r2'}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="r2_use_binding"
                    checked={formData.r2_use_binding}
                    onCheckedChange={(checked) => setFormData({ ...formData, r2_use_binding: checked as boolean })}
                  />
                  <Label htmlFor="r2_use_binding" className="text-sm font-normal">
                    Use Cloudflare binding (recommended for default bucket)
                  </Label>
                </div>
                
                {!formData.r2_use_binding && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="r2_account_id">Account ID</Label>
                      <Input
                        id="r2_account_id"
                        value={formData.r2_account_id}
                        onChange={(e) => setFormData({ ...formData, r2_account_id: e.target.value })}
                        placeholder="Your Cloudflare Account ID"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="r2_access_key_id">Access Key ID</Label>
                      <Input
                        id="r2_access_key_id"
                        value={formData.r2_access_key_id}
                        onChange={(e) => setFormData({ ...formData, r2_access_key_id: e.target.value })}
                        placeholder="R2 Access Key ID"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="r2_secret_access_key">Secret Access Key</Label>
                      <Input
                        id="r2_secret_access_key"
                        type="password"
                        value={formData.r2_secret_access_key}
                        onChange={(e) => setFormData({ ...formData, r2_secret_access_key: e.target.value })}
                        placeholder="R2 Secret Access Key"
                      />
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="s3" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="s3_bucket_name">Bucket Name</Label>
                    <Input
                      id="s3_bucket_name"
                      value={formData.s3_bucket_name}
                      onChange={(e) => setFormData({ ...formData, s3_bucket_name: e.target.value })}
                      placeholder="my-s3-bucket"
                      required={formData.provider === 's3'}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="s3_region">Region</Label>
                    <Input
                      id="s3_region"
                      value={formData.s3_region}
                      onChange={(e) => setFormData({ ...formData, s3_region: e.target.value })}
                      placeholder="us-east-1"
                      required={formData.provider === 's3'}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="s3_access_key_id">Access Key ID</Label>
                  <Input
                    id="s3_access_key_id"
                    value={formData.s3_access_key_id}
                    onChange={(e) => setFormData({ ...formData, s3_access_key_id: e.target.value })}
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    required={formData.provider === 's3'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="s3_secret_access_key">Secret Access Key</Label>
                  <Input
                    id="s3_secret_access_key"
                    type="password"
                    value={formData.s3_secret_access_key}
                    onChange={(e) => setFormData({ ...formData, s3_secret_access_key: e.target.value })}
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    required={formData.provider === 's3'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="s3_endpoint">Custom Endpoint (Optional)</Label>
                  <Input
                    id="s3_endpoint"
                    value={formData.s3_endpoint}
                    onChange={(e) => setFormData({ ...formData, s3_endpoint: e.target.value })}
                    placeholder="https://s3-compatible.example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    For S3-compatible services like MinIO, Backblaze B2, etc.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="s3_force_path_style"
                    checked={formData.s3_force_path_style}
                    onCheckedChange={(checked) => setFormData({ ...formData, s3_force_path_style: checked as boolean })}
                  />
                  <Label htmlFor="s3_force_path_style" className="text-sm font-normal">
                    Force path-style URLs (required for some S3-compatible services)
                  </Label>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Loading...' : bucket ? 'Update Bucket' : 'Create Bucket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}