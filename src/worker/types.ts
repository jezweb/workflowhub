export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  ALLOWED_EMAIL_DOMAINS: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface JWTPayload {
  sub: string;
  username: string;
  email: string;
  exp: number;
}