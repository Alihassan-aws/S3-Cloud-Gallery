import React, { useState, useRef, useEffect } from 'react';
import AWS from 'aws-sdk';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Check, X, Folder, ImagePlus } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listS3Folders, uploadFilesToS3 } from '@/services/s3Service';

const configureAWS = () => {
  AWS.config.update({
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    region: import.meta.env.VITE_AWS_REGION,
  });
};

configureAWS();

interface FileUploaderProps {
  onUploadComplete?: (fileUrls: string | string[]) => void;
  currentPrefix?: string;
  multiple?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  currentPrefix = '',
  multiple = false,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const [multipleFiles, setMultipleFiles] = useState<boolean>(multiple);
  const [availableFolders, setAvailableFolders] = useState<string[]>(['root']);
  const [selectedFolder, setSelectedFolder] = useState<string>('root');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMultipleFiles(multiple);
  }, [multiple]);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const folders = await listS3Folders();
        const validFolders = folders.filter(folder => folder !== '');
        if (!validFolders.includes('root')) validFolders.unshift('root');
        setAvailableFolders(validFolders);
      } catch (err) {
        console.error("Error loading folders:", err);
        setAvailableFolders(['root']);
      }
    };
    loadFolders();
  }, []);

  useEffect(() => {
    if (currentPrefix) {
      setSelectedFolder(currentPrefix || 'root');
    }
  }, [currentPrefix]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(multipleFiles ? filesArray : [filesArray[0]]);
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
      const folderPath = selectedFolder === 'root' ? '' : selectedFolder;
      const uploadedUrls = await uploadFilesToS3(selectedFiles, folderPath, setProgress);
      setProgress(100);
      setUploadComplete(true);
      toast.success(`${selectedFiles.length} file(s) uploaded successfully!`);
      onUploadComplete?.(uploadedUrls);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload file(s).");
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 2000);
    }
  };

  const triggerFileInput = () => {
    if (!isUploading) fileInputRef.current?.click();
  };

  const toggleMultipleFiles = () => {
    setMultipleFiles(!multipleFiles);
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFolderDisplayName = (path: string) => {
    return path === 'root' || path === '' ? 'Root' : path.split('/').filter(Boolean).pop() || 'Root';
  };

  return (
    <div className="w-full max-w-xl mx-auto text-center space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex items-center space-x-2">
          <Switch id="multiple-files" checked={multipleFiles} onCheckedChange={toggleMultipleFiles} />
          <Label htmlFor="multiple-files">Multiple files</Label>
        </div>

        <div className="w-full sm:w-1/2">
          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger className="w-full">
              <div className="flex items-center">
                <Folder className="h-4 w-4 mr-2 text-yellow-500" />
                <SelectValue placeholder="Select folder">{getFolderDisplayName(selectedFolder)}</SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {availableFolders.map(folder => (
                <SelectItem key={folder} value={folder}>
                  <div className="flex items-center">
                    <Folder className="h-4 w-4 mr-2 text-yellow-500" />
                    {getFolderDisplayName(folder)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Select Media Button */}
      <div className="flex flex-col items-center space-y-2">
        <Button
          onClick={triggerFileInput}
          disabled={isUploading}
          className="flex items-center justify-center space-x-2 px-6 py-3 text-lg font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <ImagePlus className="w-5 h-5" />
          <span>Select Media</span>
        </Button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isUploading}
          multiple={multipleFiles}
          className="hidden"
        />

        {selectedFiles.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected ({(selectedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB)
          </div>
        )}
      </div>

      {/* File list */}
      {selectedFiles.length > 0 && (
        <div className="max-h-48 overflow-y-auto border rounded-md shadow-sm">
          <ul className="divide-y">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex justify-between items-center px-3 py-2">
                <span className="truncate text-sm">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                  className="h-6 w-6 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="w-full">
          <div className="flex justify-between mb-1 text-sm font-medium">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
          className={`bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all ${
            selectedFiles.length === 0 || isUploading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-105 active:scale-95'
          }`}
        >
          {isUploading ? (
            <>
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Uploading...
            </>
          ) : uploadComplete ? (
            <>
              <Check className="mr-2 h-5 w-5" /> Uploaded
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" /> Upload to S3
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FileUploader;
