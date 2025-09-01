import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use("/api/*", cors({
  origin: "*", // Configure for your domain in production
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Health check
app.get("/api/health", (c) => c.json({ 
  status: "healthy",
  timestamp: new Date().toISOString()
}));

// Chat folders
app.get("/api/chat/folders", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT * FROM chat_folders ORDER BY position, name"
    ).all();
    return c.json(result.results);
  } catch (error) {
    return c.json({ error: "Failed to fetch folders" }, 500);
  }
});

app.post("/api/chat/folders", async (c) => {
  try {
    const body = await c.req.json();
    const { name, icon, webhook_url, webhook_headers } = body;
    
    const result = await c.env.DB.prepare(
      `INSERT INTO chat_folders (name, icon, webhook_url, webhook_headers) 
       VALUES (?, ?, ?, ?) RETURNING *`
    ).bind(name, icon || null, webhook_url, JSON.stringify(webhook_headers || {}))
     .first();
    
    return c.json(result, 201);
  } catch (error) {
    return c.json({ error: "Failed to create folder" }, 500);
  }
});

// Chat threads
app.get("/api/chat/folders/:folderId/threads", async (c) => {
  try {
    const folderId = c.req.param("folderId");
    const result = await c.env.DB.prepare(
      "SELECT * FROM chat_threads WHERE folder_id = ? ORDER BY last_activity DESC"
    ).bind(folderId).all();
    return c.json(result.results);
  } catch (error) {
    return c.json({ error: "Failed to fetch threads" }, 500);
  }
});

// Chat messages
app.get("/api/chat/threads/:threadId/messages", async (c) => {
  try {
    const threadId = c.req.param("threadId");
    const result = await c.env.DB.prepare(
      "SELECT * FROM chat_messages WHERE thread_id = ? ORDER BY created_at"
    ).bind(threadId).all();
    return c.json(result.results);
  } catch (error) {
    return c.json({ error: "Failed to fetch messages" }, 500);
  }
});

// Send message with SSE response
app.post("/api/chat/threads/:threadId/messages", async (c) => {
  try {
    const threadId = c.req.param("threadId");
    const body = await c.req.json();
    const { content, attachments } = body;
    
    // Save user message
    const userMessage = await c.env.DB.prepare(
      `INSERT INTO chat_messages (thread_id, role, content, attachments) 
       VALUES (?, 'user', ?, ?) RETURNING *`
    ).bind(threadId, content, JSON.stringify(attachments || []))
     .first();
    
    // Get thread and folder info for webhook
    const thread = await c.env.DB.prepare(
      `SELECT t.*, f.webhook_url, f.webhook_headers 
       FROM chat_threads t 
       JOIN chat_folders f ON t.folder_id = f.id 
       WHERE t.id = ?`
    ).bind(threadId).first();
    
    if (!thread) {
      return c.json({ error: "Thread not found" }, 404);
    }
    
    // Forward to n8n webhook
    const webhookResponse = await fetch(thread.webhook_url as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...JSON.parse((thread.webhook_headers as string) || "{}"),
      },
      body: JSON.stringify({
        threadId,
        message: content,
        attachments,
        metadata: thread.metadata,
      }),
    });
    
    const responseData = await webhookResponse.json() as any;
    
    // Save assistant response
    const assistantMessage = await c.env.DB.prepare(
      `INSERT INTO chat_messages (thread_id, role, content) 
       VALUES (?, 'assistant', ?) RETURNING *`
    ).bind(threadId, responseData?.response || "I couldn't process that request.")
     .first();
    
    // Update thread last message
    await c.env.DB.prepare(
      `UPDATE chat_threads 
       SET last_message = ?, last_activity = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(responseData?.response || content, threadId).run();
    
    return c.json({
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return c.json({ error: "Failed to send message" }, 500);
  }
});

// Action buttons
app.get("/api/buttons", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT b.*, c.name as collection_name, c.color as collection_color 
       FROM action_buttons b 
       LEFT JOIN button_collections c ON b.collection_id = c.id 
       WHERE b.enabled = 1 
       ORDER BY b.position, b.label`
    ).all();
    return c.json(result.results);
  } catch (error) {
    return c.json({ error: "Failed to fetch buttons" }, 500);
  }
});

app.post("/api/buttons", async (c) => {
  try {
    const body = await c.req.json();
    const { label, icon, color, webhook_url, webhook_method, webhook_headers, position, enabled, collection_id } = body;
    
    const result = await c.env.DB.prepare(
      `INSERT INTO action_buttons (label, icon, color, webhook_url, webhook_method, webhook_headers, position, enabled, collection_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(
      label, 
      icon || null, 
      color || '#3b82f6', 
      webhook_url, 
      webhook_method || 'POST',
      JSON.stringify(webhook_headers || {}),
      position || 0,
      enabled !== false ? 1 : 0,
      collection_id || null
    ).first();
    
    return c.json(result, 201);
  } catch (error) {
    return c.json({ error: "Failed to create button" }, 500);
  }
});

app.put("/api/buttons/:id", async (c) => {
  try {
    const buttonId = c.req.param("id");
    const body = await c.req.json();
    const { label, icon, color, webhook_url, webhook_method, webhook_headers, position, enabled, collection_id } = body;
    
    const result = await c.env.DB.prepare(
      `UPDATE action_buttons 
       SET label = ?, icon = ?, color = ?, webhook_url = ?, webhook_method = ?, 
           webhook_headers = ?, position = ?, enabled = ?, collection_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? RETURNING *`
    ).bind(
      label,
      icon,
      color,
      webhook_url,
      webhook_method || 'POST',
      JSON.stringify(webhook_headers || {}),
      position || 0,
      enabled !== false ? 1 : 0,
      collection_id,
      buttonId
    ).first();
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Failed to update button" }, 500);
  }
});

app.delete("/api/buttons/:id", async (c) => {
  try {
    const buttonId = c.req.param("id");
    await c.env.DB.prepare("DELETE FROM action_buttons WHERE id = ?").bind(buttonId).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete button" }, 500);
  }
});

app.post("/api/buttons/:id/trigger", async (c) => {
  try {
    const buttonId = c.req.param("id");
    const body = await c.req.json();
    
    const button = await c.env.DB.prepare(
      "SELECT * FROM action_buttons WHERE id = ? AND enabled = 1"
    ).bind(buttonId).first();
    
    if (!button) {
      return c.json({ error: "Button not found" }, 404);
    }
    
    const response = await fetch(button.webhook_url as string, {
      method: (button.webhook_method as string) || "POST",
      headers: {
        "Content-Type": "application/json",
        ...JSON.parse((button.webhook_headers as string) || "{}"),
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json() as any;
    return c.json(data);
  } catch (error) {
    return c.json({ error: "Failed to trigger button" }, 500);
  }
});

// Button Collections
app.get("/api/collections", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT c.*, COUNT(b.id) as button_count 
       FROM button_collections c 
       LEFT JOIN action_buttons b ON c.id = b.collection_id AND b.enabled = 1
       GROUP BY c.id 
       ORDER BY c.position, c.name`
    ).all();
    return c.json(result.results);
  } catch (error) {
    return c.json({ error: "Failed to fetch collections" }, 500);
  }
});

app.post("/api/collections", async (c) => {
  try {
    const body = await c.req.json();
    const { name, description, icon, color } = body;
    
    const result = await c.env.DB.prepare(
      `INSERT INTO button_collections (name, description, icon, color) 
       VALUES (?, ?, ?, ?) RETURNING *`
    ).bind(name, description || null, icon || null, color || '#3b82f6')
     .first();
    
    return c.json(result, 201);
  } catch (error) {
    return c.json({ error: "Failed to create collection" }, 500);
  }
});

app.put("/api/collections/:id", async (c) => {
  try {
    const collectionId = c.req.param("id");
    const body = await c.req.json();
    const { name, description, icon, color, position, collapsed } = body;
    
    const result = await c.env.DB.prepare(
      `UPDATE button_collections 
       SET name = ?, description = ?, icon = ?, color = ?, position = ?, collapsed = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? RETURNING *`
    ).bind(name, description, icon, color, position, collapsed ? 1 : 0, collectionId)
     .first();
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Failed to update collection" }, 500);
  }
});

app.delete("/api/collections/:id", async (c) => {
  try {
    const collectionId = c.req.param("id");
    
    // First unassign all buttons from this collection
    await c.env.DB.prepare(
      "UPDATE action_buttons SET collection_id = NULL WHERE collection_id = ?"
    ).bind(collectionId).run();
    
    // Then delete the collection
    await c.env.DB.prepare(
      "DELETE FROM button_collections WHERE id = ?"
    ).bind(collectionId).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete collection" }, 500);
  }
});

app.get("/api/collections/:id/buttons", async (c) => {
  try {
    const collectionId = c.req.param("id");
    const result = await c.env.DB.prepare(
      "SELECT * FROM action_buttons WHERE collection_id = ? AND enabled = 1 ORDER BY position, label"
    ).bind(collectionId).all();
    return c.json(result.results);
  } catch (error) {
    return c.json({ error: "Failed to fetch collection buttons" }, 500);
  }
});

// Files
app.get("/api/files", async (c) => {
  try {
    const prefix = c.req.query("prefix") || "";
    const limit = parseInt(c.req.query("limit") || "100");
    
    // List from R2
    const listed = await c.env.FILES.list({
      prefix,
      limit,
    });
    
    // Get metadata from D1
    const keys = listed.objects.map(obj => obj.key);
    if (keys.length > 0) {
      const placeholders = keys.map(() => "?").join(",");
      const metadata = await c.env.DB.prepare(
        `SELECT * FROM files_metadata WHERE key IN (${placeholders})`
      ).bind(...keys).all();
      
      const metadataMap = new Map(
        metadata.results.map((m: any) => [m.key, m])
      );
      
      return c.json({
        objects: listed.objects.map(obj => ({
          ...obj,
          metadata: metadataMap.get(obj.key),
        })),
        truncated: listed.truncated,
      });
    }
    
    return c.json(listed);
  } catch (error) {
    return c.json({ error: "Failed to list files" }, 500);
  }
});

app.post("/api/files/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }
    
    const key = `uploads/${Date.now()}-${file.name}`;
    
    // Upload to R2
    await c.env.FILES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });
    
    // Save metadata to D1
    const metadata = await c.env.DB.prepare(
      `INSERT INTO files_metadata (key, name, size, mime_type) 
       VALUES (?, ?, ?, ?) RETURNING *`
    ).bind(key, file.name, file.size, file.type).first();
    
    return c.json(metadata, 201);
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload file" }, 500);
  }
});

app.delete("/api/files/:key", async (c) => {
  try {
    const key = c.req.param("key");
    
    // Delete from R2
    await c.env.FILES.delete(key);
    
    // Delete from D1
    await c.env.DB.prepare(
      "DELETE FROM files_metadata WHERE key = ?"
    ).bind(key).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete file" }, 500);
  }
});

// Settings (KV)
app.get("/api/settings/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const value = await c.env.CACHE.get(`settings:${key}`);
    
    if (value === null) {
      return c.json({ error: "Setting not found" }, 404);
    }
    
    return c.json({ key, value: JSON.parse(value) });
  } catch (error) {
    return c.json({ error: "Failed to get setting" }, 500);
  }
});

app.put("/api/settings/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const body = await c.req.json();
    
    await c.env.CACHE.put(
      `settings:${key}`,
      JSON.stringify(body.value),
      { expirationTtl: 60 * 60 * 24 * 30 } // 30 days
    );
    
    return c.json({ key, value: body.value });
  } catch (error) {
    return c.json({ error: "Failed to save setting" }, 500);
  }
});

// Data viewer
app.get("/api/tables", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT name FROM sqlite_master 
       WHERE type='table' 
       AND name NOT LIKE 'sqlite_%' 
       AND name NOT LIKE '_cf_%'
       ORDER BY name`
    ).all();
    return c.json(result.results.map((r: any) => r.name));
  } catch (error) {
    return c.json({ error: "Failed to list tables" }, 500);
  }
});

app.get("/api/tables/:name", async (c) => {
  try {
    const tableName = c.req.param("name");
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = (page - 1) * limit;
    
    // Validate table name to prevent SQL injection
    const validTables = ["chat_folders", "chat_threads", "chat_messages", "action_buttons", "files_metadata"];
    if (!validTables.includes(tableName)) {
      return c.json({ error: "Invalid table name" }, 400);
    }
    
    const result = await c.env.DB.prepare(
      `SELECT * FROM ${tableName} LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();
    
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM ${tableName}`
    ).first();
    
    return c.json({
      data: result.results,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        pages: Math.ceil(((countResult?.total as number) || 0) / limit),
      },
    });
  } catch (error) {
    return c.json({ error: "Failed to query table" }, 500);
  }
});

export default app;
