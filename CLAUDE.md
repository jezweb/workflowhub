# WorkflowHub Development Guidelines

## Project Overview
WorkflowHub is a business workflow management dashboard with n8n integration, built on Cloudflare Workers.

## Code Style Guidelines

### General Principles
- Keep code simple and modular
- Avoid over-engineering
- Write self-documenting code
- Use TypeScript for type safety
- Follow existing patterns in the codebase

### React Components
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic to custom hooks
- Use TypeScript interfaces for props

### API Design
- RESTful endpoints
- Consistent error handling
- Use proper HTTP status codes
- Return JSON responses

### File Organization
```
src/
├── components/     # Reusable UI components
├── pages/         # Page-level components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
└── types/         # TypeScript type definitions

worker/
├── routes/        # API route handlers
├── middleware/    # Request middleware
└── utils/         # Helper functions
```

## Development Workflow

### Testing
- Write simple unit tests for utilities
- Test API endpoints with integration tests
- Use TypeScript for compile-time checks
- Run `npm run check` before committing

### Git Commits
- Use descriptive commit messages
- Commit logical units of work
- Run tests before committing
- Push to remote after successful builds

### Deployment
- Build locally first: `npm run build`
- Test the build: `npm run preview`
- Deploy to Cloudflare: `npm run deploy`
- Verify deployment in dashboard

## Technology Versions
- React 19
- Vite 6
- TypeScript 5.8
- Tailwind CSS v4 (when available, use v3 for now)
- Cloudflare Workers with Static Assets
- Wrangler 4.x

## n8n Integration

### Webhook Format
```json
{
  "action": "process_message",
  "data": {
    "message": "user input",
    "threadId": "uuid",
    "metadata": {}
  }
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "response": "processed output",
    "metadata": {}
  }
}
```

## Cloudflare Resources

### Bindings
- `DB` - D1 database
- `FILES` - R2 bucket
- `CACHE` - KV namespace

### Environment Variables
- `DEFAULT_WEBHOOK_URL` - Default n8n webhook
- `AUTH_TOKEN` - Authentication token

## Common Tasks

### Add a new API endpoint
1. Create route handler in `worker/routes/`
2. Add to router in `worker/index.ts`
3. Add TypeScript types
4. Test with curl or Postman

### Add a new page
1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link
4. Test routing

### Update database schema
1. Create migration file
2. Test locally with `wrangler d1 execute`
3. Apply to production with `wrangler d1 migrations apply`

## Troubleshooting

### Common Issues
- **Build errors**: Check TypeScript types
- **Deploy failures**: Verify wrangler.json config
- **API errors**: Check worker logs with `wrangler tail`
- **Database issues**: Verify D1 bindings

### Debug Commands
```bash
# Check types
npm run check

# View logs
wrangler tail

# Test locally
npm run dev

# Test production build
npm run preview
```

## Performance Tips
- Use KV for caching frequent queries
- Implement pagination for large datasets
- Use SSE for real-time updates
- Optimize bundle size with code splitting

## Security Notes
- Never commit secrets to git
- Use environment variables for sensitive data
- Validate all user inputs
- Sanitize data before storage
- Use CORS appropriately

## Remember
- Keep it simple
- Test before deploying
- Document significant changes
- Ask for clarification when needed