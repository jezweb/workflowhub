// R2 Storage Provider Implementation

// Using any to avoid R2 type conflicts
import { S3Provider } from './s3-provider';
import type { 
  StorageProvider, 
  StorageObject, 
  StorageListOptions, 
  StorageListResult,
  StorageUploadOptions,
  R2Config 
} from './types';

export class R2Provider implements StorageProvider {
  private bucket: any = null;
  private _config: R2Config;
  private s3Provider: S3Provider | null = null;

  constructor(config: R2Config, bucket?: any) {
    this._config = config;
    
    if (config.use_binding && bucket) {
      // Binding mode - use the native R2 bucket
      this.bucket = bucket;
    } else if (!config.use_binding && config.account_id && config.access_key_id && config.secret_access_key) {
      // Credential mode - use S3Provider
      this.s3Provider = new S3Provider(config);
    } else if (!config.use_binding) {
      console.warn('R2 config incomplete - missing required credentials for non-binding mode');
    }
  }

  private async getBucket(): Promise<any> {
    if (this.bucket) {
      return this.bucket;
    }

    // Check if we expected to have a binding but don't
    if (this._config.use_binding) {
      throw new Error(
        `R2 bucket binding not available for bucket "${this._config.bucket_name}". ` +
        `Please either:\n` +
        `1. Add the R2 bucket binding to your wrangler.toml file\n` +
        `2. Uncheck "Use Cloudflare binding" and provide access credentials instead`
      );
    }

    // For non-binding mode, we would need to use the S3-compatible API
    // This requires the AWS SDK or manual signing with this._config credentials
    throw new Error(
      `Direct R2 API access is not yet implemented. ` +
      `Please use Cloudflare bindings by:\n` +
      `1. Adding [[r2_buckets]] binding in wrangler.toml\n` +
      `2. Enabling "Use Cloudflare binding" in bucket settings`
    );
  }

  async upload(
    key: string, 
    data: ArrayBuffer | ReadableStream | Blob, 
    options?: StorageUploadOptions
  ): Promise<void> {
    // If using S3Provider (credential mode), delegate to it
    if (this.s3Provider) {
      return this.s3Provider.upload(key, data, options);
    }

    // Otherwise use binding mode
    const bucket = await this.getBucket();
    
    const httpMetadata: Record<string, string> = {};
    if (options?.contentType) {
      httpMetadata.contentType = options.contentType;
    }

    // Convert data to a format R2 can handle
    let uploadData: any;
    
    if (data instanceof Blob) {
      uploadData = await data.arrayBuffer();
    } else {
      uploadData = data;
    }

    await bucket.put(key, uploadData, {
      httpMetadata: Object.keys(httpMetadata).length > 0 ? httpMetadata : undefined,
      customMetadata: options?.metadata,
    });
  }

  async download(key: string): Promise<Response> {
    // If using S3Provider (credential mode), delegate to it
    if (this.s3Provider) {
      return this.s3Provider.download(key);
    }

    // Otherwise use binding mode
    const bucket = await this.getBucket();
    const object = await bucket.get(key);
    
    if (!object) {
      return new Response('Not found', { status: 404 });
    }

    const headers = new Headers();
    if (object.httpMetadata?.contentType) {
      headers.set('Content-Type', object.httpMetadata.contentType);
    }
    headers.set('Content-Length', object.size.toString());
    if (object.httpEtag) {
      headers.set('ETag', object.httpEtag);
    }

    return new Response(object.body as ReadableStream, { headers });
  }

  async delete(key: string): Promise<void> {
    // If using S3Provider (credential mode), delegate to it
    if (this.s3Provider) {
      return this.s3Provider.delete(key);
    }

    // Otherwise use binding mode
    const bucket = await this.getBucket();
    await bucket.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    // If using S3Provider (credential mode), delegate to it
    if (this.s3Provider) {
      return this.s3Provider.exists(key);
    }

    // Otherwise use binding mode
    const bucket = await this.getBucket();
    const object = await bucket.head(key);
    return object !== null;
  }

  async list(options?: StorageListOptions): Promise<StorageListResult> {
    // If using S3Provider (credential mode), delegate to it
    if (this.s3Provider) {
      return this.s3Provider.list(options);
    }

    // Otherwise use binding mode
    const bucket = await this.getBucket();
    
    const listOptions: R2ListOptions = {
      limit: options?.maxKeys || 1000,
      prefix: options?.prefix,
      cursor: options?.continuationToken,
    };

    const result = await bucket.list(listOptions);
    
    const objects: StorageObject[] = result.objects.map((obj: any) => ({
      key: obj.key,
      size: obj.size,
      lastModified: new Date(obj.uploaded.getTime()),
      etag: obj.httpEtag,
      metadata: obj.customMetadata || {},
    }));

    return {
      objects,
      isTruncated: result.truncated,
      continuationToken: (result as any).cursor,
    };
  }

  async testConnection(): Promise<boolean> {
    // If using S3Provider (credential mode), delegate to it
    if (this.s3Provider) {
      return this.s3Provider.testConnection();
    }

    // Otherwise test binding mode
    try {
      // Try to list with limit 1 to test connection
      await this.list({ maxKeys: 1 });
      return true;
    } catch (error) {
      console.error('R2 connection test failed:', error);
      return false;
    }
  }
}

interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
  delimiter?: string;
}