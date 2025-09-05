// Storage provider types and interfaces

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
  metadata?: Record<string, string>;
}

export interface StorageListOptions {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface StorageListResult {
  objects: StorageObject[];
  isTruncated: boolean;
  continuationToken?: string;
}

export interface StorageUploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StorageProvider {
  // Core operations
  upload(key: string, data: ArrayBuffer | ReadableStream | Blob, options?: StorageUploadOptions): Promise<void>;
  download(key: string): Promise<Response>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  
  // List operations
  list(options?: StorageListOptions): Promise<StorageListResult>;
  
  // URL operations (optional for some providers)
  getSignedUrl?(key: string, expiresIn?: number): Promise<string>;
  
  // Test connection
  testConnection(): Promise<boolean>;
}

export interface R2Config {
  bucket_name: string;
  use_binding?: boolean; // Use Cloudflare binding if available
  account_id?: string;
  access_key_id?: string;
  secret_access_key?: string;
}

export interface S3Config {
  bucket_name: string;
  region: string;
  access_key_id: string;
  secret_access_key: string;
  endpoint?: string; // For S3-compatible services like MinIO, Backblaze B2, etc.
  force_path_style?: boolean; // For S3-compatible services
}

export type StorageConfig = R2Config | S3Config;

export interface StorageBucket {
  id: string;
  name: string;
  description?: string;
  provider: 'r2' | 's3';
  is_default: boolean;
  is_default_chat: boolean;
  is_default_forms: boolean;
  config_json: string; // Encrypted JSON config
  created_by?: string;
  created_at: string;
  updated_at: string;
}