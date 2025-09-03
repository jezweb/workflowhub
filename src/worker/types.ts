export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  DISABLE_REGISTRATION?: string;
  TURNSTILE_SECRET_KEY?: string;
  ASSETS: Fetcher;
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