
import AWS from 'aws-sdk';

// Ensure we have the S3 service initialized
const s3 = new AWS.S3();

export interface S3Item {
  Key: string;
  Size?: number;
  LastModified?: Date;
  isFolder: boolean;
  ContentType?: string;
}

export async function listS3Objects(prefix = ''): Promise<S3Item[]> {
  try {
    const params = {
      Bucket: import.meta.env.VITE_AWS_S3_BUCKET_NAME,
      Delimiter: '/',
      Prefix: prefix
    };

    const response = await s3.listObjectsV2(params).promise();
    
    // Process folders (CommonPrefixes)
    const folders: S3Item[] = (response.CommonPrefixes || []).map(prefix => ({
      Key: prefix.Prefix || '',
      isFolder: true
    }));
    
    // Process files
    const files: S3Item[] = (response.Contents || [])
      .filter(item => item.Key !== prefix) // Filter out the current prefix itself
      .map(item => ({
        Key: item.Key || '',
        Size: item.Size,
        LastModified: item.LastModified,
        isFolder: false,
        ContentType: item.Key?.split('.').pop() || ''
      }));
    
    return [...folders, ...files];
  } catch (error) {
    console.error('Error listing S3 objects:', error);
    throw error;
  }
}

export function getS3FileUrl(key: string): string {
  return s3.getSignedUrl('getObject', {
    Bucket: import.meta.env.VITE_AWS_S3_BUCKET_NAME,
    Key: key,
    Expires: 60 * 60 // 1 hour
  });
}

export function deleteS3Object(key: string): Promise<AWS.S3.DeleteObjectOutput> {
  const params = {
    Bucket: import.meta.env.VITE_AWS_S3_BUCKET_NAME,
    Key: key
  };
  
  return s3.deleteObject(params).promise();
}
