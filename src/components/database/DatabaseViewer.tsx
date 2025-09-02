import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { databaseApi } from '@/lib/api';
import { TableList } from './TableList';
import { DataTable } from './DataTable';
import type { TableInfo, QueryResult } from '@/types/database';

export function DatabaseViewer() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<QueryResult | undefined>();
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  const { toast } = useToast();

  // Load tables on mount
  useEffect(() => {
    loadTables();
  }, []);

  // Load table data when selection changes
  useEffect(() => {
    if (selectedTable) {
      loadTableData();
    }
  }, [selectedTable, currentPage, sortBy, sortOrder, searchValue]);

  const loadTables = async () => {
    try {
      setIsLoadingTables(true);
      const response = await databaseApi.listTables();
      setTables(response.tables || []);
      
      // Auto-select first table if available
      if (response.tables && response.tables.length > 0 && !selectedTable) {
        setSelectedTable(response.tables[0].name);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
      toast({
        title: 'Error',
        description: 'Failed to load database tables',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTables(false);
    }
  };

  const loadTableData = async () => {
    if (!selectedTable) return;
    
    try {
      setIsLoadingData(true);
      const response = await databaseApi.getTableData(selectedTable, {
        page: currentPage,
        pageSize: 50,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder,
        search: searchValue || undefined,
      });
      
      setTableData(response.data);
    } catch (error) {
      console.error('Failed to load table data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load table data',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSelectTable = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentPage(1);
    setSortBy('');
    setSortOrder('asc');
    setSearchValue('');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (search: string) => {
    setSearchValue(search);
    setCurrentPage(1);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (!selectedTable) return;
    
    try {
      const response = await databaseApi.exportTable(selectedTable, format, false);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Create a download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: `Table exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Failed to export table:', error);
      toast({
        title: 'Error',
        description: 'Failed to export table',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Table List Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-0">
          <h2 className="text-lg font-semibold mb-4">Tables</h2>
          <TableList
            tables={tables}
            selectedTable={selectedTable}
            onSelectTable={handleSelectTable}
            isLoading={isLoadingTables}
          />
        </div>
      </div>
      
      {/* Data Table */}
      <div className="flex-1 min-w-0">
        {selectedTable ? (
          <DataTable
            tableName={selectedTable}
            data={tableData}
            isLoading={isLoadingData}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
            onSearchChange={handleSearchChange}
            onExport={handleExport}
            sortBy={sortBy}
            sortOrder={sortOrder}
            searchValue={searchValue}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">Select a table</p>
              <p className="text-sm">Choose a table from the list to view its data</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}