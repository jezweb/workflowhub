import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';

export function FilesPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Files</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your uploaded files
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No files yet</CardTitle>
          <CardDescription>
            Upload your first file to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}