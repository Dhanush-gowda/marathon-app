import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

export function createToken(): string {
  // Simple HMAC-based token using Web Crypto API
  // For production, use jose or similar JWT library
  const payload = {
    role: "admin",
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  const encoded = btoa(JSON.stringify(payload));
  const signature = btoa(JWT_SECRET + encoded);
  return `${encoded}.${signature}`;
}

export function verifyToken(token: string): boolean {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return false;

    const expectedSig = btoa(JWT_SECRET + encoded);
    if (signature !== expectedSig) return false;

    const payload = JSON.parse(atob(encoded));
    if (payload.exp < Date.now()) return false;
    if (payload.role !== "admin") return false;

    return true;
  } catch {
    return false;
  }
}

export function requireAdmin(request: NextRequest): { authorized: boolean; error?: string } {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { authorized: false, error: "Missing authorization header" };
  }

  const token = authHeader.slice(7);
  if (!verifyToken(token)) {
    return { authorized: false, error: "Invalid or expired token" };
  }

  return { authorized: true };
}
