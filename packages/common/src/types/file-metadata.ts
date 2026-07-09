/**
 * TypeScript interfaces for file metadata.
 * Covers file upload tracking, S3 storage, and migration.
 */

/**
 * TerraAI file upload record from the `uploads` table.
 */
export interface FileUploadRecord {
  /** Auto-increment primary key */
  id: number;
  /** User who uploaded the file */
  userId: number;
  /** Original filename as uploaded by the user */
  originalFilename: string;
  /** S3 key assigned after migration (null if not yet migrated) */
  s3Key: string | null;
  /** File size in bytes */
  fileSizeBytes: number;
  /** MIME type of the file */
  mimeType: string;
  /** ISO timestamp of upload */
  createdAt: string;
}

/**
 * Metadata for a file stored in S3 after migration.
 */
export interface S3FileMetadata {
  /** The S3 bucket name */
  bucket: string;
  /** The S3 object key (preserves original directory structure) */
  key: string;
  /** File size in bytes */
  sizeBytes: number;
  /** MIME content type */
  contentType: string;
  /** The original filename */
  originalFilename: string;
  /** ISO timestamp when the file was uploaded to S3 */
  uploadedAt: string;
  /** ETag from S3 (MD5 hash for non-multipart uploads) */
  etag?: string;
}

/**
 * Pre-signed URL response for file retrieval.
 */
export interface FileRetrievalResponse {
  /** The pre-signed S3 URL for downloading */
  url: string;
  /** When the URL expires (ISO 8601) */
  expiresAt: string;
  /** Content type of the file */
  contentType: string;
  /** Original filename (for Content-Disposition) */
  filename: string;
}

/**
 * File upload request validation result.
 */
export interface FileUploadValidation {
  /** Whether the file is valid for upload */
  valid: boolean;
  /** If invalid, the reason */
  reason?: string;
  /** File size in bytes */
  sizeBytes: number;
  /** MIME type */
  mimeType: string;
}

/** Maximum allowed file size for uploads (50 MB) */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * File migration result for a single file.
 */
export interface FileMigrationEntry {
  /** Source path (relative from TerraAI upload directory) */
  sourcePath: string;
  /** Destination S3 key */
  destKey: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Whether the copy was successful */
  success: boolean;
  /** If failed, the error message */
  error?: string;
}
