
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Share
} from 'lucide-react';
import { S3Item } from '@/services/s3Service';

interface PhotoViewerProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage: string;
  allImages: S3Item[];
  onDownload: (item: S3Item) => void;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({
  isOpen,
  onClose,
  currentImage,
  allImages,
  onDownload,
}) => {
  const [imageIndex, setImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Find current image index when currentImage changes
  useEffect(() => {
    const index = allImages.findIndex(img => 
      img.Key === currentImage || 
      `https://your-storage-url.com/${img.Key}` === currentImage
    );
    
    if (index !== -1) {
      setImageIndex(index);
    }
    
    // Reset zoom and rotation when image changes
    setZoom(1);
    setRotation(0);
    setIsLoading(true);
  }, [currentImage, allImages]);

  const handlePrevious = () => {
    setImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const currentItem = allImages[imageIndex];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[90vw] max-h-[90vh] p-1 bg-background/95 backdrop-blur-xl border-white/20"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <DialogHeader className="absolute top-2 right-2 flex flex-row justify-between w-full px-2 z-10">
          <DialogTitle className="text-white drop-shadow-md truncate max-w-[50%]">
            {currentItem ? currentItem.Key.split('/').pop() : ''}
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-black/20 text-white hover:bg-black/40">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex items-center justify-center h-full overflow-hidden">
          {isLoading && <div className="animate-spin-slow w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>}
          
          {currentItem && (
            <img
              src={`https://your-storage-url.com/${currentItem.Key}`}
              alt={currentItem.Key.split('/').pop() || ''}
              className="max-h-[80vh] transition-all duration-300"
              style={{ 
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                display: isLoading ? 'none' : 'block'
              }}
              onLoad={() => setIsLoading(false)}
            />
          )}
        </div>
        
        {/* Navigation controls */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handlePrevious}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-black/20 text-white hover:bg-black/40"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNext}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-black/20 text-white hover:bg-black/40"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
        
        {/* Bottom toolbar */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-md">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-white hover:bg-black/20 rounded-full">
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-white hover:bg-black/20 rounded-full">
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon" onClick={handleRotate} className="text-white hover:bg-black/20 rounded-full">
            <RotateCw className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => currentItem && onDownload(currentItem)} 
            className="text-white hover:bg-black/20 rounded-full"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-white hover:bg-black/20 rounded-full">
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoViewer;
