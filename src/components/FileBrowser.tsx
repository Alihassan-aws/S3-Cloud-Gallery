
import React, { useState, useEffect } from 'react';
import { listS3Objects, getS3FileUrl, deleteS3Object, S3Item } from '@/services/s3Service';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Grid, List, ArrowLeft, RefreshCcw } from 'lucide-react';
import GridView from './GridView';
import ListView from './ListView';
import CreateFolderDialog from './CreateFolderDialog';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadItems = async (prefix: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listS3Objects(prefix);
      console.log("Loaded items:", data);
      setItems(data);
    } catch (error) {
      console.error("Error loading files:", error);
      setError("Failed to load files. Please check your AWS credentials and permissions.");
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  // Reload when retry count changes
  useEffect(() => {
    loadItems(currentPrefix);
  }, [currentPrefix, retryCount]);

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

  const handleRefresh = () => {
    setRetryCount(prev => prev + 1);
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
      console.error("Error deleting item:", error);
      toast.error(`Failed to delete ${item.isFolder ? 'folder' : 'file'}`);
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

  const getItemName = (key: string) => {
    // Get the last part of the path (after the last slash)
    return key.split('/').filter(Boolean).pop() || key;
  };

  const handleFolderCreated = () => {
    loadItems(currentPrefix);
  };

  // Render loading skeletons
  const renderLoadingSkeletons = () => {
    return (
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        : "space-y-2"}>
        {Array(8).fill(0).map((_, i) => (
          viewMode === 'grid' ? (
            <div key={i}>
              <Skeleton className="h-[150px] w-full mb-2" />
              <Skeleton className="h-4 w-4/5 mb-1" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ) : (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-full max-w-md" />
            </div>
          )
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {prefixHistory.length > 0 && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={navigateBack}
                className="transition-transform hover:translate-x-[-2px]"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h3 className="text-lg font-medium">
              {currentPrefix ? getItemName(currentPrefix) : 'Root'}
            </h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="hover:rotate-180 transition-all duration-500"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <CreateFolderDialog 
              currentPrefix={currentPrefix} 
              onFolderCreated={handleFolderCreated} 
            />
            <div className="flex border rounded-md">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none transition-all duration-200"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'ghost'} 
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-l-none border-l transition-all duration-200"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        renderLoadingSkeletons()
      ) : error ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-red-500">
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={handleRefresh}
            >
              <RefreshCcw className="h-4 w-4 mr-2" /> Try Again
            </Button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="h-12 w-12 mx-auto mb-4 opacity-30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>
                <path d="M12 8v8"/>
                <path d="M8 12h8"/>
              </svg>
            </div>
            <p>No files found in this folder</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={handleRefresh}
            >
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <GridView 
          items={items}
          onItemClick={handleItemClick}
          onDeleteItem={handleDeleteItem}
          onDownload={handleDownload}
        />
      ) : (
        <ListView 
          items={items}
          onItemClick={handleItemClick}
          onDeleteItem={handleDeleteItem}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default FileBrowser;
