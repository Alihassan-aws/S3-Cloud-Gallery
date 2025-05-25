
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import FileBrowser from '@/components/FileBrowser';
import ThemeToggle from '@/components/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Upload, CloudIcon } from 'lucide-react';

const Index = () => {
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [currentPrefix, setCurrentPrefix] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = (fileUrl: string | string[]) => {
    // Handle both single and multiple uploaded files
    if (Array.isArray(fileUrl) && fileUrl.length > 0) {
      setUploadedFileUrl(fileUrl[0]); // Show first file URL
      // Trigger refresh of file browser
      setRefreshTrigger(prev => prev + 1);
    } else if (typeof fileUrl === 'string') {
      setUploadedFileUrl(fileUrl);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleFileSelect = (fileUrl: string) => {
    console.log('Selected file:', fileUrl);
    // You can use this later if needed
    setUploadedFileUrl(fileUrl);
  };

  const handlePrefixChange = (prefix: string) => {
    setCurrentPrefix(prefix);
  };

  return (
    <div className="min-h-screen bg-background transition-all duration-300 ease-in-out">
      <header className="border-b py-4 px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-2">
              <CloudIcon className="h-6 w-6 text-upload-blue animate-pulse" />
              <span className="bg-gradient-to-r from-upload-blue to-purple-500 bg-clip-text text-transparent">Cloud Gallery</span>
            </h1>
            <p className="text-sm font-bold text-muted-foreground">Created by Ali Hassan</p>
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 animate-fade-in">
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-4">
            <TabsTrigger value="browse" className="flex items-center gap-2 transition-all hover:bg-accent">
              <Image className="h-4 w-4" />
              <span>Gallery</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2 transition-all hover:bg-accent">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="mt-6 transition-all duration-300 ease-in-out">
            <Card className="border border-border/40 shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-upload-blue" />
                  Browse Gallery
                </CardTitle>
                <CardDescription>
                  View and manage your files in the cloud storage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileBrowser 
                  onSelect={handleFileSelect} 
                  key={`browser-${refreshTrigger}`} // Force refresh when uploads happen
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upload" className="mt-6 transition-all duration-300 ease-in-out">
            <Card className="border border-border/40 shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-upload-blue" />
                  Upload Files
                </CardTitle>
                <CardDescription>
                  Drag and drop files or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader 
                  onUploadComplete={handleUploadComplete} 
                  currentPrefix={currentPrefix}
                  multiple={true} // Enable multiple file upload
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
