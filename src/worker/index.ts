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
      "SELECT * FROM action_buttons WHERE enabled = 1 ORDER BY position, label"
    ).all();
    return c.json(result.results);
  } catch (error) {
    return c.json({ error: "Failed to fetch buttons" }, 500);
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
