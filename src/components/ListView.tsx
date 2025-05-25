import React from 'react';
import { S3Item, getS3FileUrl } from '@/services/s3Service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { MoreVertical, Eye, Download, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import FileIcon from './FileIcon';

interface ListViewProps {
  items: S3Item[];
  onItemClick: (item: S3Item) => void;
  onDeleteItem: (item: S3Item) => void;
  onDownload: (item: S3Item) => void;
}

const ListView: React.FC<ListViewProps> = ({
  items,
  onItemClick,
  onDeleteItem,
  onDownload
}) => {
  const getItemName = (key: string) =>
    key.split('/').filter(Boolean).pop() || key;

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
    <div className="overflow-auto animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[260px]">Name</TableHead>
            <TableHead className="w-[100px]">Size</TableHead>
            <TableHead className="w-[160px]">Modified</TableHead>
            <TableHead className="text-right w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.Key}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onItemClick(item)}
            >
              <TableCell className="font-medium flex items-center gap-2">
                <FileIcon fileName={item.Key} isFolder={item.isFolder} className="h-4 w-4" />
                <span className="truncate max-w-[200px]">{getItemName(item.Key)}</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {item.isFolder ? '—' : formatFileSize(item.Size)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {item.LastModified
                  ? formatDistanceToNow(new Date(item.LastModified), { addSuffix: true })
                  : '—'}
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!item.isFolder && (
                      <>
                        <DropdownMenuItem onClick={() => window.open(getS3FileUrl(item.Key), '_blank')}>
                          <Eye className="mr-2 h-4 w-4" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownload(item)}>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDeleteItem(item)}
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
};

export default ListView;
