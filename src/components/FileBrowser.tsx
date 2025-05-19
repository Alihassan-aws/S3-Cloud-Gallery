
import React, { useState, useEffect } from 'react';
import { listS3Objects, getS3FileUrl, deleteS3Object, S3Item } from '@/services/s3Service';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Grid, List, ArrowLeft } from 'lucide-react';
import GridView from './GridView';
import ListView from './ListView';
import CreateFolderDialog from './CreateFolderDialog';

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
      console.log("Loaded items:", data);
      setItems(data);
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("Failed to load files");
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
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-upload-blue mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading files...</p>
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
