
import React, { useState, useRef, useCallback } from 'react';
import AWS from 'aws-sdk';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// Configure AWS
AWS.config.update({
  accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  region: import.meta.env.VITE_AWS_REGION,
});

const s3 = new AWS.S3();

interface FileUploaderProps {
  onUploadComplete?: (fileUrl: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    const fileName = `${Date.now()}-${selectedFile.name}`;
    const params = {
      Bucket: import.meta.env.VITE_AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: selectedFile,
      ContentType: selectedFile.type,
    };

    try {
      setIsUploading(true);
      setProgress(0);

      const upload = s3.upload(params);

      upload.on('httpUploadProgress', (evt) => {
        const percentage = Math.round((evt.loaded * 100) / evt.total);
        setProgress(percentage);
      });

      const data = await upload.promise();
      
      setProgress(100);
      toast.success("File uploaded successfully!");
      
      if (onUploadComplete) {
        onUploadComplete(data.Location);
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 mb-4 transition-colors ${
          isDragging ? 'border-upload-blue bg-blue-50' : 'border-gray-300'
        } ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isUploading ? triggerFileInput : undefined}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange} 
            disabled={isUploading}
          />
          <p className="mb-2 text-lg font-medium">
            {selectedFile ? selectedFile.name : "Drag & drop file here or click to browse"}
          </p>
          <p className="text-sm text-gray-500">
            {selectedFile 
              ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` 
              : "Supports any file type"}
          </p>
        </div>
      </div>

      {isUploading && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Uploading...</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      <div className="flex justify-center">
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || isUploading}
          className={`bg-upload-blue hover:bg-upload-blue-dark text-white ${
            !selectedFile || isUploading ? 'opacity-50' : ''
          }`}
        >
          {isUploading ? 'Uploading...' : 'Upload to S3'}
        </Button>
      </div>
    </div>
  );
};

export default FileUploader;
