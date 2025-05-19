
import React, { useState, useRef, useCallback } from 'react';
import AWS from 'aws-sdk';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, File, Check, X } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
const s3 = new AWS.S3();

interface FileUploaderProps {
  onUploadComplete?: (fileUrl: string) => void;
  currentPrefix?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUploadComplete, currentPrefix = '' }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const [multipleFiles, setMultipleFiles] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      setUploadComplete(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select file(s) to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setProgress(0);
      setUploadComplete(false);

      let uploadedFilesCount = 0;
      const totalFiles = selectedFiles.length;
      let lastUploadedFileUrl = '';

      for (const file of selectedFiles) {
        const fileName = `${currentPrefix}${Date.now()}-${file.name}`;
        const params = {
          Bucket: import.meta.env.VITE_AWS_S3_BUCKET_NAME,
          Key: fileName,
          Body: file,
          ContentType: file.type,
        };

        const upload = s3.upload(params);

        upload.on('httpUploadProgress', (evt) => {
          const fileProgress = Math.round((evt.loaded * 100) / evt.total);
          const overallProgress = Math.round(((uploadedFilesCount * 100) + fileProgress) / totalFiles);
          setProgress(overallProgress);
        });

        const data = await upload.promise();
        lastUploadedFileUrl = data.Location;
        uploadedFilesCount++;
      }

      setProgress(100);
      setUploadComplete(true);
      toast.success(`${totalFiles} file${totalFiles > 1 ? 's' : ''} uploaded successfully!`);
      
      // Only call onUploadComplete with the last file's URL
      if (onUploadComplete && lastUploadedFileUrl) {
        onUploadComplete(lastUploadedFileUrl);
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      toast.error("Failed to upload file(s). Please try again.");
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000); // Keep the file visible for 2 seconds after completion
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
      const filesArray = Array.from(e.dataTransfer.files);
      
      if (!multipleFiles && filesArray.length > 1) {
        // If multiple mode is off but multiple files are dropped, take only the first one
        setSelectedFiles([filesArray[0]]);
      } else {
        setSelectedFiles(filesArray);
      }
      setUploadComplete(false);
    }
  }, [multipleFiles]);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getFileIcon = () => {
    if (uploadComplete) {
      return <Check className="w-12 h-12 mb-4 text-green-500 animate-scale-in" />;
    }
    if (selectedFiles.length > 0) {
      return <File className="w-12 h-12 mb-4 text-upload-blue" />;
    }
    return <Upload className="w-12 h-12 mb-4 text-gray-400 animate-bounce" />;
  };

  const toggleMultipleFiles = () => {
    setMultipleFiles(!multipleFiles);
    // Clear selected files when switching modes
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center justify-end space-x-2 mb-4">
        <Switch 
          id="multiple-files" 
          checked={multipleFiles}
          onCheckedChange={toggleMultipleFiles}
        />
        <Label htmlFor="multiple-files">Multiple files</Label>
      </div>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-6 mb-4 transition-all duration-300 ${
          isDragging ? 'border-upload-blue bg-blue-50 dark:bg-blue-900/20 scale-105' : 
          uploadComplete ? 'border-green-500' : 'border-gray-300'
        } ${isUploading ? 'pointer-events-none opacity-70' : ''} hover:border-upload-blue`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isUploading ? triggerFileInput : undefined}
      >
        <div className="flex flex-col items-center justify-center text-center">
          {getFileIcon()}
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange} 
            disabled={isUploading}
            multiple={multipleFiles}
          />
          <p className="mb-2 text-lg font-medium">
            {selectedFiles.length > 0 
              ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected` 
              : "Drag & drop file here or click to browse"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedFiles.length > 0 
              ? `Total size: ${(selectedFiles.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)).toFixed(2)} MB` 
              : `Supports any file type${multipleFiles ? 's' : ''}`}
          </p>
        </div>
      </div>

      {selectedFiles.length > 1 && (
        <div className="mb-4 max-h-40 overflow-y-auto border rounded-md">
          <ul className="divide-y">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="truncate flex-1">
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="h-6 w-6 rounded-full"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isUploading && (
        <div className="mb-4 animate-fade-in">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Uploading...</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 transition-all duration-300" />
        </div>
      )}

      <div className="flex justify-center">
        <Button 
          onClick={handleUpload} 
          disabled={selectedFiles.length === 0 || isUploading}
          className={`bg-upload-blue hover:bg-upload-blue-dark text-white transition-all duration-300 ${
            selectedFiles.length === 0 || isUploading ? 'opacity-50' : 'hover:scale-105'
          }`}
        >
          {isUploading ? (
            <>
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Uploading...
            </>
          ) : uploadComplete ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Uploaded
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Upload to S3
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FileUploader;
