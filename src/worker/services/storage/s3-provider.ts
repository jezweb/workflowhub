// Universal S3-Compatible Storage Provider
// Supports AWS S3, Cloudflare R2, Vultr, MinIO, and any S3-compatible service

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  type PutObjectCommandInput,
  type ListObjectsV2CommandInput,
} from '@aws-sdk/client-s3';

import type {
  StorageProvider,
  StorageObject,
  StorageListOptions,
  StorageListResult,
  StorageUploadOptions,
  S3Config,
  R2Config,
} from './types';

export class S3Provider implements StorageProvider {
  private client: S3Client;
  private bucketName: string;
  private isR2: boolean = false;

  constructor(config: S3Config | R2Config) {
    this.bucketName = config.bucket_name;
    
    // Determine if this is R2 in credential mode
    this.isR2 = 'use_binding' in config && !config.use_binding;
    
    // Build S3Client configuration
    const clientConfig: any = {
      credentials: {
        accessKeyId: config.access_key_id!,
        secretAccessKey: config.secret_access_key!,
      },
    };

    if (this.isR2) {
      // R2 specific configuration
      const r2Config = config as R2Config;
      clientConfig.endpoint = `https://${r2Config.account_id}.r2.cloudflarestorage.com`;
      clientConfig.region = 'auto';
    } else {
      // Standard S3 or S3-compatible configuration
      const s3Config = config as S3Config;
      clientConfig.region = s3Config.region || 'us-east-1';
      
      if (s3Config.endpoint) {
        clientConfig.endpoint = s3Config.endpoint;
        clientConfig.forcePathStyle = s3Config.force_path_style || false;
      }
    }

    this.client = new S3Client(clientConfig);
  }

  async upload(
    key: string,
    data: ArrayBuffer | ReadableStream | Blob,
    options?: StorageUploadOptions
  ): Promise<void> {
    // Convert data to a format S3 can handle
    let body: any;
    
    if (data instanceof Blob) {
      // Convert Blob to ArrayBuffer for S3
      body = await data.arrayBuffer();
    } else if (data instanceof ArrayBuffer) {
      body = data;
    } else if (data instanceof ReadableStream) {
      // Convert ReadableStream to ArrayBuffer
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
    } else {
      body = data;
    }

    const params: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: options?.contentType,
      Metadata: options?.metadata,
    };

    try {
      await this.client.send(new PutObjectCommand(params));
    } catch (error: any) {
      console.error('S3 upload error:', error);
      throw new Error(`Failed to upload to S3: ${error.message}`);
    }
  }

  async download(key: string): Promise<Response> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        return new Response('Not found', { status: 404 });
      }

      // Convert the response body to a web stream
      const stream = response.Body as any;
      
      const headers = new Headers();
      if (response.ContentType) {
        headers.set('Content-Type', response.ContentType);
      }
      if (response.ContentLength) {
        headers.set('Content-Length', response.ContentLength.toString());
      }
      if (response.ETag) {
        headers.set('ETag', response.ETag);
      }
      if (response.LastModified) {
        headers.set('Last-Modified', response.LastModified.toUTCString());
      }

      // Handle the stream properly based on the environment
      // In Workers environment, we need to handle this differently
      if (stream.transformToWebStream) {
        return new Response(stream.transformToWebStream(), { headers });
      } else if (stream instanceof ReadableStream) {
        return new Response(stream, { headers });
      } else {
        // Fallback - collect all chunks into an ArrayBuffer
        const chunks: Uint8Array[] = [];
        const reader = stream.getReader ? stream.getReader() : stream;
        
        if (reader && reader.read) {
          // Handle as async iterator
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
        } else {
          // Handle as async iterable
          for await (const chunk of stream) {
            chunks.push(new Uint8Array(chunk));
          }
        }
        
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        
        return new Response(result.buffer, { headers });
      }
    } catch (error: any) {
      console.error('S3 download error:', error);
      if (error.name === 'NoSuchKey') {
        return new Response('Not found', { status: 404 });
      }
      throw new Error(`Failed to download from S3: ${error.message}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));
    } catch (error: any) {
      console.error('S3 delete error:', error);
      throw new Error(`Failed to delete from S3: ${error.message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      console.error('S3 exists check error:', error);
      throw new Error(`Failed to check existence in S3: ${error.message}`);
    }
  }

  async list(options?: StorageListOptions): Promise<StorageListResult> {
    try {
      const params: ListObjectsV2CommandInput = {
        Bucket: this.bucketName,
        MaxKeys: options?.maxKeys || 1000,
        Prefix: options?.prefix,
        ContinuationToken: options?.continuationToken,
      };

      const response = await this.client.send(new ListObjectsV2Command(params));
      
      const objects: StorageObject[] = (response.Contents || []).map(obj => ({
        key: obj.Key!,
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        etag: obj.ETag,
        metadata: {},
      }));

      return {
        objects,
        isTruncated: response.IsTruncated || false,
        continuationToken: response.NextContinuationToken,
      };
    } catch (error: any) {
      console.error('S3 list error:', error);
      throw new Error(`Failed to list objects in S3: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Try to list with limit 1 to test connection
      await this.list({ maxKeys: 1 });
      return true;
    } catch (error) {
      console.error('S3 connection test failed:', error);
      return false;
    }
  }
}