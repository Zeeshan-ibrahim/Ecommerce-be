import type { IncomingHttpHeaders } from "http";
import jwt from "jsonwebtoken";

import prisma from "../config/prisma";

export function getBearerToken(headers: IncomingHttpHeaders): string | null {
  const raw = headers.authorization;
  if (typeof raw !== "string" || !raw.startsWith("Bearer ")) {
    return null;
  }
  const token = raw.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function validateAuthToken(
  headers: IncomingHttpHeaders,
): Promise<boolean> {
  const refreshToken = getBearerToken(headers);
  if (!refreshToken) {
    return false;
  }

  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not set");
  }

  try {
    jwt.verify(refreshToken, secret);
  } catch {
    return false;
  }

  const session = await prisma.session.findUnique({
    where: { refreshToken },
  });

  if (!session || session.expiresAt < new Date()) {
    return false;
  }

  return true;
}

export function getUserInfo(
  refreshToken: string,
): { user: { id: string } } | null {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not set");
  }

  try {
    const payload = jwt.verify(refreshToken, secret) as jwt.JwtPayload & {
      id?: string;
    };
    const id = typeof payload.id === "string" ? payload.id : null;
    if (!id) {
      return null;
    }
    return { user: { id } };
  } catch {
    return null;
  }
}
