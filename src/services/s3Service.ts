
import AWS from 'aws-sdk';

// Configure AWS
const configureAWS = () => {
  AWS.config.update({
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    region: import.meta.env.VITE_AWS_REGION,
  });
};

// Initialize AWS configuration
configureAWS();

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

    console.log('Listing S3 objects with params:', params);
    
    const response = await s3.listObjectsV2(params).promise();
    console.log('S3 response:', response);
    
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
  try {
    return s3.getSignedUrl('getObject', {
      Bucket: import.meta.env.VITE_AWS_S3_BUCKET_NAME,
      Key: key,
      Expires: 60 * 60 // 1 hour
    });
  } catch (error) {
    console.error('Error getting S3 file URL:', error);
    throw error;
  }
}

export function deleteS3Object(key: string): Promise<AWS.S3.DeleteObjectOutput> {
  const params = {
    Bucket: import.meta.env.VITE_AWS_S3_BUCKET_NAME,
    Key: key
  };
  
  return s3.deleteObject(params).promise();
}

export async function createS3Folder(folderName: string, currentPrefix = ''): Promise<void> {
  // Ensure the folder name ends with a slash to indicate it's a directory
  let fullPath = currentPrefix + folderName;
  if (!fullPath.endsWith('/')) {
    fullPath += '/';
  }
  
  const params = {
    Bucket: import.meta.env.VITE_AWS_S3_BUCKET_NAME,
    Key: fullPath,
    Body: '' // Empty content as it's just a directory marker
  };
  
  try {
    await s3.putObject(params).promise();
  } catch (error) {
    console.error('Error creating S3 folder:', error);
    throw error;
  }
}

