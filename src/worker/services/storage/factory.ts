// Storage Provider Factory

// Using any to avoid R2 type conflicts
import type { Env } from '../../types';
import { R2Provider } from './r2-provider';
import { S3Provider } from './s3-provider';
import type { StorageProvider, StorageBucket, R2Config, S3Config } from './types';

export class StorageFactory {
  /**
   * Create a storage provider from a bucket configuration
   */
  static createProvider(bucket: StorageBucket, env: Env): StorageProvider {
    const config = JSON.parse(bucket.config_json);

    switch (bucket.provider) {
      case 'r2':
        return StorageFactory.createR2Provider(config as R2Config, env);
      
      case 's3':
        return StorageFactory.createS3Provider(config as S3Config);
      
      default:
        throw new Error(`Unsupported storage provider: ${bucket.provider}`);
    }
  }

  /**
   * Create R2 provider with binding support
   */
  private static createR2Provider(config: R2Config, env: Env): R2Provider {
    // If using binding and it's the default bucket, use the STORAGE binding
    if (config.use_binding && config.bucket_name === 'workflowhub-files') {
      return new R2Provider(config, env.STORAGE);
    }
    
    // For other R2 buckets, would need API access (not yet implemented)
    return new R2Provider(config);
  }

  /**
   * Create S3 provider
   */
  private static createS3Provider(config: S3Config): S3Provider {
    return new S3Provider(config);
  }

  /**
   * Get bucket by ID from database
   */
  static async getBucket(env: Env, bucketId: string): Promise<StorageBucket | null> {
    const result = await env.DB
      .prepare('SELECT * FROM storage_buckets WHERE id = ?')
      .bind(bucketId)
      .first<StorageBucket>();
    
    return result;
  }

  /**
   * Get default bucket for a specific purpose
   */
  static async getDefaultBucket(
    env: Env, 
    purpose: 'general' | 'chat' | 'forms' = 'general'
  ): Promise<StorageBucket | null> {
    let query = 'SELECT * FROM storage_buckets WHERE ';
    
    switch (purpose) {
      case 'chat':
        query += 'is_default_chat = TRUE';
        break;
      case 'forms':
        query += 'is_default_forms = TRUE';
        break;
      default:
        query += 'is_default = TRUE';
    }
    
    const result = await env.DB
      .prepare(query)
      .first<StorageBucket>();
    
    return result;
  }

  /**
   * List all buckets
   */
  static async listBuckets(env: Env): Promise<StorageBucket[]> {
    const result = await env.DB
      .prepare('SELECT * FROM storage_buckets ORDER BY created_at DESC')
      .all<StorageBucket>();
    
    return result.results || [];
  }

  /**
   * Encrypt sensitive configuration
   * In production, use proper encryption with KMS or similar
   */
  static encryptConfig(config: any): string {
    // For now, just stringify - in production, encrypt properly
    return JSON.stringify(config);
  }

  /**
   * Decrypt sensitive configuration
   */
  static decryptConfig(encryptedConfig: string): any {
    // For now, just parse - in production, decrypt properly
    return JSON.parse(encryptedConfig);
  }
}