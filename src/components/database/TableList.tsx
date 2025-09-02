import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, Database, Loader2 } from 'lucide-react';
import type { TableInfo } from '@/types/database';

interface TableListProps {
  tables: TableInfo[];
  selectedTable?: string;
  onSelectTable: (tableName: string) => void;
  isLoading?: boolean;
}

export function TableList({ tables, selectedTable, onSelectTable, isLoading }: TableListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Database className="h-12 w-12 mb-3" />
        <p className="text-lg font-medium">No tables found</p>
        <p className="text-sm">Your database appears to be empty</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {tables.map((table) => (
        <Card 
          key={table.name}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedTable === table.name 
              ? 'ring-2 ring-blue-500 bg-blue-50' 
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelectTable(table.name)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-base">
                <Table className="mr-2 h-4 w-4" />
                {table.name}
              </CardTitle>
              <Badge variant="secondary">
                {table.rowCount.toLocaleString()} rows
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Click to view table data
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}