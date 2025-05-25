import React, { useState } from 'react';
import { S3Item, getS3FileUrl } from '@/services/s3Service';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { MoreVertical, Eye, Download, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FileIcon from './FileIcon';

import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface GridViewProps {
  items: S3Item[];
  onItemClick: (item: S3Item) => void;
  onDeleteItem: (item: S3Item) => void;
  onDownload: (item: S3Item) => void;
}

const GridView: React.FC<GridViewProps> = ({ items, onItemClick, onDeleteItem, onDownload }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isImageFile = (key: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const ext = key.split('.').pop()?.toLowerCase() || '';
    return imageExtensions.includes(ext);
  };

  const imageItems = items.filter(item => isImageFile(item.Key) && !item.isFolder);
  const lightboxImages = imageItems.map(item => ({ src: getS3FileUrl(item.Key) }));

  const getItemName = (key: string) => key.split('/').filter(Boolean).pop() || key;

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

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 animate-fade-in">
        {items.map((item, index) => {
          const isImage = isImageFile(item.Key);
          const imageIndex = imageItems.findIndex(i => i.Key === item.Key);

          return (
            <Card
              key={item.Key}
              className="overflow-hidden hover:border-upload-blue transition-all duration-300 cursor-pointer group hover:shadow-sm transform hover:scale-[1.01] text-xs"
            >
              <div
                className="relative"
                onClick={() => isImage ? setLightboxIndex(imageIndex) : onItemClick(item)}
              >
                <AspectRatio ratio={1 / 1} className="bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {isImage ? (
                    <div className="w-full h-full flex items-center justify-center p-1">
                      <img
                        src={getS3FileUrl(item.Key)}
                        alt={getItemName(item.Key)}
                        className="max-w-full max-h-full object-contain transition-opacity duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                          e.currentTarget.className = "max-w-full max-h-full object-contain opacity-60";
                        }}
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="text-3xl text-gray-400 dark:text-gray-600 transition-transform duration-300 group-hover:scale-110">
                      <FileIcon fileName={item.Key} isFolder={item.isFolder} className="h-8 w-8" />
                    </div>
                  )}
                </AspectRatio>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
              <CardContent className="p-2">
                <div className="truncate font-medium">{getItemName(item.Key)}</div>
                {!item.isFolder && (
                  <div className="text-muted-foreground">
                    {formatFileSize(item.Size)}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Minimal Lightbox Preview */}
      {lightboxIndex !== null && (
        <Lightbox
          open
          index={lightboxIndex}
          close={() => setLightboxIndex(null)}
          slides={lightboxImages}
          controller={{ closeOnBackdropClick: true }}
          on={{
            click: () => setLightboxIndex(null),
            view: ({ index }) => setLightboxIndex(index),
          }}
          render={{
            
          }}
        />
      )}
    </>
  );
};

export default GridView;
