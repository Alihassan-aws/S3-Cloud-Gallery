
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import FileBrowser from '@/components/FileBrowser';
import ThemeToggle from '@/components/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Upload, CloudIcon } from 'lucide-react';

const Index = () => {
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const handleUploadComplete = (fileUrl: string) => {
    setUploadedFileUrl(fileUrl);
  };

  return (
    <div className="min-h-screen bg-background transition-all duration-300 ease-in-out">
      <header className="border-b py-4 px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CloudIcon className="h-6 w-6 text-upload-blue animate-pulse" />
              <span className="bg-gradient-to-r from-upload-blue to-purple-500 bg-clip-text text-transparent">Cloud Gallery</span>
            </h1>
            <p className="text-xs text-muted-foreground">Created by Ali Hassan</p>
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
                  Browse Files
                </CardTitle>
                <CardDescription>
                  View and manage your files in the cloud storage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileBrowser />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upload" className="mt-6 transition-all duration-300 ease-in-out">
            <Card className="border border-border/40 shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-upload-blue" />
                  Upload File
                </CardTitle>
                <CardDescription>
                  Drag and drop a file or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader onUploadComplete={handleUploadComplete} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {uploadedFileUrl && (
          <Card className="mt-6 bg-muted/50 border border-border/40 shadow-md animate-fade-in">
            <CardHeader>
              <CardTitle>Upload Successful</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm font-medium">File URL:</p>
              <div className="bg-card p-3 rounded-md border overflow-auto">
                <a 
                  href={uploadedFileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-upload-blue hover:underline break-all"
                >
                  {uploadedFileUrl}
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Index;
