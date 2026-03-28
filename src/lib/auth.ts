import { NextRequest } from "next/server";
import { createHash, randomInt } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

// ── Admin tokens ──

export function createToken(): string {
  const payload = {
    role: "admin",
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000,
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

// ── User tokens ──

export function createUserToken(userId: string, email: string): string {
  const payload = {
    role: "user",
    userId,
    email,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const encoded = btoa(JSON.stringify(payload));
  const signature = btoa(JWT_SECRET + encoded);
  return `${encoded}.${signature}`;
}

export function verifyUserToken(token: string): { valid: boolean; userId?: string; email?: string } {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return { valid: false };
    const expectedSig = btoa(JWT_SECRET + encoded);
    if (signature !== expectedSig) return { valid: false };
    const payload = JSON.parse(atob(encoded));
    if (payload.exp < Date.now()) return { valid: false };
    if (payload.role !== "user") return { valid: false };
    return { valid: true, userId: payload.userId, email: payload.email };
  } catch {
    return { valid: false };
  }
}

// ── Password hashing ──

export function hashPassword(password: string): string {
  return createHash("sha256").update(password + JWT_SECRET).digest("hex");
}

// ── OTP system (in-memory; production would use DB/Redis + real SMS/email) ──

const otpStore = new Map<string, { otp: string; expires: number }>();

export function generateOTP(email: string): string {
  const otp = String(randomInt(100000, 999999));
  otpStore.set(email.toLowerCase(), { otp, expires: Date.now() + 10 * 60 * 1000 });
  return otp;
}

export function verifyOTP(email: string, otp: string): boolean {
  const stored = otpStore.get(email.toLowerCase());
  if (!stored) return false;
  if (stored.expires < Date.now()) { otpStore.delete(email.toLowerCase()); return false; }
  if (stored.otp !== otp) return false;
  otpStore.delete(email.toLowerCase());
  return true;
}
