import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table } from 'lucide-react';

export function DatabasePage() {
  const tables = [
    'users', 'forms', 'form_submissions', 'actions', 
    'conversations', 'messages', 'files', 'settings'
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Database</h1>
        <p className="mt-1 text-sm text-gray-600">
          Browse and manage your database tables
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <Card key={table} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Table className="mr-2 h-4 w-4" />
                {table}
              </CardTitle>
              <CardDescription>
                Click to view table data
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}