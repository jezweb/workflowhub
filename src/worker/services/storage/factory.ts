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
    // If using binding, try to use the STORAGE binding
    if (config.use_binding) {
      // Check if STORAGE binding is available
      if (env.STORAGE) {
        // Note: In the current setup, the STORAGE binding is configured for "workflowhub-files"
        // If the bucket name matches or if we want to use the binding regardless, use it
        // You may need to configure multiple R2 bindings in wrangler.toml for different buckets
        console.log(`Using R2 binding for bucket: ${config.bucket_name}`);
        return new R2Provider(config, env.STORAGE);
      } else {
        console.warn(`R2 binding requested but STORAGE binding not available for bucket: ${config.bucket_name}`);
        // Fall through to non-binding mode
      }
    }
    
    // For non-binding mode or when binding is not available
    if (!config.use_binding && (!config.account_id || !config.access_key_id || !config.secret_access_key)) {
      console.error('R2 configuration incomplete - missing required credentials');
    }
    
    return new R2Provider(config);
  }

  /**
   * Create S3 provider
   * Handles AWS S3, Vultr, MinIO, and any S3-compatible service
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