
import { useState } from 'react';
import EnhancedFileBrowser from '@/components/EnhancedFileBrowser';
import FileUploader from '@/components/FileUploader';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { 
  Image, 
  Upload, 
  CloudIcon, 
  Settings,
  Search,
  Share,
  Heart,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [currentPrefix, setCurrentPrefix] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('browse');

  const handleUploadComplete = (fileUrl: string | string[]) => {
    // Handle both single and multiple uploaded files
    if (Array.isArray(fileUrl) && fileUrl.length > 0) {
      setUploadedFileUrl(fileUrl[0]); // Show first file URL
      // Trigger refresh of file browser
      setRefreshTrigger(prev => prev + 1);
      setActiveTab('browse'); // Auto switch to browse tab
    } else if (typeof fileUrl === 'string') {
      setUploadedFileUrl(fileUrl);
      setRefreshTrigger(prev => prev + 1);
      setActiveTab('browse'); // Auto switch to browse tab
    }
  };

  const handleFileSelect = (fileUrl: string) => {
    console.log('Selected file:', fileUrl);
    // You can use this later if needed
    setUploadedFileUrl(fileUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 transition-all duration-300 ease-in-out">
      {/* Header with glass effect */}
      <header className="glass sticky top-0 z-10 backdrop-blur-xl py-4 px-6 border-b border-white/10 dark:border-gray-800/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-violet-500 p-2 rounded-lg">
              <CloudIcon className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <span className="text-gradient">Cloud Gallery</span>
              </h1>
              <p className="text-xs text-muted-foreground">Created by Ali Hassan</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Share className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserCircle className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        {/* Upload stats card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass overflow-hidden border-white/20 dark:border-gray-800/30 col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-gradient">Storage Overview</CardTitle>
              <CardDescription>
                Your cloud storage statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-gradient">247</span>
                  <span className="text-sm text-muted-foreground">Files stored</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-gradient">12.4 GB</span>
                  <span className="text-sm text-muted-foreground">Used storage</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-gradient">100 GB</span>
                  <span className="text-sm text-muted-foreground">Total storage</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-white/20 dark:border-gray-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-gradient">Quick Upload</CardTitle>
              <CardDescription>
                Drag and drop or click to upload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader 
                onUploadComplete={handleUploadComplete}
                currentPrefix=""
                multiple={true}
                className="h-24"
              />
            </CardContent>
          </Card>
        </div>
      
        <Tabs 
          defaultValue="browse" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full md:w-[400px] grid-cols-2 glass border-white/20 dark:border-gray-800/30 p-1">
            <TabsTrigger 
              value="browse" 
              className={cn(
                "flex items-center gap-2 transition-all data-[state=active]:glass",
                "data-[state=active]:text-primary data-[state=active]:shadow-sm"
              )}
            >
              <Image className="h-4 w-4" />
              <span>Gallery</span>
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className={cn(
                "flex items-center gap-2 transition-all data-[state=active]:glass",
                "data-[state=active]:text-primary data-[state=active]:shadow-sm"
              )}
            >
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="mt-6 transition-all duration-300 ease-in-out">
            <Card className="glass border-white/20 dark:border-gray-800/30 shadow-xl">
              <CardContent className="p-2 sm:p-6">
                <EnhancedFileBrowser 
                  onSelect={handleFileSelect} 
                  key={`browser-${refreshTrigger}`} // Force refresh when uploads happen
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upload" className="mt-6 transition-all duration-300 ease-in-out">
            <Card className="glass border-white/20 dark:border-gray-800/30 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
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
                  multiple={true}
                  className="min-h-[300px]"
                />

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col items-center p-4 glass rounded-xl">
                    <div className="bg-primary/10 p-3 rounded-full mb-3">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium">Easy Upload</h3>
                    <p className="text-sm text-center text-muted-foreground">
                      Simple drag and drop interface for quick uploads
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center p-4 glass rounded-xl">
                    <div className="bg-primary/10 p-3 rounded-full mb-3">
                      <CloudIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium">Organize Files</h3>
                    <p className="text-sm text-center text-muted-foreground">
                      Create folders and organize your files easily
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center p-4 glass rounded-xl">
                    <div className="bg-primary/10 p-3 rounded-full mb-3">
                      <Share className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium">Secure Sharing</h3>
                    <p className="text-sm text-center text-muted-foreground">
                      Share files with friends securely
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {uploadedFileUrl && (
          <Card className="mt-6 glass border-white/20 dark:border-gray-800/30 shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle>Upload Successful</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm font-medium">File URL:</p>
              <div className="glass p-3 rounded-md overflow-auto">
                <a 
                  href={uploadedFileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {uploadedFileUrl}
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="mt-12 py-6 px-6 border-t border-white/10 dark:border-gray-800/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <CloudIcon className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Cloud Gallery</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2025 Cloud Gallery. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
