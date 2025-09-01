# WorkflowHub

A comprehensive business workflow management dashboard with n8n integration, built on Cloudflare Workers with React.

🚀 **Live Demo**: [https://workflowhub.webfonts.workers.dev](https://workflowhub.webfonts.workers.dev)  
📦 **Repository**: [https://github.com/jezweb/workflowhub](https://github.com/jezweb/workflowhub)

## Features

- 🎯 **Action Buttons Dashboard** - Quick-trigger workflows with customizable buttons organized in collections
- 💬 **Multi-threaded Chat System** - Organized conversations with folder-based webhook routing
- 📁 **File Management** - R2-powered file storage with upload/download capabilities
- 🗄️ **D1 Database Viewer** - Browse and query your database directly
- ⚙️ **Settings Manager** - Configure buttons, folders, collections, and system settings via KV storage
- 📂 **Button Collections** - Organize dashboard buttons into thematic groups with descriptions

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v3
- **Backend**: Cloudflare Workers with Hono
- **Storage**: Cloudflare D1 (SQLite), R2 (Object Storage), KV (Cache)
- **Deployment**: Cloudflare Workers with Static Assets

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)

### Installation & Deployment

1. **Clone the repository**
   ```bash
   git clone https://github.com/jezweb/workflowhub.git
   cd workflowhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set your Cloudflare account ID**
   ```bash
   export CLOUDFLARE_ACCOUNT_ID="your-account-id"
   ```

4. **Create Cloudflare resources**
   ```bash
   # Create D1 database
   npx wrangler d1 create workflowhub-db
   
   # Create R2 bucket
   npx wrangler r2 bucket create workflowhub-files
   
   # Create KV namespace
   npx wrangler kv namespace create CACHE
   ```

5. **Update wrangler.jsonc with the IDs from step 4**
   - Replace `YOUR_D1_DATABASE_ID` with the database ID
   - Replace `YOUR_KV_NAMESPACE_ID` with the KV namespace ID

6. **Apply database migrations**
   ```bash
   npx wrangler d1 migrations apply workflowhub-db --local
   npx wrangler d1 migrations apply workflowhub-db --remote
   ```

7. **Build and deploy**
   ```bash
   npm run build
   npm run deploy
   ```

Your application will be deployed to `https://[your-subdomain].workers.dev`

### Configure n8n Webhooks

1. Update the `DEFAULT_WEBHOOK_URL` in `wrangler.jsonc` with your n8n webhook URL
2. Configure individual folder webhooks in the Settings page of the deployed app
3. Action buttons can trigger different n8n workflows via their webhook URLs

## Development

```bash
npm run dev        # Start local development server
npm run build      # Build for production
npm run check      # TypeScript and build validation
npm run deploy     # Deploy to Cloudflare
```

## Project Structure

```
workflowhub/
├── src/
│   ├── worker/          # Cloudflare Worker API endpoints
│   │   └── index.ts     # Main worker with Hono routes
│   └── react-app/       # React frontend
│       ├── App.tsx      # Main app component
│       └── pages/       # Page components
├── migrations/          # D1 database migrations
├── public/             # Static assets
├── wrangler.jsonc      # Cloudflare configuration
└── vite.config.ts      # Vite configuration
```

## API Endpoints

### Action Buttons & Collections
- `GET /api/buttons` - List action buttons with collection info
- `POST /api/buttons` - Create new button
- `PUT /api/buttons/:id` - Update button
- `DELETE /api/buttons/:id` - Delete button
- `POST /api/buttons/:id/trigger` - Trigger button webhook
- `GET /api/collections` - List button collections
- `POST /api/collections` - Create collection
- `PUT /api/collections/:id` - Update collection
- `DELETE /api/collections/:id` - Delete collection
- `GET /api/collections/:id/buttons` - Get buttons in collection

### Chat System
- `GET /api/chat/folders` - List chat folders
- `POST /api/chat/folders` - Create chat folder
- `GET /api/chat/folders/:id/threads` - List threads in folder
- `POST /api/chat/threads/:id/messages` - Send chat message

### File Management
- `GET /api/files` - List files in R2
- `POST /api/files/upload` - Upload file to R2
- `DELETE /api/files/:key` - Delete file

### Database & Settings
- `GET /api/data/tables` - List D1 tables
- `POST /api/data/query` - Execute SQL query
- `GET /api/settings` - Get KV settings
- `PUT /api/settings/:key` - Update setting

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design and technical details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues, questions, or suggestions, please [open an issue](https://github.com/jezweb/workflowhub/issues) on GitHub.