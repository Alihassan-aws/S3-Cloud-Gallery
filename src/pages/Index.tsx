
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const Index = () => {
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const handleUploadComplete = (fileUrl: string) => {
    setUploadedFileUrl(fileUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">S3 File Uploader</h1>
          <p className="mt-2 text-lg text-gray-600">
            Upload your files securely to Amazon S3
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Drag and drop a file or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader onUploadComplete={handleUploadComplete} />
          </CardContent>
        </Card>

        {uploadedFileUrl && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Upload Successful</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm font-medium">File URL:</p>
              <div className="bg-gray-50 p-3 rounded-md border overflow-auto">
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

        <div className="mt-8 bg-blue-50 border-l-4 border-upload-blue p-4 rounded">
          <h3 className="text-lg font-medium text-blue-800">Setup Instructions</h3>
          <ul className="mt-2 text-sm text-blue-700 list-disc pl-5">
            <li className="mb-1">Create a <code>.env.local</code> file in the project root</li>
            <li className="mb-1">Add the following variables:</li>
            <code className="block bg-blue-100 p-3 rounded mt-2 overflow-x-auto text-xs">
              VITE_AWS_ACCESS_KEY_ID=your_access_key_id<br/>
              VITE_AWS_SECRET_ACCESS_KEY=your_secret_access_key<br/>
              VITE_AWS_REGION=your_region<br/>
              VITE_AWS_S3_BUCKET_NAME=your_bucket_name
            </code>
            <li className="mt-2">Run <code>npm install</code> then <code>npm start</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Index;
