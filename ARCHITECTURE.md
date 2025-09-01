# WorkflowHub Architecture

## Overview

WorkflowHub is a full-stack application built on Cloudflare's edge platform, providing a business workflow management dashboard with n8n integration.

## System Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   CF Edge   │────▶│     n8n     │
│  React SPA  │◀────│   Worker    │◀────│  Webhooks   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼───┐   ┌────▼────┐
              │   D1    │   │   R2    │
              │Database │   │ Storage │
              └─────────┘   └─────────┘
                    │             │
                    └──────┬──────┘
                           │
                      ┌────▼────┐
                      │   KV    │
                      │  Cache  │
                      └─────────┘
```

## Components

### Frontend (React SPA)
- **Framework**: React 19 with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Build**: Vite 6

### Backend (Cloudflare Worker)
- **Runtime**: Cloudflare Workers (V8 isolates)
- **Framework**: Hono (lightweight web framework)
- **Language**: TypeScript

### Data Layer
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Object Storage**: Cloudflare R2 (S3-compatible)
- **Cache**: Cloudflare KV (key-value store)

### External Integration
- **n8n Webhooks**: RESTful API integration
- **SSE**: Server-Sent Events for streaming responses

## Data Flow

### Chat System
1. User sends message through React UI
2. Worker receives POST request to `/api/chat/threads/:id/messages`
3. Worker stores message in D1
4. Worker forwards to n8n webhook URL (from folder config)
5. n8n processes and returns response via SSE
6. Worker streams response back to client
7. Client updates UI in real-time

### File Management
1. User uploads file via drag-and-drop
2. Worker receives multipart form data
3. Worker stores file in R2 bucket
4. Metadata saved in D1
5. File URL returned to client

### Action Buttons
1. User clicks action button
2. Worker triggers webhook with button config
3. n8n workflow executes
4. Response displayed to user

## Database Schema

### Core Tables
- `chat_folders` - Organize chat threads
- `chat_threads` - Individual conversations
- `chat_messages` - Message history
- `action_buttons` - Dashboard buttons
- `files_metadata` - R2 file references

## API Endpoints

### Chat
- `GET /api/chat/folders` - List folders
- `POST /api/chat/folders` - Create folder
- `GET /api/chat/threads/:id/messages` - Get messages
- `POST /api/chat/threads/:id/messages` - Send message (SSE response)

### Files
- `GET /api/files` - List files
- `POST /api/files/upload` - Upload file
- `DELETE /api/files/:key` - Delete file
- `GET /api/files/:key` - Download file

### Data
- `GET /api/tables` - List tables
- `GET /api/tables/:name` - Query table

### Settings
- `GET /api/settings/:key` - Get setting
- `PUT /api/settings/:key` - Update setting

## Security

### Authentication
- Basic auth token in KV (MVP)
- Planned: Cloudflare Access integration

### CORS
- Configured for n8n webhook origins
- Restrictive by default

### Data Protection
- All data encrypted at rest
- TLS for all connections
- No sensitive data in logs

## Performance

### Caching Strategy
- KV cache for frequent queries
- 60-second TTL for settings
- R2 with CDN for static files

### Optimization
- Code splitting with Vite
- Lazy loading for routes
- SSE for real-time updates
- Edge computing (0ms cold starts)

## Deployment

### Environments
- Development: `npm run dev`
- Preview: `npm run preview`
- Production: `npm run deploy`

### CI/CD
- Git push triggers build
- Wrangler deploys to Cloudflare
- Automatic SSL/TLS
- Global distribution

## Monitoring

### Observability
- Wrangler tail for logs
- Workers Analytics dashboard
- Error tracking in Worker

### Metrics
- Request count
- Response times
- Error rates
- Storage usage