/**
 * OAuth 2.0 Authentication Module
 * Handles Google OAuth flow and token management
 */

import type { Env } from './index';

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: string;
}

/**
 * Generate OAuth 2.0 authorization URL
 */
export function generateAuthUrl(env: Env, state: string = ''): string {
  const scopes = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/bigquery.readonly'
  ];

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: state || crypto.randomUUID()
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  env: Env,
  code: string
): Promise<OAuthTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json() as any;

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  env: Env,
  refreshToken: string
): Promise<OAuthTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json() as any;

  return {
    access_token: data.access_token,
    refresh_token: refreshToken, // Keep original refresh token
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
  };
}

/**
 * Get user info from Google
 */
export async function getUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture: string;
}> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  const data = await response.json() as any;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

/**
 * Save OAuth tokens to D1 database
 */
export async function saveTokens(
  db: D1Database,
  userId: string,
  tokens: OAuthTokens
): Promise<void> {
  // Check if tokens exist for this user
  const existing = await db.prepare(`
    SELECT id FROM oauth_tokens WHERE user_id = ? AND provider = 'google'
  `).bind(userId).first();

  if (existing) {
    // Update existing tokens
    await db.prepare(`
      UPDATE oauth_tokens
      SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = datetime('now')
      WHERE user_id = ? AND provider = 'google'
    `).bind(
      tokens.access_token,
      tokens.refresh_token || null,
      tokens.expires_at,
      userId
    ).run();
  } else {
    // Insert new tokens
    await db.prepare(`
      INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token, expires_at)
      VALUES (?, 'google', ?, ?, ?)
    `).bind(
      userId,
      tokens.access_token,
      tokens.refresh_token || null,
      tokens.expires_at
    ).run();
  }
}

/**
 * Get valid access token for user (refresh if expired)
 */
export async function getValidAccessToken(
  db: D1Database,
  env: Env,
  userId: string
): Promise<string | null> {
  const tokenRow = await db.prepare(`
    SELECT access_token, refresh_token, expires_at
    FROM oauth_tokens
    WHERE user_id = ? AND provider = 'google'
  `).bind(userId).first() as any;

  if (!tokenRow) {
    return null;
  }

  const expiresAt = new Date(tokenRow.expires_at);
  const now = new Date();

  // If token expires in less than 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    if (!tokenRow.refresh_token) {
      return null; // Can't refresh without refresh token
    }

    try {
      const newTokens = await refreshAccessToken(env, tokenRow.refresh_token);
      await saveTokens(db, userId, newTokens);
      return newTokens.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  return tokenRow.access_token;
}

/**
 * Simple JWT encoding (for session management)
 */
export async function createJWT(
  secret: string,
  payload: any,
  expiresIn: number = 86400 // 24 hours
): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };

  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(jwtPayload));
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${data}.${signatureB64}`;
}

/**
 * Verify and decode JWT
 */
export async function verifyJWT(
  secret: string,
  token: string
): Promise<any | null> {
  try {
    const encoder = new TextEncoder();
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const data = `${headerB64}.${payloadB64}`;

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(data)
    );

    if (!valid) {
      return null;
    }

    const payload = JSON.parse(atob(payloadB64));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Get user ID from request cookie
 */
export async function getUserIdFromRequest(
  request: Request,
  jwtSecret: string
): Promise<string | null> {
  const cookie = request.headers.get('Cookie');
  if (!cookie) {
    return null;
  }

  const sessionMatch = cookie.match(/session=([^;]+)/);
  if (!sessionMatch) {
    return null;
  }

  const payload = await verifyJWT(jwtSecret, sessionMatch[1]);
  return payload?.userId || null;
}
