import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { isEmailDomainAllowed, getAllowedDomainsMessage } from '../utils/email-validation';
import { 
  generateVerificationToken, 
  getVerificationExpiry, 
  isTokenExpired,
  sendVerificationEmail,
  canResendVerification
} from '../utils/verification';
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
    
    // Generate verification token
    const verificationToken = await generateVerificationToken();
    const verificationExpires = getVerificationExpiry();
    const now = new Date().toISOString();
    
    // Create unverified user
    const userId = crypto.randomUUID();
    const result = await c.env.DB
      .prepare(`
        INSERT INTO users (
          id, username, email, password_hash, 
          email_verified, verification_token, 
          verification_expires, verification_sent_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        userId, data.username, data.email, passwordHash,
        false, verificationToken, verificationExpires, now
      )
      .run();
    
    if (!result.success) {
      return c.json({ error: 'Failed to create user' }, 500);
    }
    
    // Send verification email
    const emailSent = await sendVerificationEmail(
      c.env.EMAIL_WEBHOOK_URL,
      data.email,
      data.username,
      verificationToken,
      c.env.APP_URL
    );
    
    if (!emailSent) {
      console.error('Failed to send verification email for user:', userId);
    }
    
    return c.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      requiresVerification: true,
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
        SELECT id, username, email, password_hash, email_verified
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
    
    // Check if email is verified
    if (!user.email_verified) {
      return c.json({ 
        error: 'Email not verified. Please check your email for the verification link.',
        requiresVerification: true,
        email: user.email
      }, 403);
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

// Verify email with token
app.post('/verify-email', async (c) => {
  try {
    const body = await c.req.json();
    const { token } = body;
    
    if (!token) {
      return c.json({ error: 'Verification token is required' }, 400);
    }
    
    // Find user with this token
    const user = await c.env.DB
      .prepare(`
        SELECT id, username, email, verification_expires
        FROM users
        WHERE verification_token = ? AND email_verified = FALSE
      `)
      .bind(token)
      .first();
    
    if (!user) {
      return c.json({ error: 'Invalid or expired verification token' }, 400);
    }
    
    // Check if token has expired
    if (isTokenExpired(user.verification_expires as string)) {
      return c.json({ error: 'Verification token has expired. Please request a new one.' }, 400);
    }
    
    // Mark email as verified
    await c.env.DB
      .prepare(`
        UPDATE users 
        SET email_verified = TRUE, 
            verification_token = NULL,
            verification_expires = NULL
        WHERE id = ?
      `)
      .bind(user.id)
      .run();
    
    return c.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
      user: {
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return c.json({ error: 'Verification failed' }, 400);
  }
});

// Resend verification email
app.post('/resend-verification', async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    // Get user
    const user = await c.env.DB
      .prepare(`
        SELECT id, username, email_verified, verification_sent_at
        FROM users
        WHERE email = ?
      `)
      .bind(email)
      .first();
    
    if (!user) {
      // Don't reveal if email exists
      return c.json({ 
        success: true, 
        message: 'If an account exists with this email, a verification link has been sent.' 
      });
    }
    
    if (user.email_verified) {
      return c.json({ error: 'Email is already verified' }, 400);
    }
    
    // Check rate limiting
    if (!canResendVerification(user.verification_sent_at as string | null)) {
      return c.json({ 
        error: 'Please wait 5 minutes before requesting another verification email' 
      }, 429);
    }
    
    // Generate new token
    const verificationToken = await generateVerificationToken();
    const verificationExpires = getVerificationExpiry();
    const now = new Date().toISOString();
    
    // Update user with new token
    await c.env.DB
      .prepare(`
        UPDATE users 
        SET verification_token = ?,
            verification_expires = ?,
            verification_sent_at = ?
        WHERE id = ?
      `)
      .bind(verificationToken, verificationExpires, now, user.id)
      .run();
    
    // Send verification email
    await sendVerificationEmail(
      c.env.EMAIL_WEBHOOK_URL,
      email,
      user.username as string,
      verificationToken,
      c.env.APP_URL
    );
    
    return c.json({
      success: true,
      message: 'Verification email has been sent. Please check your inbox.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return c.json({ error: 'Failed to resend verification email' }, 400);
  }
});

export default app;