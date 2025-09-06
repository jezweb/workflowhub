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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { storageApi } from '@/lib/api';
import type { 
  StorageBucket, 
  CreateBucketInput, 
  R2Config, 
  S3Config,
  StorageProviderUI,
  StorageProviderDB 
} from '@/types/storage';

interface BucketFormProps {
  bucket?: StorageBucket | null;
  onSubmit: (data: CreateBucketInput) => void;
  onClose: () => void;
}

// Provider configurations
const PROVIDER_OPTIONS = [
  {
    value: 'r2-binding' as StorageProviderUI,
    label: 'Cloudflare R2 (Binding)',
    description: 'Direct Worker binding - Fastest, no credentials needed',
    helpText: 'Requires R2 bucket binding in wrangler.toml. Best for default buckets.',
  },
  {
    value: 'r2-s3' as StorageProviderUI,
    label: 'Cloudflare R2 (S3 API)',
    description: 'Use R2 with credentials via S3-compatible API',
    helpText: 'Use your Cloudflare Account ID and R2 API tokens.',
  },
  {
    value: 's3' as StorageProviderUI,
    label: 'Amazon S3',
    description: 'AWS S3 buckets',
    helpText: 'Standard AWS S3 bucket configuration.',
  },
  {
    value: 'backblaze' as StorageProviderUI,
    label: 'Backblaze B2',
    description: 'Cost-effective S3-compatible cloud storage',
    helpText: 'Get your Application Keys from B2 Cloud Storage > App Keys',
  },
  {
    value: 'digitalocean' as StorageProviderUI,
    label: 'DigitalOcean Spaces',
    description: 'Simple, scalable S3-compatible object storage',
    helpText: 'Create access keys in API > Spaces Keys section',
  },
  {
    value: 'vultr' as StorageProviderUI,
    label: 'Vultr Object Storage',
    description: 'High-performance S3-compatible storage',
    helpText: 'Find credentials in your Vultr Object Storage dashboard',
  },
  {
    value: 'minio' as StorageProviderUI,
    label: 'MinIO',
    description: 'Self-hosted S3-compatible storage',
    helpText: 'For self-hosted S3-compatible storage. Uses path-style URLs by default.',
  },
  {
    value: 's3-compatible' as StorageProviderUI,
    label: 'Other S3-Compatible',
    description: 'Any S3-compatible API (Wasabi, Linode, etc.)',
    helpText: 'Configure any S3-compatible storage service with custom endpoint.',
  },
];

// Region options for various providers
const AWS_REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
];

const DO_REGIONS = [
  { value: 'nyc3', label: 'New York 3' },
  { value: 'sfo3', label: 'San Francisco 3' },
  { value: 'ams3', label: 'Amsterdam 3' },
  { value: 'sgp1', label: 'Singapore 1' },
  { value: 'fra1', label: 'Frankfurt 1' },
  { value: 'syd1', label: 'Sydney 1' },
];

const VULTR_REGIONS = [
  { value: 'ewr1', label: 'New Jersey' },
  { value: 'lax1', label: 'Los Angeles' },
  { value: 'ams1', label: 'Amsterdam' },
  { value: 'sgp1', label: 'Singapore' },
];

const BACKBLAZE_REGIONS = [
  { value: 'us-west-001', label: 'US West (California)' },
  { value: 'us-west-002', label: 'US West (Arizona)' },
  { value: 'us-west-004', label: 'US West (Northern California)' },
  { value: 'us-east-005', label: 'US East (Virginia)' },
  { value: 'eu-central-003', label: 'EU Central (Amsterdam)' },
];

export function BucketForm({ bucket, onSubmit, onClose }: BucketFormProps) {
  const [formData, setFormData] = useState({
    name: bucket?.name || '',
    description: bucket?.description || '',
    providerUI: 'r2-binding' as StorageProviderUI,
    is_default: bucket?.is_default || false,
    is_default_chat: bucket?.is_default_chat || false,
    is_default_forms: bucket?.is_default_forms || false,
    
    // Common fields
    bucket_name: '',
    access_key_id: '',
    secret_access_key: '',
    
    // Provider-specific fields
    r2_account_id: '',
    region: 'us-east-1',
    endpoint: '',
    force_path_style: false,
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
            
            // Determine UI provider from DB provider and config
            let providerUI: StorageProviderUI = 'r2-binding';
            if (bucketData.provider === 'r2') {
              providerUI = config.use_binding ? 'r2-binding' : 'r2-s3';
            } else if (bucketData.provider === 's3') {
              // Try to detect specific S3 provider from endpoint
              if (config.endpoint?.includes('backblazeb2.com')) {
                providerUI = 'backblaze';
              } else if (config.endpoint?.includes('digitaloceanspaces.com')) {
                providerUI = 'digitalocean';
              } else if (config.endpoint?.includes('vultrobjects.com')) {
                providerUI = 'vultr';
              } else if (config.endpoint) {
                providerUI = config.force_path_style ? 'minio' : 's3-compatible';
              } else {
                providerUI = 's3';
              }
            }
            
            setFormData({
              name: bucketData.name || '',
              description: bucketData.description || '',
              providerUI,
              is_default: bucketData.is_default || false,
              is_default_chat: bucketData.is_default_chat || false,
              is_default_forms: bucketData.is_default_forms || false,
              
              bucket_name: config.bucket_name || '',
              access_key_id: config.access_key_id || '',
              secret_access_key: config.secret_access_key || '',
              
              r2_account_id: bucketData.provider === 'r2' ? (config.account_id || '') : '',
              region: config.region || 'us-east-1',
              endpoint: config.endpoint || '',
              force_path_style: config.force_path_style || false,
            });
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
    
    let provider: StorageProviderDB;
    let config: R2Config | S3Config;
    
    // Map UI provider to DB provider and build config
    switch (formData.providerUI) {
      case 'r2-binding':
        provider = 'r2';
        config = {
          bucket_name: formData.bucket_name,
          use_binding: true,
        } as R2Config;
        break;
        
      case 'r2-s3':
        provider = 'r2';
        config = {
          bucket_name: formData.bucket_name,
          use_binding: false,
          account_id: formData.r2_account_id,
          access_key_id: formData.access_key_id,
          secret_access_key: formData.secret_access_key,
        } as R2Config;
        break;
        
      case 's3':
        provider = 's3';
        config = {
          bucket_name: formData.bucket_name,
          region: formData.region,
          access_key_id: formData.access_key_id,
          secret_access_key: formData.secret_access_key,
        } as S3Config;
        break;
        
      case 'backblaze':
        provider = 's3';
        config = {
          bucket_name: formData.bucket_name,
          region: formData.region,
          endpoint: `https://s3.${formData.region}.backblazeb2.com`,
          access_key_id: formData.access_key_id,
          secret_access_key: formData.secret_access_key,
          force_path_style: false,
        } as S3Config;
        break;
        
      case 'digitalocean':
        provider = 's3';
        config = {
          bucket_name: formData.bucket_name,
          region: formData.region,
          endpoint: `https://${formData.region}.digitaloceanspaces.com`,
          access_key_id: formData.access_key_id,
          secret_access_key: formData.secret_access_key,
          force_path_style: false,
        } as S3Config;
        break;
        
      case 'vultr':
        provider = 's3';
        config = {
          bucket_name: formData.bucket_name,
          region: formData.region,
          endpoint: `https://${formData.region}.vultrobjects.com`,
          access_key_id: formData.access_key_id,
          secret_access_key: formData.secret_access_key,
          force_path_style: true,
        } as S3Config;
        break;
        
      case 'minio':
        provider = 's3';
        config = {
          bucket_name: formData.bucket_name,
          region: formData.region || 'us-east-1',
          endpoint: formData.endpoint,
          access_key_id: formData.access_key_id,
          secret_access_key: formData.secret_access_key,
          force_path_style: true,
        } as S3Config;
        break;
        
      case 's3-compatible':
      default:
        provider = 's3';
        config = {
          bucket_name: formData.bucket_name,
          region: formData.region || 'us-east-1',
          endpoint: formData.endpoint || undefined,
          access_key_id: formData.access_key_id,
          secret_access_key: formData.secret_access_key,
          force_path_style: formData.force_path_style,
        } as S3Config;
        break;
    }
    
    const data: CreateBucketInput = {
      name: formData.name,
      description: formData.description || undefined,
      provider,
      is_default: formData.is_default,
      is_default_chat: formData.is_default_chat,
      is_default_forms: formData.is_default_forms,
      config,
    };
    
    onSubmit(data);
  };

  const selectedProvider = PROVIDER_OPTIONS.find(p => p.value === formData.providerUI);

  // Render configuration fields based on provider
  const renderProviderConfig = () => {
    switch (formData.providerUI) {
      case 'r2-binding':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="bucket_name">Bucket Name</Label>
              <Input
                id="bucket_name"
                value={formData.bucket_name}
                onChange={(e) => setFormData({ ...formData, bucket_name: e.target.value })}
                placeholder="my-r2-bucket"
                required
              />
              <p className="text-xs text-muted-foreground">
                Must match the bucket name configured in your wrangler.toml
              </p>
            </div>
          </>
        );
        
      case 'r2-s3':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="bucket_name">Bucket Name</Label>
              <Input
                id="bucket_name"
                value={formData.bucket_name}
                onChange={(e) => setFormData({ ...formData, bucket_name: e.target.value })}
                placeholder="my-r2-bucket"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r2_account_id">Cloudflare Account ID</Label>
              <Input
                id="r2_account_id"
                value={formData.r2_account_id}
                onChange={(e) => setFormData({ ...formData, r2_account_id: e.target.value })}
                placeholder="0460574641fdbb98159c98ebf593e2bd"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_key_id">R2 Access Key ID</Label>
              <Input
                id="access_key_id"
                value={formData.access_key_id}
                onChange={(e) => setFormData({ ...formData, access_key_id: e.target.value })}
                placeholder="016241efaaf28254809848bad204a7f2"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret_access_key">R2 Secret Access Key</Label>
              <Input
                id="secret_access_key"
                type="password"
                value={formData.secret_access_key}
                onChange={(e) => setFormData({ ...formData, secret_access_key: e.target.value })}
                placeholder="••••••••••••••••"
                required
              />
            </div>
          </>
        );
        
      case 's3':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bucket_name">Bucket Name</Label>
                <Input
                  id="bucket_name"
                  value={formData.bucket_name}
                  onChange={(e) => setFormData({ ...formData, bucket_name: e.target.value })}
                  placeholder="my-s3-bucket"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AWS_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_key_id">AWS Access Key ID</Label>
              <Input
                id="access_key_id"
                value={formData.access_key_id}
                onChange={(e) => setFormData({ ...formData, access_key_id: e.target.value })}
                placeholder="AKIAIOSFODNN7EXAMPLE"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret_access_key">AWS Secret Access Key</Label>
              <Input
                id="secret_access_key"
                type="password"
                value={formData.secret_access_key}
                onChange={(e) => setFormData({ ...formData, secret_access_key: e.target.value })}
                placeholder="••••••••••••••••"
                required
              />
            </div>
          </>
        );
        
      case 'backblaze':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bucket_name">Bucket Name</Label>
                <Input
                  id="bucket_name"
                  value={formData.bucket_name}
                  onChange={(e) => setFormData({ ...formData, bucket_name: e.target.value })}
                  placeholder="my-b2-bucket"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BACKBLAZE_REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_key_id">Application Key ID</Label>
              <Input
                id="access_key_id"
                value={formData.access_key_id}
                onChange={(e) => setFormData({ ...formData, access_key_id: e.target.value })}
                placeholder="0050325c9e8a78f0000000001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret_access_key">Application Key</Label>
              <Input
                id="secret_access_key"
                type="password"
                value={formData.secret_access_key}
                onChange={(e) => setFormData({ ...formData, secret_access_key: e.target.value })}
                placeholder="••••••••••••••••"
                required
              />
            </div>
          </>
        );
        
      case 'digitalocean':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bucket_name">Space Name</Label>
                <Input
                  id="bucket_name"
                  value={formData.bucket_name}
                  onChange={(e) => setFormData({ ...formData, bucket_name: e.target.value })}
                  placeholder="my-space"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DO_REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_key_id">Access Key</Label>
              <Input
                id="access_key_id"
                value={formData.access_key_id}
                onChange={(e) => setFormData({ ...formData, access_key_id: e.target.value })}
                placeholder="DO00EXAMPLE123KEY"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret_access_key">Secret Key</Label>
              <Input
                id="secret_access_key"
                type="password"
                value={formData.secret_access_key}
                onChange={(e) => setFormData({ ...formData, secret_access_key: e.target.value })}
                placeholder="••••••••••••••••"
                required
              />
            </div>
          </>
        );
        
      case 'vultr':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bucket_name">Bucket Name</Label>
                <Input
                  id="bucket_name"
                  value={formData.bucket_name}
                  onChange={(e) => setFormData({ ...formData, bucket_name: e.target.value })}
                  placeholder="my-vultr-bucket"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VULTR_REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_key_id">Access Key</Label>
              <Input
                id="access_key_id"
                value={formData.access_key_id}
                onChange={(e) => setFormData({ ...formData, access_key_id: e.target.value })}
                placeholder="VULTR123EXAMPLE"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret_access_key">Secret Key</Label>
              <Input
                id="secret_access_key"
                type="password"
                value={formData.secret_access_key}
                onChange={(e) => setFormData({ ...formData, secret_access_key: e.target.value })}
                placeholder="••••••••••••••••"
                required
              />
            </div>
          </>
        );
        
      case 'minio':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="bucket_name">Bucket Name</Label>
              <Input
                id="bucket_name"
                value={formData.bucket_name}
                onChange={(e) => setFormData({ ...formData, bucket_name: e.target.value })}
                placeholder="my-minio-bucket"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpoint">MinIO Endpoint URL</Label>
              <Input
                id="endpoint"
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                placeholder="https://minio.example.com:9000"
                required
              />
              <p className="text-xs text-muted-foreground">
                Full URL including protocol and port
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_key_id">Access Key</Label>
              <Input
                id="access_key_id"
                value={formData.access_key_id}
                onChange={(e) => setFormData({ ...formData, access_key_id: e.target.value })}
                placeholder="minioadmin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret_access_key">Secret Key</Label>
              <Input
                id="secret_access_key"
                type="password"
                value={formData.secret_access_key}
                onChange={(e) => setFormData({ ...formData, secret_access_key: e.target.value })}
                placeholder="••••••••••••••••"
                required
              />
            </div>
          </>
        );
        
      case 's3-compatible':
      default:
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bucket_name">Bucket Name</Label>
                <Input
                  id="bucket_name"
                  value={formData.bucket_name}
                  onChange={(e) => setFormData({ ...formData, bucket_name: e.target.value })}
                  placeholder="my-bucket"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="us-east-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL (Optional)</Label>
              <Input
                id="endpoint"
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                placeholder="https://s3-compatible.example.com"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for standard AWS S3
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_key_id">Access Key ID</Label>
              <Input
                id="access_key_id"
                value={formData.access_key_id}
                onChange={(e) => setFormData({ ...formData, access_key_id: e.target.value })}
                placeholder="Access Key ID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret_access_key">Secret Access Key</Label>
              <Input
                id="secret_access_key"
                type="password"
                value={formData.secret_access_key}
                onChange={(e) => setFormData({ ...formData, secret_access_key: e.target.value })}
                placeholder="••••••••••••••••"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="force_path_style"
                checked={formData.force_path_style}
                onCheckedChange={(checked) => setFormData({ ...formData, force_path_style: checked as boolean })}
              />
              <Label htmlFor="force_path_style" className="text-sm font-normal">
                Force path-style URLs (required for some S3-compatible services)
              </Label>
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bucket ? 'Edit Storage Bucket' : 'Add Storage Bucket'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Name field - full width */}
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
            
            {/* Provider dropdown - full width */}
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={formData.providerUI}
                onValueChange={(value: StorageProviderUI) => setFormData({ ...formData, providerUI: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Description field - full width */}
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
            
            {/* Provider-specific help text */}
            {selectedProvider && (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  {selectedProvider.helpText}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Dynamic configuration section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium">Configuration</h3>
              {renderProviderConfig()}
            </div>
            
            {/* Default settings at the bottom */}
            <div className="space-y-2 border-t pt-4">
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