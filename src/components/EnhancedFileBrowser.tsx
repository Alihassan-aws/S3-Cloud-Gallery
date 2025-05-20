
import React, { useState, useEffect } from 'react';
import { listS3Objects, getS3FileUrl, deleteS3Object, S3Item } from '@/services/s3Service';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { 
  Grid, 
  List, 
  ArrowLeft, 
  RefreshCcw, 
  Loader2, 
  Search, 
  X,
  FolderPlus,
  Filter,
  Check,
  Trash2, 
  LayoutGrid, 
  Download,
  Share,
  Heart
} from 'lucide-react';
import EnhancedGridView from './EnhancedGridView';
import ListView from './ListView';
import CreateFolderDialog from './CreateFolderDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from '@/components/ui/toggle-group';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface EnhancedFileBrowserProps {
  onSelect?: (fileUrl: string) => void;
  showHeader?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'masonry' | 'list';
type SortBy = 'name' | 'size' | 'date';
type SortDirection = 'asc' | 'desc';

const EnhancedFileBrowser: React.FC<EnhancedFileBrowserProps> = ({ 
  onSelect, 
  showHeader = true, 
  className 
}) => {
  const [items, setItems] = useState<S3Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<S3Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [prefixHistory, setPrefixHistory] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(true);

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

  // Filter and sort items
  useEffect(() => {
    let result = [...items];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.Key.toLowerCase().includes(term)
      );
    }
    
    // Apply file type filter
    if (fileTypeFilter.length > 0) {
      result = result.filter(item => {
        if (item.isFolder) return true;
        
        const extension = item.Key.split('.').pop()?.toLowerCase() || '';
        return fileTypeFilter.includes(extension);
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      // Always put folders first
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.Key.localeCompare(b.Key);
          break;
        case 'size':
          comparison = (a.Size || 0) - (b.Size || 0);
          break;
        case 'date':
          const dateA = a.LastModified ? new Date(a.LastModified).getTime() : 0;
          const dateB = b.LastModified ? new Date(b.LastModified).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredItems(result);
  }, [items, searchTerm, sortBy, sortDirection, fileTypeFilter]);

  const navigateToFolder = (key: string) => {
    setPrefixHistory(prev => [...prev, currentPrefix]);
    setCurrentPrefix(key);
    setSelectionMode(false);
    setSelectedItems([]);
  };

  const navigateBack = () => {
    if (prefixHistory.length > 0) {
      const previousPrefix = prefixHistory[prefixHistory.length - 1];
      setPrefixHistory(prev => prev.slice(0, -1));
      setCurrentPrefix(previousPrefix);
      setSelectionMode(false);
      setSelectedItems([]);
    }
  };

  const handleRefresh = () => {
    setRetryCount(prev => prev + 1);
    toast.info("Refreshing files...");
  };

  const handleItemClick = (item: S3Item) => {
    if (selectionMode) {
      // In selection mode, clicking is handled in the view component
      return;
    }
    
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

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      toast.loading(`Deleting ${selectedItems.length} items...`, { id: 'delete-multiple' });
      
      for (const key of selectedItems) {
        await deleteS3Object(key);
      }
      
      toast.success(`${selectedItems.length} items deleted successfully`, { id: 'delete-multiple' });
      setSelectedItems([]);
      setSelectionMode(false);
      loadItems(currentPrefix);
    } catch (error) {
      console.error("Error deleting items:", error);
      toast.error(`Failed to delete some items`, { id: 'delete-multiple' });
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

  const handleDownloadSelected = () => {
    if (selectedItems.length === 0) return;
    
    toast.info(`Preparing ${selectedItems.length} files for download`);
    
    selectedItems.forEach((key) => {
      const item = items.find(item => item.Key === key);
      if (item && !item.isFolder) {
        setTimeout(() => handleDownload(item), 500); // Stagger downloads slightly
      }
    });
  };

  const getItemName = (key: string) => {
    // Get the last part of the path (after the last slash)
    return key.split('/').filter(Boolean).pop() || key;
  };

  const handleFolderCreated = () => {
    loadItems(currentPrefix);
  };

  const handleSearchClear = () => {
    setSearchTerm('');
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleSelectionChange = (selectedKeys: string[]) => {
    setSelectedItems(selectedKeys);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(prev => !prev);
    if (!selectionMode) {
      setSelectedItems([]);
    }
  };

  const getAvailableFileTypes = () => {
    const types = new Set<string>();
    items.forEach(item => {
      if (!item.isFolder) {
        const ext = item.Key.split('.').pop()?.toLowerCase() || '';
        if (ext) types.add(ext);
      }
    });
    return Array.from(types).sort();
  };

  const toggleFileTypeFilter = (type: string) => {
    setFileTypeFilter(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getBreadcrumbs = () => {
    if (!currentPrefix) {
      return [{ name: 'Root', key: '' }];
    }

    const parts = currentPrefix.split('/').filter(Boolean);
    let path = '';
    
    return [
      { name: 'Root', key: '' },
      ...parts.map(part => {
        path += path ? `/${part}` : part;
        return {
          name: part,
          key: `${path}/`
        };
      })
    ];
  };

  // Render loading skeletons
  const renderLoadingSkeletons = () => {
    return (
      <div className={viewMode === 'list' 
        ? "space-y-2"
        : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"}>
        {Array(8).fill(0).map((_, i) => (
          viewMode === 'list' ? (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-full max-w-md" />
            </div>
          ) : (
            <div key={i}>
              <Skeleton className="h-[150px] w-full mb-2" />
              <Skeleton className="h-4 w-4/5 mb-1" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          )
        ))}
      </div>
    );
  };

  const breadcrumbs = getBreadcrumbs();
  const availableFileTypes = getAvailableFileTypes();

  return (
    <div className="space-y-4">
      {showHeader && (
        <>
          {/* Breadcrumbs row */}
          {showBreadcrumbs && (
            <div className="flex overflow-auto items-center gap-1 pb-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.key}>
                  {index > 0 && <span className="text-muted-foreground mx-1">/</span>}
                  <button
                    onClick={() => crumb.key !== currentPrefix && navigateToFolder(crumb.key)}
                    className={`py-1 px-2 rounded hover:bg-accent whitespace-nowrap transition-colors ${
                      crumb.key === currentPrefix ? 'text-primary font-medium' : 'text-foreground'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Main toolbar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2">
              {prefixHistory.length > 0 && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={navigateBack}
                  className="transition-transform hover:translate-x-[-2px] shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input 
                  type="search"
                  placeholder="Search files..."
                  className="pl-9 pr-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={handleSearchClear}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 md:justify-end">
              {/* Selection mode and actions */}
              {selectionMode ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectionMode}
                    className="gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Done
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadSelected}
                    disabled={selectedItems.length === 0}
                    className="gap-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={selectedItems.length === 0}
                  >
                    <Share className="h-3.5 w-3.5" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={selectedItems.length === 0}
                  >
                    <Heart className="h-3.5 w-3.5" />
                    Favorite
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={selectedItems.length === 0}
                    className="gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              ) : (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={toggleSelectionMode}
                          className="rounded-full"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select multiple items</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleRefresh}
                          className="rounded-full hover:rotate-180 transition-all duration-500"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Refresh</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <CreateFolderDialog 
                    currentPrefix={currentPrefix} 
                    onFolderCreated={handleFolderCreated} 
                  />
                  
                  <Drawer open={showFilterDrawer} onOpenChange={setShowFilterDrawer}>
                    <DrawerTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className={`rounded-full ${fileTypeFilter.length > 0 ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                      >
                        <Filter className="h-4 w-4" />
                        {fileTypeFilter.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {fileTypeFilter.length}
                          </span>
                        )}
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader>
                          <DrawerTitle>Filter Files</DrawerTitle>
                          <DrawerDescription>Filter files by type, size, and date</DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">File Types</h4>
                              <div className="flex flex-wrap gap-2">
                                {availableFileTypes.map(type => (
                                  <Button
                                    key={type}
                                    variant={fileTypeFilter.includes(type) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleFileTypeFilter(type)}
                                    className="text-xs"
                                  >
                                    {type}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-2">Sort By</h4>
                              <div className="flex items-center gap-2">
                                <ToggleGroup type="single" value={sortBy} onValueChange={(value) => value && setSortBy(value as SortBy)}>
                                  <ToggleGroupItem value="name" size="sm">Name</ToggleGroupItem>
                                  <ToggleGroupItem value="size" size="sm">Size</ToggleGroupItem>
                                  <ToggleGroupItem value="date" size="sm">Date</ToggleGroupItem>
                                </ToggleGroup>
                                
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={toggleSortDirection}
                                  className="ml-2"
                                >
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <DrawerFooter>
                          <Button 
                            onClick={() => setFileTypeFilter([])}
                            variant="outline"
                            disabled={fileTypeFilter.length === 0}
                          >
                            Clear Filters
                          </Button>
                          <DrawerClose asChild>
                            <Button>Apply</Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </div>
                    </DrawerContent>
                  </Drawer>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-full">
                        {viewMode === 'list' ? (
                          <List className="h-4 w-4" />
                        ) : viewMode === 'grid' ? (
                          <Grid className="h-4 w-4" />
                        ) : (
                          <LayoutGrid className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>View</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={viewMode === 'grid'}
                        onCheckedChange={() => setViewMode('grid')}
                      >
                        <Grid className="mr-2 h-4 w-4" />
                        Grid
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={viewMode === 'masonry'}
                        onCheckedChange={() => setViewMode('masonry')}
                      >
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        Masonry
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={viewMode === 'list'}
                        onCheckedChange={() => setViewMode('list')}
                      >
                        <List className="mr-2 h-4 w-4" />
                        List
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem 
                        checked={showBreadcrumbs}
                        onCheckedChange={setShowBreadcrumbs}
                      >
                        Show path
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* File browser content */}
      <ScrollArea className="h-[calc(100vh-15rem)]">
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
        ) : filteredItems.length === 0 ? (
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
        ) : viewMode === 'list' ? (
          <ListView 
            items={filteredItems}
            onItemClick={handleItemClick}
            onDeleteItem={handleDeleteItem}
            onDownload={handleDownload}
          />
        ) : (
          <EnhancedGridView 
            items={filteredItems}
            onItemClick={handleItemClick}
            onDeleteItem={handleDeleteItem}
            onDownload={handleDownload}
            viewMode={viewMode}
            selectionMode={selectionMode}
            selectedItems={selectedItems}
            onSelectionChange={handleSelectionChange}
          />
        )}
      </ScrollArea>
    </div>
  );
};

export default EnhancedFileBrowser;
