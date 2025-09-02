import { Hono } from 'hono';
import type { Env } from '../types';
import { exportToCSV, exportToJSON } from '../../types/database';

const app = new Hono<{ Bindings: Env }>();

// List all tables with row counts
app.get('/tables', async (c) => {
  try {
    // Get all table names
    const tables = await c.env.DB
      .prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
        AND name NOT LIKE '_cf_%'
        ORDER BY name
      `)
      .all();
    
    // Get row count for each table
    const tablesWithCounts = await Promise.all(
      tables.results.map(async (table: any) => {
        const countResult = await c.env.DB
          .prepare(`SELECT COUNT(*) as count FROM "${table.name}"`)
          .first();
        
        return {
          name: table.name,
          rowCount: countResult?.count || 0
        };
      })
    );
    
    return c.json({ 
      success: true, 
      tables: tablesWithCounts 
    });
  } catch (error) {
    console.error('Failed to list tables:', error);
    return c.json({ success: false, error: 'Failed to list tables' }, 500);
  }
});

// Get table schema/columns
app.get('/tables/:name/schema', async (c) => {
  const tableName = c.req.param('name');
  
  try {
    // Validate table name to prevent SQL injection
    const tableCheck = await c.env.DB
      .prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name = ?
      `)
      .bind(tableName)
      .first();
    
    if (!tableCheck) {
      return c.json({ success: false, error: 'Table not found' }, 404);
    }
    
    // Get column information
    const columns = await c.env.DB
      .prepare(`PRAGMA table_info("${tableName}")`)
      .all();
    
    return c.json({ 
      success: true, 
      columns: columns.results 
    });
  } catch (error) {
    console.error('Failed to get table schema:', error);
    return c.json({ success: false, error: 'Failed to get table schema' }, 500);
  }
});

// Get paginated table data with search and filtering
app.get('/tables/:name/data', async (c) => {
  const tableName = c.req.param('name');
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '50');
  const sortBy = c.req.query('sortBy');
  const sortOrder = c.req.query('sortOrder') || 'asc';
  const search = c.req.query('search');
  
  try {
    // Validate table name
    const tableCheck = await c.env.DB
      .prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name = ?
      `)
      .bind(tableName)
      .first();
    
    if (!tableCheck) {
      return c.json({ success: false, error: 'Table not found' }, 404);
    }
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM "${tableName}"`;
    let dataQuery = `SELECT * FROM "${tableName}"`;
    
    // Add search condition if provided
    if (search) {
      // Get columns to search
      const columns = await c.env.DB
        .prepare(`PRAGMA table_info("${tableName}")`)
        .all();
      
      // Build search condition for all text columns
      const searchConditions = columns.results
        .filter((col: any) => col.type.includes('TEXT') || col.type.includes('VARCHAR'))
        .map((col: any) => `"${col.name}" LIKE '%${search}%'`)
        .join(' OR ');
      
      if (searchConditions) {
        const whereClause = ` WHERE ${searchConditions}`;
        countQuery += whereClause;
        dataQuery += whereClause;
      }
    }
    
    // Get total count
    const countResult = await c.env.DB.prepare(countQuery).first();
    const totalCount = countResult?.count || 0;
    
    // Add sorting
    if (sortBy) {
      dataQuery += ` ORDER BY "${sortBy}" ${sortOrder.toUpperCase()}`;
    }
    
    // Add pagination
    const offset = (page - 1) * pageSize;
    dataQuery += ` LIMIT ${pageSize} OFFSET ${offset}`;
    
    // Get data
    const data = await c.env.DB.prepare(dataQuery).all();
    
    // Get column names
    const columns = data.results.length > 0 
      ? Object.keys(data.results[0])
      : [];
    
    return c.json({ 
      success: true,
      data: {
        columns,
        rows: data.results,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil((totalCount as number) / pageSize)
      }
    });
  } catch (error) {
    console.error('Failed to get table data:', error);
    return c.json({ success: false, error: 'Failed to get table data' }, 500);
  }
});

// Export table data
app.get('/tables/:name/export', async (c) => {
  const tableName = c.req.param('name');
  const format = c.req.query('format') || 'json';
  const allData = c.req.query('all') === 'true';
  
  try {
    // Validate table name
    const tableCheck = await c.env.DB
      .prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name = ?
      `)
      .bind(tableName)
      .first();
    
    if (!tableCheck) {
      return c.json({ success: false, error: 'Table not found' }, 404);
    }
    
    // Get data (limited to 10000 rows for safety)
    const limit = allData ? 10000 : 1000;
    const data = await c.env.DB
      .prepare(`SELECT * FROM "${tableName}" LIMIT ${limit}`)
      .all();
    
    if (!data.results || data.results.length === 0) {
      return c.json({ success: false, error: 'No data to export' }, 404);
    }
    
    const columns = Object.keys(data.results[0]);
    
    // Format based on requested type
    if (format === 'csv') {
      const csv = exportToCSV(data.results, columns);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${tableName}.csv"`
        }
      });
    } else {
      const json = exportToJSON(data.results, true);
      return new Response(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${tableName}.json"`
        }
      });
    }
  } catch (error) {
    console.error('Failed to export table data:', error);
    return c.json({ success: false, error: 'Failed to export table data' }, 500);
  }
});

// Execute custom query (read-only)
app.post('/query', async (c) => {
  const { query } = await c.req.json();
  
  try {
    // Only allow SELECT queries
    const normalizedQuery = query.trim().toUpperCase();
    if (!normalizedQuery.startsWith('SELECT')) {
      return c.json({ 
        success: false, 
        error: 'Only SELECT queries are allowed' 
      }, 400);
    }
    
    // Execute query with timeout
    const result = await c.env.DB
      .prepare(query)
      .all();
    
    const columns = result.results.length > 0 
      ? Object.keys(result.results[0])
      : [];
    
    return c.json({ 
      success: true,
      data: {
        columns,
        rows: result.results,
        rowCount: result.results.length
      }
    });
  } catch (error: any) {
    console.error('Query execution failed:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Query execution failed' 
    }, 400);
  }
});

export default app;