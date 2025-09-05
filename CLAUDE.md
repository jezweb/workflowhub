# WorkflowHub 2.0 Development Guidelines

## Project Overview
WorkflowHub 2.0 is a complete rewrite focused on simplicity, functionality, and clean architecture without over-engineering.

## Key Principles
1. **Simplicity First** - Avoid premature optimization and over-abstraction
2. **Working Features** - Prioritize functional code over perfect architecture
3. **Clean Code** - Self-documenting, minimal comments
4. **Type Safety** - Full TypeScript coverage
5. **User Focus** - Build for small teams, not enterprises

## Tech Stack

### Frontend
- React 19 with functional components and hooks
- TypeScript 5.8 for type safety
- shadcn/ui for clean, customizable components
- Tailwind CSS for utility-first styling
- React Hook Form + Zod for forms
- TanStack Query for data fetching
- Zustand for state management

### Backend
- Cloudflare Workers with static assets
- Hono for lightweight routing
- D1 for SQLite database
- R2 for file storage
- JWT for authentication

## Code Style

### General Rules
- Use TypeScript strict mode
- Prefer const over let
- Use async/await over promises
- Extract reusable logic to hooks/utils
- Keep functions small and focused

### React Components
```tsx
// Good: Clean functional component
export function UserCard({ user }: UserCardProps) {
  const { logout } = useAuth();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={logout}>Logout</Button>
      </CardContent>
    </Card>
  );
}
```

### API Routes
```ts
// Good: Clean route handler
app.post('/api/forms/:id/submit', authMiddleware, async (c) => {
  const formId = c.req.param('id');
  const data = await c.req.json();
  
  // Validate with Zod
  const validated = formSubmissionSchema.parse(data);
  
  // Store in D1
  const result = await c.env.DB
    .prepare('INSERT INTO submissions ...')
    .bind(formId, JSON.stringify(validated))
    .run();
  
  // Call webhook
  await callWebhook(c.env.WEBHOOK_URL, validated);
  
  return c.json({ success: true, id: result.meta.last_row_id });
});
```

## File Organization

### Component Structure
```
components/
├── forms/
│   ├── FormBuilder.tsx      # Main component
│   ├── FormField.tsx        # Sub-component
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Helper functions
```

### Naming Conventions
- Components: PascalCase (`FormBuilder.tsx`)
- Utilities: camelCase (`utils.ts`)
- Types: PascalCase (`UserProfile`)
- Constants: UPPER_SNAKE (`MAX_FILE_SIZE`)
- CSS classes: kebab-case (`form-field`)

## Database Patterns

### Use Prepared Statements
```ts
// Good
const user = await db
  .prepare('SELECT * FROM users WHERE id = ?')
  .bind(userId)
  .first();

// Bad - SQL injection risk
const user = await db
  .prepare(`SELECT * FROM users WHERE id = ${userId}`)
  .first();
```

### Handle Transactions
```ts
// Good: Use batch for multiple operations
await db.batch([
  db.prepare('INSERT INTO forms ...').bind(...),
  db.prepare('INSERT INTO fields ...').bind(...)
]);
```

## Error Handling

### API Errors
```ts
// Good: Consistent error responses
try {
  const result = await someOperation();
  return c.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return c.json(
    { success: false, error: 'Operation failed' },
    400
  );
}
```

### Frontend Errors
```tsx
// Good: User-friendly error handling
const { mutate, isLoading, error } = useMutation({
  mutationFn: submitForm,
  onError: (error) => {
    toast.error(error.message || 'Something went wrong');
  },
  onSuccess: () => {
    toast.success('Form submitted successfully');
  }
});
```

## Testing Strategy

### Unit Tests
- Test utilities and helpers
- Test validation schemas
- Test component logic

### Integration Tests
- Test API endpoints
- Test database operations
- Test webhook calls

### E2E Tests (Optional)
- Test critical user flows
- Test form submissions
- Test file uploads

## Performance Guidelines

### Frontend
- Lazy load routes
- Use React.memo for expensive components
- Virtualize long lists
- Debounce search inputs
- Optimize images

### Backend
- Use indexes on frequently queried columns
- Paginate large datasets
- Stream large responses
- Cache static data in browser

## Security Checklist

### Always
- [ ] Hash passwords with bcrypt
- [ ] Validate all inputs with Zod
- [ ] Use parameterized queries
- [ ] Sanitize file uploads
- [ ] Check JWT on protected routes
- [ ] Set proper CORS headers

### Never
- [ ] Store secrets in code
- [ ] Log sensitive data
- [ ] Trust client-side validation alone
- [ ] Use eval() or dynamic SQL
- [ ] Expose internal errors to users

## Development Workflow

### Daily Development
1. Pull latest changes
2. Create feature branch
3. Write code with types
4. Test locally
5. Run type check: `npm run check`
6. Commit with clear message
7. Push and create PR

### Before Deployment
1. Run full type check
2. Test all critical paths
3. Check console for errors
4. Verify environment variables
5. Review security checklist
6. Deploy to staging first

## Common Patterns

### Form Handling
```tsx
// Use React Hook Form + Zod
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema)
  });
  
  const onSubmit = async (data) => {
    await api.post('/endpoint', data);
  };
  
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

### Data Fetching
```tsx
// Use TanStack Query
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users')
  });
}
```

### State Management
```ts
// Use Zustand for global state
const useAuthStore = create((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null })
}));
```

## Troubleshooting

### Common Issues

**TypeScript errors**: Run `npm run check` to see all errors

**Build failures**: Clear `.wrangler` and `dist` folders

**Database issues**: Check migrations are applied

**Auth problems**: Verify JWT_SECRET is set

**Upload failures**: Check R2 bucket exists and has correct bindings

## Recent Implementations

### Context & Variables System (v2.4.0)
- **Organization Context** - Central company information management
  - Organization details, logo, social links stored in D1
  - Keywords, Products, Services tags (v2.4.0)
  - Available as {{org.*}} variables throughout the system
- **Team Profiles** - Individual user profile system  
  - Personal details, contact info, bio, skills
  - Available as {{team.*}} variables for current user
- **Custom Variables** - Flexible key-value store
  - Global variables (all users) and personal variables (user-specific)
  - Support for string, number, boolean, JSON data types
  - Sensitive variable masking for API keys and secrets
  - Available as {{custom.*}} and {{my.*}} variables
- **Variable Service** - Centralized substitution engine
  - Located in `worker/services/variables.ts`
  - Handles all variable substitution across Actions and Forms
  - Organization tags available as comma-separated lists and individual items
- **Settings UI** - Three enhanced tabs in Settings page
  - Organization Settings with tag management for Keywords/Products/Services
  - Team Profile for user profiles with skills management
  - Variables for custom variable management

### Unified Appearance System (v2.2.1)
- Shared appearance constants in `lib/appearance.ts`
- 10 predefined color themes with visual previews
- Default theme uses shadcn primary colors (adapts to light/dark)
- Consistent appearance between Forms and Actions
- Live preview in both builders
- Theme application in public forms

## Important Notes

### What We're NOT Doing
- No KV cache (complexity without benefit)
- No microservices (monolith is fine)
- No complex state management (Zustand is enough)
- No custom CSS framework (Tailwind works)
- No premature optimization

### What We ARE Doing
- Simple, working features
- Clean, readable code
- Proper error handling
- Type safety everywhere
- User-friendly interfaces
- Shared components and constants where it makes sense

## Quick Commands

```bash
# Development
npm run dev          # Start dev server
npm run check        # Type check
npm run build        # Build for production
npm run preview      # Test production build

# Database
wrangler d1 execute workflowhub --local --command "SELECT * FROM users"
wrangler d1 migrations apply workflowhub --local

# Deployment
npm run deploy       # Deploy to Cloudflare

# Debugging
wrangler tail        # View live logs
```

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Hono Documentation](https://hono.dev/)
- [React Hook Form](https://react-hook-form.com/)
- [TanStack Query](https://tanstack.com/query/)

## Remember

> "Make it work, make it right, make it fast" - in that order.

Focus on delivering working features that users need, not perfect code that might be needed someday.