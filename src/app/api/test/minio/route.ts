import { NextRequest, NextResponse } from 'next/server';
import { testMinioConnection, initializeBuckets } from '@/lib/minio/client';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing MinIO connection...');
    console.log('Environment variables:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('MINIO_ENDPOINT:', process.env.MINIO_ENDPOINT);
    console.log('MINIO_EXTERNAL_ENDPOINT:', process.env.MINIO_EXTERNAL_ENDPOINT);
    console.log('MINIO_ROOT_USER:', process.env.MINIO_ROOT_USER);
    
    // Test basic connection
    const connectionOk = await testMinioConnection();
    
    if (!connectionOk) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to MinIO server',
        config: {
          endpoint: process.env.MINIO_ENDPOINT,
          externalEndpoint: process.env.MINIO_EXTERNAL_ENDPOINT,
          hasAccessKey: !!(process.env.MINIO_ROOT_USER || process.env.MINIO_ACCESS_KEY),
          hasSecretKey: !!(process.env.MINIO_ROOT_PASSWORD || process.env.MINIO_SECRET_KEY)
        }
      }, { status: 500 });
    }
    
    // Test bucket initialization
    await initializeBuckets();
    
    return NextResponse.json({
      success: true,
      message: 'MinIO connection and bucket initialization successful',
      config: {
        endpoint: process.env.MINIO_ENDPOINT,
        externalEndpoint: process.env.MINIO_EXTERNAL_ENDPOINT,
        hasAccessKey: !!(process.env.MINIO_ROOT_USER || process.env.MINIO_ACCESS_KEY),
        hasSecretKey: !!(process.env.MINIO_ROOT_PASSWORD || process.env.MINIO_SECRET_KEY)
      }
    });
  } catch (error) {
    console.error('MinIO test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        endpoint: process.env.MINIO_ENDPOINT,
        externalEndpoint: process.env.MINIO_EXTERNAL_ENDPOINT,
        hasAccessKey: !!(process.env.MINIO_ROOT_USER || process.env.MINIO_ACCESS_KEY),
        hasSecretKey: !!(process.env.MINIO_ROOT_PASSWORD || process.env.MINIO_SECRET_KEY)
      }
    }, { status: 500 });
  }
}