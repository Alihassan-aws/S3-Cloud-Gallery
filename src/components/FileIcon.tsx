
import React from 'react';
import { 
  Folder, 
  File, 
  FileText, 
  FileCode, 
  FileImage, 
  FileType,
  FileArchive,
  Music,
  Video 
} from 'lucide-react';

interface FileIconProps {
  fileName: string;
  isFolder: boolean;
  className?: string;
}

const FileIcon: React.FC<FileIconProps> = ({ fileName, isFolder, className = "h-6 w-6" }) => {
  if (isFolder) return <Folder className={`${className} text-yellow-500 dark:text-yellow-400`} />;
  
  // Determine icon based on file extension
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return <FileImage className={`${className} text-emerald-500 dark:text-emerald-400`} />;
  }
  
  // Text files
  if (['txt', 'md', 'log', 'json', 'xml', 'csv'].includes(ext)) {
    return <FileText className={`${className} text-blue-500 dark:text-blue-400`} />;
  }
  
  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'php', 'py', 'java', 'c', 'cpp', 'rb', 'go'].includes(ext)) {
    return <FileCode className={`${className} text-violet-500 dark:text-violet-400`} />;
  }
  
  // PDF files
  if (ext === 'pdf') {
    return <FileType className={`${className} text-red-500 dark:text-red-400`} />;
  }
  
  // Archive files
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return <FileArchive className={`${className} text-amber-500 dark:text-amber-400`} />;
  }
  
  // Audio files
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) {
    return <Music className={`${className} text-pink-500 dark:text-pink-400`} />;
  }
  
  // Video files
  if (['mp4', 'webm', 'mov', 'avi', 'wmv', 'mkv', 'flv'].includes(ext)) {
    return <Video className={`${className} text-indigo-500 dark:text-indigo-400`} />;
  }
  
  // Default file icon
  return <File className={`${className} text-gray-500 dark:text-gray-400`} />;
};

export default FileIcon;
