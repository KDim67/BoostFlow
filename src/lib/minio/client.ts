import { Client } from 'minio';

/**
 * MinIO Client Configuration for 3-VM Architecture:
 * - VM1 (20.91.227.216): Jenkins + Ansible Controller
 * - VM2 (4.223.113.211): NextJS Application + Nginx
 * - VM3 (4.223.116.59): MinIO Storage Server
 * 
 * This client connects from VM2 (app server) to VM3 (MinIO server)
 * External access is routed through https://minio.boostflow.me
 */

// Parse MinIO endpoint from environment
const parseMinioEndpoint = () => {
  const endpoint = process.env.MINIO_ENDPOINT;
  
  if (!endpoint) {
    throw new Error('MINIO_ENDPOINT environment variable is required.');
  }
  
  // Remove protocol if present
  const cleanEndpoint = endpoint.replace(/^https?:\/\//, '');
  const [host, portStr] = cleanEndpoint.split(':');
  const port = parseInt(portStr || '9000');
  
  return { host, port };
};

const { host: minioHost, port: minioPort } = parseMinioEndpoint();

// Get MinIO credentials from environment variables
const getMinioCredentials = () => {
  const accessKey = process.env.MINIO_ROOT_USER || process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_ROOT_PASSWORD || process.env.MINIO_SECRET_KEY;
  
  if (!accessKey || !secretKey) {
    throw new Error('MinIO credentials not found in environment variables. Please check MINIO_ROOT_USER/MINIO_ROOT_PASSWORD or MINIO_ACCESS_KEY/MINIO_SECRET_KEY in .env.local');
  }
  
  return { accessKey, secretKey };
};

const { accessKey: minioAccessKey, secretKey: minioSecretKey } = getMinioCredentials();

// Always use internal endpoint for API operations (server-to-server communication)
// External endpoint is only used for generating browser-accessible URLs
const clientConfig = {
  endPoint: minioHost,
  port: minioPort,
  useSSL: false,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey,
};

const minioClient = new Client(clientConfig);

// Bucket names
export const BUCKETS = {
  PROFILE_PICTURES: 'profile-pictures',
  ORGANIZATION_LOGOS: 'organization-logos',
  PROJECT_DOCUMENTS: 'project-documents',
} as const;

// Test MinIO connection
export async function testMinioConnection(): Promise<boolean> {
  try {
    console.log(`Testing MinIO connection to ${clientConfig.endPoint}:${clientConfig.port} (SSL: ${clientConfig.useSSL})`);
    console.log(`Using access key: ${minioAccessKey}`);
    
    // Try to list buckets as a connection test
    await minioClient.listBuckets();
    console.log('MinIO connection successful');
    return true;
  } catch (error) {
    console.error('MinIO connection failed:', error);
    console.error('MinIO config:', {
      endPoint: clientConfig.endPoint,
      port: clientConfig.port,
      useSSL: clientConfig.useSSL,
      accessKey: minioAccessKey
    });
    return false;
  }
}

// Initialize buckets
export async function initializeBuckets() {
  try {
    // Test connection first
    const connectionOk = await testMinioConnection();
    if (!connectionOk) {
      throw new Error('Failed to connect to MinIO server');
    }

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
    throw error; // Re-throw to let the calling function handle it
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
    console.log(`Uploading file to MinIO: bucket=${bucketName}, fileName=${fileName}, size=${fileBuffer.length}`);
    
    await minioClient.putObject(bucketName, fileName, fileBuffer, fileBuffer.length, {
      'Content-Type': contentType,
    });
    
    console.log(`File uploaded successfully: ${fileName}`);
    
    // Return the file URL using external endpoint for browser access
    const externalEndpoint = process.env.MINIO_EXTERNAL_ENDPOINT || process.env.MINIO_ENDPOINT;
    
    if (!externalEndpoint) {
      throw new Error('MINIO_EXTERNAL_ENDPOINT or MINIO_ENDPOINT environment variable is required for URL generation.');
    }
    
    // If external endpoint already includes protocol, use it as is
    if (externalEndpoint.startsWith('http://') || externalEndpoint.startsWith('https://')) {
      return `${externalEndpoint}/${bucketName}/${fileName}`;
    }
    
    // For production with domain names, use HTTPS; otherwise use HTTP
    const protocol = externalEndpoint.includes('.') && !externalEndpoint.includes('localhost') ? 'https://' : 'http://';
    return `${protocol}${externalEndpoint}/${bucketName}/${fileName}`;
  } catch (error) {
    console.error('Error uploading file to MinIO:', {
      error: error,
      bucketName,
      fileName,
      fileSize: fileBuffer.length,
      contentType,
      minioConfig: {
        endPoint: clientConfig.endPoint,
        port: clientConfig.port,
        useSSL: clientConfig.useSSL
      }
    });
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        accessKey: minioAccessKey,
        secretKey: minioSecretKey,
      });
      
      const presignedUrl = await externalClient.presignedGetObject(bucketName, fileName, expiry);
      
      // For the HTTPS nginx configuration, the S3 API is at the root path
      // No prefix modification needed as the root path routes to MinIO S3 API
      return presignedUrl;
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
    const pathParts = urlObj.pathname.split('/').filter(part => part !== '');
    
    let extractedPath: string | null = null;
    
    // URL format: http://endpoint/bucket/filename
    // or http://endpoint/minio/bucket/filename (with nginx proxy)
    if (pathParts.includes('minio') && pathParts.length >= 3) {
      // Handle nginx proxy format: /minio/bucket/organizationId/projectId/filename
      const minioIndex = pathParts.indexOf('minio');
      // Skip 'minio' and bucket name, return the full path including organizationId/projectId/filename
      extractedPath = pathParts.slice(minioIndex + 2).join('/');
    } else if (pathParts.length >= 2) {
      // Handle direct format: /bucket/organizationId/projectId/filename
      // Skip bucket name, return the full path including organizationId/projectId/filename
      extractedPath = pathParts.slice(1).join('/');
    }
    
    // Decode URL-encoded characters (spaces, non-English characters, etc.)
    if (extractedPath) {
      return decodeURIComponent(extractedPath);
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