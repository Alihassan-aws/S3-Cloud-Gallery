
import React, { useState } from 'react';
import { S3Item, getS3FileUrl } from '@/services/s3Service';
import { Card } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  Eye, 
  Download, 
  Trash2, 
  Image, 
  Heart, 
  Share,
  Maximize2,
  Lock 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import FileIcon from './FileIcon';
import { cn } from '@/lib/utils';
import PhotoViewer from './PhotoViewer';

interface EnhancedGridViewProps {
  items: S3Item[];
  onItemClick: (item: S3Item) => void;
  onDeleteItem: (item: S3Item) => void;
  onDownload: (item: S3Item) => void;
  viewMode?: 'grid' | 'masonry';
  selectionMode?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (selectedKeys: string[]) => void;
}

const EnhancedGridView: React.FC<EnhancedGridViewProps> = ({ 
  items, 
  onItemClick, 
  onDeleteItem, 
  onDownload,
  viewMode = 'grid',
  selectionMode = false,
  selectedItems = [],
  onSelectionChange
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  
  const imageItems = items.filter(item => isImageFile(item.Key) && !item.isFolder);
  
  const handleItemHover = (key: string | null) => {
    setHoveredItem(key);
  };

  const getItemName = (key: string) => {
    return key.split('/').filter(Boolean).pop() || key;
  };

  const isImageFile = (key: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const ext = key.split('.').pop()?.toLowerCase() || '';
    return imageExtensions.includes(ext);
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

  const openPhotoViewer = (item: S3Item) => {
    setCurrentImage(item.Key);
    setViewerOpen(true);
  };

  const handleCheckboxChange = (item: S3Item, checked: boolean) => {
    if (!onSelectionChange) return;
    
    const newSelected = checked 
      ? [...selectedItems, item.Key]
      : selectedItems.filter(key => key !== item.Key);
      
    onSelectionChange(newSelected);
  };

  return (
    <>
      <div className={cn(
        "animate-fade-in",
        viewMode === 'masonry' 
          ? "columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4" 
          : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      )}>
        {items.map((item) => {
          const isImage = isImageFile(item.Key) && !item.isFolder;
          const isSelected = selectedItems.includes(item.Key);
          const isHovered = hoveredItem === item.Key;
          
          return (
            <Card 
              key={item.Key} 
              className={cn(
                "overflow-hidden transition-all duration-300 group",
                viewMode === 'masonry' ? "break-inside-avoid mb-4" : "",
                isSelected ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/50",
                isHovered ? "shadow-lg" : "shadow-sm",
                "hover:shadow-xl hover:-translate-y-1"
              )}
              onMouseEnter={() => handleItemHover(item.Key)}
              onMouseLeave={() => handleItemHover(null)}
              onClick={(e) => {
                if (selectionMode) {
                  e.stopPropagation();
                  handleCheckboxChange(item, !isSelected);
                } else if (isImage) {
                  e.stopPropagation();
                  openPhotoViewer(item);
                } else {
                  onItemClick(item);
                }
              }}
            >
              <div className="relative">
                <AspectRatio ratio={1/1} className="bg-muted/30 flex items-center justify-center">
                  {isImage ? (
                    <div className="w-full h-full flex items-center justify-center p-0 overflow-hidden bg-black/5">
                      <img 
                        src={getS3FileUrl(item.Key)} 
                        alt={getItemName(item.Key)} 
                        className={cn(
                          "max-w-full max-h-full object-cover w-full h-full transition-transform duration-300",
                          isHovered && "scale-105"
                        )}
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                          e.currentTarget.className = "max-w-full max-h-full object-contain opacity-60";
                        }}
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="text-4xl text-gray-400 dark:text-gray-600 transition-transform duration-300 group-hover:scale-110">
                      <FileIcon fileName={item.Key} isFolder={item.isFolder} className="h-16 w-16" />
                    </div>
                  )}

                  {/* Selection checkbox */}
                  {selectionMode && (
                    <div 
                      className={cn(
                        "absolute top-2 left-2 transition-opacity duration-200", 
                        isSelected || isHovered ? "opacity-100" : "opacity-0"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={(checked) => handleCheckboxChange(item, checked === true)}
                        className="h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:text-white"
                      />
                    </div>
                  )}

                  {/* Hover overlay with actions */}
                  <div 
                    className={cn(
                      "absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity duration-300",
                      isHovered ? "opacity-100" : "opacity-0"
                    )}
                  >
                    {isImage && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full bg-black/30 text-white hover:bg-black/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPhotoViewer(item);
                        }}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    )}

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full bg-black/30 text-white hover:bg-black/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(item);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full bg-black/30 text-white hover:bg-black/50"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {!item.isFolder && (
                          <>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              window.open(getS3FileUrl(item.Key), '_blank');
                            }}>
                              <Eye className="mr-2 h-4 w-4" /> Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              onDownload(item);
                            }}>
                              <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Share className="mr-2 h-4 w-4" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Heart className="mr-2 h-4 w-4" /> Favorite
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(item);
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Premium badge for special files */}
                  {item.Key.includes('premium') && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-xs text-white px-2 py-0.5 rounded-full flex items-center">
                      <Lock className="h-3 w-3 mr-1" />
                      Premium
                    </div>
                  )}
                </AspectRatio>

                <div className="p-3">
                  <div className="truncate text-sm font-medium">{getItemName(item.Key)}</div>
                  {!item.isFolder && (
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>{formatFileSize(item.Size)}</span>
                      {item.LastModified && (
                        <span>{new Date(item.LastModified).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Photo Viewer */}
      <PhotoViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        currentImage={currentImage}
        allImages={imageItems}
        onDownload={onDownload}
      />
    </>
  );
};

export default EnhancedGridView;
