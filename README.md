
# S3 File Uploader

A simple React application for uploading files to Amazon S3 buckets.

## Features

- Drag and drop file uploads
- Visual upload progress indicator
- Success/error notifications
- Responsive design
- AWS S3 integration

## Setup

1. Clone the repository
2. Create a `.env.local` file in the project root directory with the following variables:

```
VITE_AWS_ACCESS_KEY_ID=your_access_key_id
VITE_AWS_SECRET_ACCESS_KEY=your_secret_access_key
VITE_AWS_REGION=your_region
VITE_AWS_S3_BUCKET_NAME=your_bucket_name
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm start
```

5. Open [http://localhost:8080](http://localhost:8080) to view it in the browser.

## AWS S3 Bucket Setup

Ensure your S3 bucket has the appropriate CORS configuration to allow uploads from your application domain:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:8080", "https://your-production-domain.com"],
    "ExposeHeaders": []
  }
]
```

Also make sure your IAM user has sufficient permissions to upload to the specified S3 bucket.

## Security Notes

- Never commit your `.env.local` file to version control
- Consider using temporary credentials or pre-signed URLs for production applications
- For production, implement proper authentication and authorization
