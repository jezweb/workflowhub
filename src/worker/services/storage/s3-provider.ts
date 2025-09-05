// S3 Storage Provider Implementation

import { AwsClient } from 'aws4fetch';
import type { 
  StorageProvider, 
  StorageObject, 
  StorageListOptions, 
  StorageListResult,
  StorageUploadOptions,
  S3Config 
} from './types';

export class S3Provider implements StorageProvider {
  private client: AwsClient;
  private config: S3Config;
  private endpoint: string;

  constructor(config: S3Config) {
    this.config = config;
    
    // Determine endpoint
    if (config.endpoint) {
      this.endpoint = config.endpoint;
    } else {
      this.endpoint = `https://s3.${config.region}.amazonaws.com`;
    }

    // Initialize AWS client for signing requests
    this.client = new AwsClient({
      accessKeyId: config.access_key_id,
      secretAccessKey: config.secret_access_key,
      region: config.region,
      service: 's3',
    });
  }

  private getUrl(key?: string): string {
    if (this.config.force_path_style || this.config.endpoint) {
      // Path-style: https://endpoint/bucket/key
      const base = `${this.endpoint}/${this.config.bucket_name}`;
      return key ? `${base}/${key}` : base;
    } else {
      // Virtual-hosted-style: https://bucket.s3.region.amazonaws.com/key
      const base = `https://${this.config.bucket_name}.s3.${this.config.region}.amazonaws.com`;
      return key ? `${base}/${key}` : base;
    }
  }

  async upload(
    key: string, 
    data: ArrayBuffer | ReadableStream | Blob, 
    options?: StorageUploadOptions
  ): Promise<void> {
    const url = this.getUrl(key);
    
    const headers: HeadersInit = {};
    if (options?.contentType) {
      headers['Content-Type'] = options.contentType;
    }
    
    // Add custom metadata with x-amz-meta- prefix
    if (options?.metadata) {
      Object.entries(options.metadata).forEach(([k, v]) => {
        headers[`x-amz-meta-${k}`] = v;
      });
    }

    // Convert data to ArrayBuffer if needed
    let body: ArrayBuffer;
    if (data instanceof ArrayBuffer) {
      body = data;
    } else if (data instanceof Blob) {
      body = await data.arrayBuffer();
    } else {
      // ReadableStream - need to collect it
      const reader = data.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      body = result.buffer;
    }

    const response = await this.client.fetch(url, {
      method: 'PUT',
      headers,
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`S3 upload failed: ${response.status} - ${text}`);
    }
  }

  async download(key: string): Promise<Response> {
    const url = this.getUrl(key);
    const response = await this.client.fetch(url, {
      method: 'GET',
    });

    if (!response.ok && response.status !== 404) {
      const text = await response.text();
      throw new Error(`S3 download failed: ${response.status} - ${text}`);
    }

    return response;
  }

  async delete(key: string): Promise<void> {
    const url = this.getUrl(key);
    const response = await this.client.fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 404) {
      const text = await response.text();
      throw new Error(`S3 delete failed: ${response.status} - ${text}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    const url = this.getUrl(key);
    const response = await this.client.fetch(url, {
      method: 'HEAD',
    });

    return response.ok;
  }

  async list(options?: StorageListOptions): Promise<StorageListResult> {
    const url = this.getUrl();
    const params = new URLSearchParams();
    
    if (options?.prefix) {
      params.append('prefix', options.prefix);
    }
    if (options?.maxKeys) {
      params.append('max-keys', options.maxKeys.toString());
    }
    if (options?.continuationToken) {
      params.append('continuation-token', options.continuationToken);
    }
    
    // Use list-type=2 for better pagination support
    params.append('list-type', '2');

    const response = await this.client.fetch(`${url}?${params.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`S3 list failed: ${response.status} - ${text}`);
    }

    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    
    const objects: StorageObject[] = [];
    const contents = doc.querySelectorAll('Contents');
    contents.forEach(item => {
      const key = item.querySelector('Key')?.textContent;
      const size = item.querySelector('Size')?.textContent;
      const lastModified = item.querySelector('LastModified')?.textContent;
      const etag = item.querySelector('ETag')?.textContent;
      
      if (key) {
        objects.push({
          key,
          size: parseInt(size || '0', 10),
          lastModified: lastModified ? new Date(lastModified) : new Date(),
          etag: etag?.replace(/"/g, ''),
        });
      }
    });

    const isTruncated = doc.querySelector('IsTruncated')?.textContent === 'true';
    const nextToken = doc.querySelector('NextContinuationToken')?.textContent || undefined;

    return {
      objects,
      isTruncated,
      continuationToken: nextToken,
    };
  }

  async getSignedUrl(key: string, _expiresIn: number = 3600): Promise<string> {
    // Generate presigned URL
    const url = this.getUrl(key);
    
    // For now, return the unsigned URL
    // Implementing proper presigned URLs requires more complex signing
    return url;
  }

  async testConnection(): Promise<boolean> {
    try {
      // Try to list bucket with limit 1
      await this.list({ maxKeys: 1 });
      return true;
    } catch (error) {
      console.error('S3 connection test failed:', error);
      return false;
    }
  }
}