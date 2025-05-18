
import React, { useState, useEffect } from 'react';
import { listS3Objects, getS3FileUrl, deleteS3Object, S3Item } from '@/services/s3Service';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder, Image, File, MoreVertical, ArrowLeft, Trash2, Eye, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FileBrowserProps {
  onSelect?: (fileUrl: string) => void;
  showHeader?: boolean;
}

const FileBrowser: React.FC<FileBrowserProps> = ({ onSelect, showHeader = true }) => {
  const [items, setItems] = useState<S3Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [prefixHistory, setPrefixHistory] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadItems = async (prefix: string) => {
    setLoading(true);
    try {
      const data = await listS3Objects(prefix);
      setItems(data);
    } catch (error) {
      toast.error("Failed to load files");
      console.error("Error loading files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(currentPrefix);
  }, [currentPrefix]);

  const navigateToFolder = (key: string) => {
    setPrefixHistory(prev => [...prev, currentPrefix]);
    setCurrentPrefix(key);
  };

  const navigateBack = () => {
    if (prefixHistory.length > 0) {
      const previousPrefix = prefixHistory[prefixHistory.length - 1];
      setPrefixHistory(prev => prev.slice(0, -1));
      setCurrentPrefix(previousPrefix);
    }
  };

  const handleItemClick = (item: S3Item) => {
    if (item.isFolder) {
      navigateToFolder(item.Key);
    } else {
      const fileUrl = getS3FileUrl(item.Key);
      
      if (onSelect) {
        onSelect(fileUrl);
      } else {
        // If no selection handler, preview the file
        window.open(fileUrl, '_blank');
      }
    }
  };

  const handleDeleteItem = async (item: S3Item) => {
    try {
      await deleteS3Object(item.Key);
      toast.success(`${item.isFolder ? 'Folder' : 'File'} deleted successfully`);
      loadItems(currentPrefix);
    } catch (error) {
      toast.error(`Failed to delete ${item.isFolder ? 'folder' : 'file'}`);
      console.error("Error deleting item:", error);
    }
  };

  const handleDownload = (item: S3Item) => {
    if (!item.isFolder) {
      const fileUrl = getS3FileUrl(item.Key);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = item.Key.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isImageFile = (key: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const ext = key.split('.').pop()?.toLowerCase() || '';
    return imageExtensions.includes(ext);
  };

  const getFileIcon = (item: S3Item) => {
    if (item.isFolder) return <Folder className="h-6 w-6" />;
    return isImageFile(item.Key) ? <Image className="h-6 w-6" /> : <File className="h-6 w-6" />;
  };

  const getItemName = (key: string) => {
    // Get the last part of the path (after the last slash)
    return key.split('/').filter(Boolean).pop() || key;
  };

  const formatFileSize = (size?: number) => {
    if (size === undefined) return '';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let formattedSize = size;
    let unitIndex = 0;
    
    while (formattedSize >= 1024 && unitIndex < units.length - 1) {
      formattedSize /= 1024;
      unitIndex++;
    }
    
    return `${formattedSize.toFixed(1)} ${units[unitIndex]}`;
  };

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card 
          key={item.Key} 
          className="overflow-hidden hover:border-upload-blue transition-colors cursor-pointer group"
        >
          <div 
            className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative"
            onClick={() => handleItemClick(item)}
          >
            {isImageFile(item.Key) && !item.isFolder ? (
              <img 
                src={getS3FileUrl(item.Key)} 
                alt={getItemName(item.Key)} 
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                  e.currentTarget.className = "object-contain w-3/4 h-3/4 opacity-60";
                }}
              />
            ) : (
              <div className="text-4xl text-gray-400 dark:text-gray-600">
                {getFileIcon(item)}
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {!item.isFolder && (
                  <>
                    <DropdownMenuItem onClick={() => window.open(getS3FileUrl(item.Key), '_blank')}>
                      <Eye className="mr-2 h-4 w-4" /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(item)}>
                      <Download className="mr-2 h-4 w-4" /> Download
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item);
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardContent className="p-3">
            <div className="truncate text-sm font-medium">{getItemName(item.Key)}</div>
            {!item.isFolder && (
              <div className="text-xs text-muted-foreground">
                {formatFileSize(item.Size)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Modified</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.Key} className="cursor-pointer hover:bg-accent/50" onClick={() => handleItemClick(item)}>
              <TableCell className="font-medium flex items-center gap-2">
                {getFileIcon(item)}
                <span className="truncate max-w-[250px]">{getItemName(item.Key)}</span>
              </TableCell>
              <TableCell>{item.isFolder ? '—' : formatFileSize(item.Size)}</TableCell>
              <TableCell>
                {item.LastModified 
                  ? formatDistanceToNow(new Date(item.LastModified), { addSuffix: true }) 
                  : '—'}
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {!item.isFolder && (
                      <>
                        <DropdownMenuItem onClick={() => window.open(getS3FileUrl(item.Key), '_blank')}>
                          <Eye className="mr-2 h-4 w-4" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(item)}>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleDeleteItem(item)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {prefixHistory.length > 0 && (
              <Button variant="outline" size="icon" onClick={navigateBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h3 className="text-lg font-medium">
              {currentPrefix ? getItemName(currentPrefix) : 'Root'}
            </h3>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'} 
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <File className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-upload-blue mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading files...</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>No files found in this folder</p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        renderGridView()
      ) : (
        renderListView()
      )}
    </div>
  );
};

export default FileBrowser;
