// lib/auth/jwt.ts
import { SignJWT, jwtVerify } from 'jose';
import { JWTPayload, SessionUser } from './types';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'change-this-to-a-long-random-secret-min-32-chars'
);
const EXPIRES = '8h';

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}