import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { isEmailDomainAllowed, getAllowedDomainsMessage } from '../utils/email-validation';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
});

// Register endpoint
app.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const data = registerSchema.parse(body);
    
    // Check if email domain is allowed
    const allowedDomains = c.env.ALLOWED_EMAIL_DOMAINS || '*';
    if (!isEmailDomainAllowed(data.email, allowedDomains)) {
      const message = getAllowedDomainsMessage(allowedDomains);
      return c.json({ 
        error: `Email domain not allowed. ${message}` 
      }, 403);
    }
    
    // Hash password
    const passwordHash = await hashPassword(data.password);
    
    // Create user
    const userId = crypto.randomUUID();
    const result = await c.env.DB
      .prepare(`
        INSERT INTO users (id, username, email, password_hash)
        VALUES (?, ?, ?, ?)
      `)
      .bind(userId, data.username, data.email, passwordHash)
      .run();
    
    if (!result.success) {
      return c.json({ error: 'Failed to create user' }, 500);
    }
    
    // Generate JWT
    const token = await sign(
      {
        sub: userId,
        username: data.username,
        email: data.email,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
      },
      c.env.JWT_SECRET
    );
    
    return c.json({
      success: true,
      token,
      user: {
        id: userId,
        username: data.username,
        email: data.email,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'Username or email already exists' }, 409);
    }
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 400);
  }
});

// Login endpoint
app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const data = loginSchema.parse(body);
    
    // Get user
    const user = await c.env.DB
      .prepare(`
        SELECT id, username, email, password_hash
        FROM users
        WHERE username = ?
      `)
      .bind(data.username)
      .first();
    
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Verify password
    const valid = await verifyPassword(data.password, user.password_hash as string);
    if (!valid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Generate JWT
    const token = await sign(
      {
        sub: user.id,
        username: user.username,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
      },
      c.env.JWT_SECRET
    );
    
    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 400);
  }
});

// Verify token endpoint
app.get('/verify', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ valid: false }, 401);
  }
  
  try {
    const token = authHeader.slice(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    return c.json({
      valid: true,
      user: {
        id: payload.sub,
        username: payload.username,
        email: payload.email,
      },
    });
  } catch {
    return c.json({ valid: false }, 401);
  }
});

// Get allowed domains configuration
app.get('/allowed-domains', async (c) => {
  const allowedDomains = c.env.ALLOWED_EMAIL_DOMAINS || '*';
  const message = getAllowedDomainsMessage(allowedDomains);
  
  return c.json({
    domains: allowedDomains === '*' ? [] : allowedDomains.split(',').map(d => d.trim()),
    isOpen: allowedDomains === '' || allowedDomains === '*',
    message
  });
});

export default app;