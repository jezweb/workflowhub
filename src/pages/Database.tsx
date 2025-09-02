import { DatabaseViewer } from '@/components/database/DatabaseViewer';

export function DatabasePage() {
  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Database</h1>
        <p className="mt-1 text-sm text-gray-600">
          Browse and export your database tables
        </p>
      </div>
      
      <div className="h-[calc(100%-80px)]">
        <DatabaseViewer />
      </div>
    </div>
  );
}