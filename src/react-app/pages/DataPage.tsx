import { useState, useEffect } from 'react';
import { Table, RefreshCw, Search } from 'lucide-react';

interface TableInfo {
  name: string;
  type: string;
  sql: string;
}

interface QueryResult {
  columns: string[];
  rows: any[][];
}

export default function DataPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<QueryResult | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/data/tables');
      const data = await response.json();
      setTables(data);
      if (data.length > 0 && !selectedTable) {
        setSelectedTable(data[0].name);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      setError('Failed to fetch database tables');
    }
  };

  const fetchTableData = async (tableName: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/data/tables/${tableName}`);
      const data = await response.json();
      setTableData(data);
    } catch (error) {
      console.error('Failed to fetch table data:', error);
      setError('Failed to fetch table data');
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async () => {
    if (!customQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/data/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customQuery }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Query failed');
      }
      
      const data = await response.json();
      setQueryResult(data);
    } catch (error: any) {
      console.error('Query failed:', error);
      setError(error.message || 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (data: QueryResult | null) => {
    if (!data || data.rows.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          No data found
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {data.columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {cell !== null ? String(cell) : 'NULL'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Database Viewer</h2>
        <p className="mt-1 text-sm text-gray-600">
          Browse D1 database tables and execute queries
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tables sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Tables</h3>
              <button
                onClick={fetchTables}
                className="text-gray-400 hover:text-gray-600"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {tables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => setSelectedTable(table.name)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    selectedTable === table.name
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Table size={16} />
                    {table.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Table data */}
          {selectedTable && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-gray-900">
                  {selectedTable}
                </h3>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12 text-gray-500">
                    Loading...
                  </div>
                ) : error ? (
                  <div className="text-center py-12 text-red-500">
                    {error}
                  </div>
                ) : (
                  renderTable(tableData)
                )}
              </div>
            </div>
          )}

          {/* Query editor */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">SQL Query</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="SELECT * FROM action_buttons LIMIT 10"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={4}
                />
                <button
                  onClick={executeQuery}
                  disabled={loading || !customQuery.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <Search size={20} />
                  Execute Query
                </button>
              </div>

              {queryResult && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Results</h4>
                  {renderTable(queryResult)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}