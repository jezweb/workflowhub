# WorkflowHub

Business workflow management dashboard with n8n integration, built on Cloudflare Workers.

## Features

- 📁 **Chat System** - Multi-threaded conversations organized in folders with n8n webhook integration
- 📂 **File Manager** - R2-powered file storage with upload/download capabilities
- 🎯 **Action Dashboard** - Customizable buttons to trigger n8n workflows
- 📊 **Data Viewer** - Browse and manage D1 database tables
- ⚙️ **Settings Manager** - Key-value configuration storage using KV

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 6
- **Backend**: Cloudflare Workers with Hono
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (Object Storage)
- **Cache**: Cloudflare KV
- **Styling**: Tailwind CSS v4

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

## Development

```bash
# Type checking
npm run check

# Linting
npm run lint

# Preview production build
npm run preview
```

## Project Structure

```
workflowhub/
├── src/              # React frontend
├── worker/           # API endpoints
├── migrations/       # D1 database schemas
└── public/           # Static assets
```

## Environment Setup

1. Create D1 database: `wrangler d1 create workflowhub-db`
2. Create R2 bucket: `wrangler r2 bucket create workflowhub-files`
3. Create KV namespace: `wrangler kv namespace create CACHE`
4. Update `wrangler.json` with the generated IDs

## License

MIT
