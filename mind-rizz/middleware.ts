import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'mindrizz_admin_gate';
const MAX_AGE_MS = 10 * 60 * 1000;

/**
 * Convert a hexadecimal string into bytes.
 */
function hexToBytes(hex: string): Uint8Array | null {
  if (
    !hex ||
    hex.length % 2 !== 0 ||
    !/^[0-9a-f]+$/i.test(hex)
  ) {
    return null;
  }

  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(
      hex.slice(i * 2, i * 2 + 2),
      16
    );
  }

  return bytes;
}

/**
 * Verify the signed admin gate cookie.
 *
 * Token format:
 *   issuedAt.signatureHex
 *
 * The signature is an HMAC-SHA256 signature
 * of the issuedAt timestamp.
 */
async function verifyGateToken(
  token: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = token.split('.');

    if (parts.length !== 2) {
      return false;
    }

    const issuedAtText = parts[0];
    const signatureHex = parts[1];

    if (!issuedAtText || !signatureHex) {
      return false;
    }

    // Timestamp must contain digits only.
    if (!/^\d+$/.test(issuedAtText)) {
      return false;
    }

    const issuedAt = Number(issuedAtText);

    if (!Number.isFinite(issuedAt)) {
      return false;
    }

    // Reject expired or future tokens.
    const age = Date.now() - issuedAt;

    if (age < 0 || age > MAX_AGE_MS) {
      return false;
    }

    // Signature is stored as hexadecimal.
    const signature = hexToBytes(signatureHex);

    if (!signature) {
      return false;
    }

    // Create HMAC-SHA256 verification key.
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      {
        name: 'HMAC',
        hash: 'SHA-256',
      },
      false,
      ['verify']
    );

    /**
     * Convert the Uint8Array into an ArrayBuffer.
     *
     * This avoids the BufferSource typing problem
     * with newer TypeScript / Next.js versions.
     */
    const signatureBuffer = new ArrayBuffer(
      signature.byteLength
    );

    new Uint8Array(signatureBuffer).set(
      signature
    );

    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      new TextEncoder().encode(issuedAtText)
    );
  } catch {
    return false;
  }
}

export async function middleware(
  request: NextRequest
) {
  const {
    pathname,
    search,
  } = request.nextUrl;

  /**
   * Allow the admin PIN gate page.
   */
  if (
    pathname === '/admin-gate' ||
    pathname.startsWith('/admin-gate/')
  ) {
    return NextResponse.next();
  }

  /**
   * Allow the admin warning page.
   */
  if (
    pathname === '/admin-warning' ||
    pathname.startsWith('/admin-warning/')
  ) {
    return NextResponse.next();
  }

  /**
   * Secret configured in Vercel / environment.
   */
  const secret =
    process.env.ADMIN_GATE_CODE;

  if (!secret) {
    return NextResponse.redirect(
      new URL(
        '/admin-gate?error=config',
        request.url
      )
    );
  }

  /**
   * Read the signed authorization cookie.
   */
  const token =
    request.cookies.get(
      COOKIE_NAME
    )?.value;

  /**
   * Valid token = allow access.
   */
  if (
    token &&
    (await verifyGateToken(
      token,
      secret
    ))
  ) {
    return NextResponse.next();
  }

  /**
   * No valid authorization.
   * Send the user to the PIN gate.
   */
  const gateUrl =
    request.nextUrl.clone();

  gateUrl.pathname =
    '/admin-gate';

  gateUrl.search = '';

  gateUrl.searchParams.set(
    'redirect',
    `${pathname}${search}`
  );

  return NextResponse.redirect(
    gateUrl
  );
}

/**
 * Protect only the admin routes.
 */
export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
  ],
};