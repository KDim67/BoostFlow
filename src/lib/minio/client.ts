import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT?.split(':')[0] || 'localhost',
  port: parseInt(process.env.MINIO_ENDPOINT?.split(':')[1] || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
});

// Bucket names
export const BUCKETS = {
  PROFILE_PICTURES: 'profile-pictures',
  ORGANIZATION_LOGOS: 'organization-logos',
  PROJECT_DOCUMENTS: 'project-documents',
} as const;

// Initialize buckets
export async function initializeBuckets() {
  try {
    for (const bucketName of Object.values(BUCKETS)) {
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName, 'us-east-1');
        console.log(`Created bucket: ${bucketName}`);
      }
      
      // Set public read policy for profile-pictures and organization-logos buckets (for both new and existing buckets)
      if (bucketName === BUCKETS.PROFILE_PICTURES || bucketName === BUCKETS.ORGANIZATION_LOGOS) {
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`]
            }
          ]
        };
        await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        console.log(`Set public read policy for bucket: ${bucketName}`);
      }
    }
  } catch (error) {
    console.error('Error initializing MinIO buckets:', error);
  }
}

// Generate unique filename
export function generateFileName(originalName: string, userId: string, fileType?: string): string {
  const extension = originalName.split('.').pop();
  
  // For profile pictures, use a consistent filename to overwrite previous uploads
  if (fileType === 'profile') {
    return `${userId}/profile.${extension}`;
  }
  
  // For organization logos, use a consistent filename to overwrite previous uploads
  if (fileType === 'logo') {
    return `${userId}/logo.${extension}`;
  }
  
  // For other files, use timestamp to avoid conflicts
  const timestamp = Date.now();
  const baseName = originalName.split('.').slice(0, -1).join('.');
  return `${userId}/${timestamp}-${baseName}.${extension}`;
}

// Upload file to MinIO
export async function uploadFile(
  bucketName: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  try {
    await minioClient.putObject(bucketName, fileName, fileBuffer, fileBuffer.length, {
      'Content-Type': contentType,
    });
    
    // Return the file URL using external endpoint for browser access
    const externalEndpoint = process.env.MINIO_EXTERNAL_ENDPOINT || process.env.MINIO_ENDPOINT || 'localhost:9000';
    
    // If external endpoint already includes protocol, use it as is
    if (externalEndpoint.startsWith('http://') || externalEndpoint.startsWith('https://')) {
      return `${externalEndpoint}/${bucketName}/${fileName}`;
    }
    
    // Otherwise, add http protocol for backward compatibility
    return `http://${externalEndpoint}/${bucketName}/${fileName}`;
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    throw new Error('Failed to upload file');
  }
}

// Get presigned URL for file access
export async function getPresignedUrl(
  bucketName: string,
  fileName: string,
  expiry: number = 24 * 60 * 60 // 24 hours
): Promise<string> {
  try {
    // Check if we're in production with external endpoint
    const externalEndpoint = process.env.MINIO_EXTERNAL_ENDPOINT;
    
    if (externalEndpoint && externalEndpoint !== 'localhost:9000') {
      // Parse the external endpoint properly
      let endPoint: string;
      let port: number;
      let useSSL: boolean;
      
      if (externalEndpoint.startsWith('https://')) {
        useSSL = true;
        const cleanEndpoint = externalEndpoint.replace('https://', '').split('/')[0];
        const parts = cleanEndpoint.split(':');
        endPoint = parts[0];
        port = parts[1] ? parseInt(parts[1]) : 443;
      } else if (externalEndpoint.startsWith('http://')) {
        useSSL = false;
        const cleanEndpoint = externalEndpoint.replace('http://', '').split('/')[0];
        const parts = cleanEndpoint.split(':');
        endPoint = parts[0];
        port = parts[1] ? parseInt(parts[1]) : 80;
      } else {
        // No protocol specified, assume https for production domains
        useSSL = externalEndpoint.includes('.');
        const parts = externalEndpoint.split('/')[0].split(':');
        endPoint = parts[0];
        port = parts[1] ? parseInt(parts[1]) : (useSSL ? 443 : 80);
      }
      
      // In production, create a new MinIO client with the external endpoint for presigned URLs
      // This ensures the signature is calculated with the correct host that will be used
      const externalClient = new Client({
        endPoint,
        port,
        useSSL,
        accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
        secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
      });
      
      const presignedUrl = await externalClient.presignedGetObject(bucketName, fileName, expiry);
      
      // Add /minio/ prefix to the path for nginx proxy routing
      const url = new URL(presignedUrl);
      url.pathname = '/minio' + url.pathname;
      
      return url.toString();
    } else {
      // For local development, use the original client
      const presignedUrl = await minioClient.presignedGetObject(bucketName, fileName, expiry);
      return presignedUrl;
    }
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate file URL');
  }
}

// Delete file from MinIO
export async function deleteFile(bucketName: string, fileName: string): Promise<void> {
  try {
    await minioClient.removeObject(bucketName, fileName);
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
    throw new Error('Failed to delete file');
  }
}

// List files in bucket
export async function listFiles(bucketName: string, prefix?: string): Promise<any[]> {
  try {
    const files: any[] = [];
    const stream = minioClient.listObjects(bucketName, prefix, true);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => files.push(obj));
      stream.on('error', reject);
      stream.on('end', () => resolve(files));
    });
  } catch (error) {
    console.error('Error listing files from MinIO:', error);
    throw new Error('Failed to list files');
  }
}

// Extract filename from MinIO URL
export function extractFileNameFromUrl(url: string): string | null {
  try {
    // Remove cache-busting parameters first
    const cleanUrl = url.split('?')[0];
    
    // Handle both external and internal endpoint formats
    const urlObj = new URL(cleanUrl);
    const pathParts = urlObj.pathname.split('/');
    
    // URL format: http://endpoint/bucket/filename
    // or http://endpoint/minio/bucket/filename (with nginx proxy)
    if (pathParts.includes('minio') && pathParts.length >= 4) {
      // Handle nginx proxy format: /minio/bucket/filename
      const minioIndex = pathParts.indexOf('minio');
      return pathParts.slice(minioIndex + 2).join('/'); // Skip 'minio' and bucket
    } else if (pathParts.length >= 3) {
      // Handle direct format: /bucket/filename
      return pathParts.slice(2).join('/'); // Join in case filename has slashes
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting filename from URL:', error);
    return null;
  }
}

// Delete file by URL
export async function deleteFileByUrl(url: string, bucketName: string): Promise<void> {
  try {
    const fileName = extractFileNameFromUrl(url);
    if (!fileName) {
      console.warn('Could not extract filename from URL:', url);
      return;
    }
    
    await deleteFile(bucketName, fileName);
    console.log(`Deleted old file: ${fileName} from bucket: ${bucketName}`);
  } catch (error) {
    console.error('Error deleting file by URL:', error);
    // Don't throw error to prevent upload failure if old file deletion fails
  }
}

export default minioClient;