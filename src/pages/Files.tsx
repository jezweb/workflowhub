import { FileManager } from '@/components/files/FileManager';

export function FilesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Files</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your uploaded files with support for images, documents, and more
        </p>
      </div>
      
      <FileManager />
    </div>
  );
}