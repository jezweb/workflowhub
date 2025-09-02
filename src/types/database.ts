export interface TableInfo {
  name: string;
  rowCount: number;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  notnull: boolean;
  dflt_value: any;
  pk: boolean;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}

export interface TableFilter {
  column?: string;
  value?: string;
  operator?: 'eq' | 'like' | 'gt' | 'lt' | 'gte' | 'lte';
}

export interface TableQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: TableFilter[];
}

export interface ExportFormat {
  format: 'json' | 'csv';
  includeHeaders?: boolean;
}

export function formatColumnValue(value: any, _type?: string): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function getColumnType(value: any): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'INTEGER' : 'REAL';
  }
  if (typeof value === 'string') return 'TEXT';
  if (typeof value === 'object') return 'JSON';
  return 'UNKNOWN';
}

export function exportToCSV(data: Record<string, any>[], columns: string[]): string {
  const headers = columns.join(',');
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col];
      const formatted = formatColumnValue(value);
      // Escape quotes and wrap in quotes if contains comma or quotes
      if (formatted.includes(',') || formatted.includes('"')) {
        return `"${formatted.replace(/"/g, '""')}"`;
      }
      return formatted;
    }).join(',')
  );
  return [headers, ...rows].join('\n');
}

export function exportToJSON(data: Record<string, any>[], pretty = true): string {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}