import AWS from 'aws-sdk';
import { toast } from '@/components/ui/sonner';

// Configure AWS
const configureAWS = () => {
  const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
  const region = import.meta.env.VITE_AWS_REGION;

  // Check if credentials are available and log appropriate messages (without exposing values)
  if (!accessKeyId || !secretAccessKey || !region) {
    console.error("AWS credentials or region not found in environment variables");
  } else {
    console.log("AWS configuration initialized with region:", region);
  }

  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
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

// Improved error handling for S3 operations
const handleS3Error = (error: any, operation: string): void => {
  console.error(`Error during S3 operation (${operation}):`, error);
  
  // Extract more meaningful error messages
  let errorMessage = 'An error occurred while accessing your files';
  
  if (error instanceof Error) {
    console.error('Error details:', error.message);
    
    if (error.message.includes('AccessDenied') || error.message.includes('not authorized')) {
      errorMessage = 'Access denied. Check your AWS credentials and bucket permissions.';
    } else if (error.message.includes('NoSuchBucket')) {
      errorMessage = 'The specified bucket does not exist.';
    } else if (error.message.includes('NetworkingError') || error.message.includes('Network')) {
      errorMessage = 'Network error. Check your internet connection.';
    } else {
      errorMessage = `Error: ${error.message}`;
    }
  }
  
  toast.error(errorMessage, {
    duration: 5000,
  });
};

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
    
    // Process files - filter out current folder prefix marker
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
    handleS3Error(error, 'listS3Objects');
    return []; // Return empty array on error
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
    handleS3Error(error, 'getS3FileUrl');
    throw error;
  }
}

export async function deleteS3Object(key: string): Promise<AWS.S3.DeleteObjectOutput> {
  const params = {
    Bucket: import.meta.env.VITE_AWS_S3_BUCKET_NAME,
    Key: key
  };
  
  try {
    const result = await s3.deleteObject(params).promise();
    toast.success('File deleted successfully');
    return result;
  } catch (error) {
    handleS3Error(error, 'deleteS3Object');
    throw error;
  }
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
    toast.success(`Folder "${folderName}" created successfully`);
  } catch (error) {
    handleS3Error(error, 'createS3Folder');
    throw error;
  }
}

export async function listS3Folders(): Promise<string[]> {
  try {
    const params = {
      Bucket: import.meta.env.VITE_AWS_S3_BUCKET_NAME,
      Delimiter: '/'
    };
    
    const response = await s3.listObjectsV2(params).promise();
    
    // Extract folder paths from CommonPrefixes
    const folders: string[] = [''];  // Add root folder as an option
    
    if (response.CommonPrefixes && response.CommonPrefixes.length > 0) {
      response.CommonPrefixes.forEach(prefix => {
        if (prefix.Prefix) {
          folders.push(prefix.Prefix);
        }
      });
    }
    
    return folders;
  } catch (error) {
    handleS3Error(error, 'listS3Folders');
    return [''];  // Return at least the root folder on error
  }
}

export async function uploadFilesToS3(
  files: File[], 
  destinationFolder: string = '', 
  progressCallback?: (progress: number) => void
): Promise<string[]> {
  const uploadedUrls: string[] = [];
  let totalProgress = 0;
  
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileKey = destinationFolder + file.name;
      
      const params = {
        Bucket: import.meta.env.VITE_AWS_S3_BUCKET_NAME,
        Key: fileKey,
        Body: file,
        ContentType: file.type,
      };
      
      // Use upload instead of putObject to get progress
      const upload = s3.upload(params);
      
      if (progressCallback && files.length === 1) {
        upload.on('httpUploadProgress', (progress) => {
          const percentage = Math.round((progress.loaded / progress.total) * 100);
          progressCallback(percentage);
        });
      }
      
      await upload.promise();
      
      const fileUrl = getS3FileUrl(fileKey);
      uploadedUrls.push(fileUrl);
      
      // Update total progress for multiple files
      if (progressCallback && files.length > 1) {
        totalProgress += (1 / files.length) * 100;
        progressCallback(Math.round(totalProgress));
      }
      
      console.log(`File uploaded successfully: ${fileKey}`);
    }
    
    toast.success(`${files.length > 1 ? files.length + ' files' : 'File'} uploaded successfully`);
    return uploadedUrls;
  } catch (error) {
    handleS3Error(error, 'uploadFilesToS3');
    throw error;
  }
}
