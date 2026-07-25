import { Injectable } from '@nestjs/common';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface StorageFile {
  name: string;
  path: string;
  size?: number;
  lastModified?: string;
}

export interface StorageListResult {
  data: StorageFile[];
  error: string | null;
}

export interface SignedUrlResult {
  data: string | null;
  error: string | null;
}

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'lekha-storage';
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'ap-southeast-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * List files under a given prefix (path) in the storage bucket.
   * The prefix is constructed as `{companyId}/{path}`.
   */
  async list(companyId: string, path: string): Promise<StorageListResult> {
    try {
      const prefix = `${companyId}/${path}`;
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      });

      const response = await this.client.send(command);

      const files: StorageFile[] = (response.Contents || [])
        .filter((obj) => obj.Key && !obj.Key.endsWith('/'))
        .map((obj) => ({
          name: obj.Key!.split('/').pop() || '',
          path: obj.Key!,
          size: obj.Size,
          lastModified: obj.LastModified?.toISOString(),
        }));

      return { data: files, error: null };
    } catch (error: any) {
      return { data: [], error: error.message || 'Failed to list files' };
    }
  }

  /**
   * Generate a pre-signed URL for reading a file from the storage bucket.
   * The object key is `{companyId}/{path}`.
   */
  async getSignedUrl(
    companyId: string,
    path: string,
    options?: { expiresIn?: number },
  ): Promise<SignedUrlResult> {
    try {
      const key = path.startsWith(`${companyId}/`) ? path : `${companyId}/${path}`;
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn: options?.expiresIn || 3600,
      });

      return { data: url, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to generate signed URL' };
    }
  }
}