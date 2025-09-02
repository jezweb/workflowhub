import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2
} from 'lucide-react';
import { formatColumnValue, getColumnType } from '@/types/database';
import type { QueryResult } from '@/types/database';

interface DataTableProps {
  tableName: string;
  data?: QueryResult;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onSortChange: (column: string) => void;
  onSearchChange: (search: string) => void;
  onExport: (format: 'json' | 'csv') => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchValue?: string;
}

export function DataTable({
  tableName,
  data,
  isLoading,
  onPageChange,
  onSortChange,
  onSearchChange,
  onExport,
  sortBy,
  sortOrder,
  searchValue = ''
}: DataTableProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);
  
  const handleSearch = () => {
    onSearchChange(localSearch);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };
  
  const renderCellValue = (value: any) => {
    const formatted = formatColumnValue(value);
    const type = getColumnType(value);
    
    // Apply different styling based on type
    if (type === 'NULL') {
      return <span className="text-gray-400 italic">NULL</span>;
    }
    if (type === 'BOOLEAN') {
      return (
        <span className={`font-mono ${value ? 'text-green-600' : 'text-red-600'}`}>
          {formatted}
        </span>
      );
    }
    if (type === 'INTEGER' || type === 'REAL') {
      return <span className="font-mono text-blue-600">{formatted}</span>;
    }
    if (type === 'JSON') {
      return (
        <span className="font-mono text-xs bg-gray-100 px-1 rounded" title={formatted}>
          {formatted.substring(0, 50)}{formatted.length > 50 ? '...' : ''}
        </span>
      );
    }
    
    // For text, truncate long values
    if (formatted.length > 100) {
      return (
        <span title={formatted}>
          {formatted.substring(0, 100)}...
        </span>
      );
    }
    
    return formatted;
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {tableName}
            {data && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({data.totalCount.toLocaleString()} total rows)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search in table..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-64"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('csv')}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('json')}
            >
              <Download className="mr-2 h-4 w-4" />
              JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : data && data.rows.length > 0 ? (
          <>
            <div className="rounded-md border overflow-x-auto">
              <TableComponent>
                <TableHeader>
                  <TableRow>
                    {data.columns.map((column) => (
                      <TableHead key={column}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 font-medium"
                          onClick={() => onSortChange(column)}
                        >
                          {column}
                          {getSortIcon(column)}
                        </Button>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row, index) => (
                    <TableRow key={index}>
                      {data.columns.map((column) => (
                        <TableCell key={column} className="font-mono text-sm">
                          {renderCellValue(row[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </TableComponent>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {((data.page - 1) * data.pageSize) + 1} to{' '}
                {Math.min(data.page * data.pageSize, data.totalCount)} of{' '}
                {data.totalCount.toLocaleString()} rows
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(1)}
                  disabled={data.page === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(data.page - 1)}
                  disabled={data.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {data.page} of {data.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(data.page + 1)}
                  disabled={data.page >= (data.totalPages || 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(data.totalPages || 1)}
                  disabled={data.page >= (data.totalPages || 1)}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {searchValue ? 'No results found' : 'No data in this table'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}