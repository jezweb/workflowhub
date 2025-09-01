import { useState, useEffect } from 'react';
import { Upload, Trash2, FileText } from 'lucide-react';

interface FileObject {
  key: string;
  size: number;
  uploaded: string;
  metadata?: {
    name: string;
    mime_type?: string;
  };
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data.objects || []);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        fetchFiles();
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  const deleteFile = async (key: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await fetch(`/api/files/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      fetchFiles();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">File Manager</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage files stored in R2 bucket
        </p>
      </div>

      <div className="mb-4">
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer">
          <Upload size={20} />
          Upload File
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading files...</div>
      ) : files.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No files uploaded yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file) => (
                <tr key={file.key}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {file.metadata?.name || file.key}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(file.uploaded).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => deleteFile(file.key)}
                      className="text-red-600 hover:text-red-900 ml-4"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}