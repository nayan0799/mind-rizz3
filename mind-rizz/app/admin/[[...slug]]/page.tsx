import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import AdminClient from '@/components/admin';

const COOKIE_NAME = 'mindrizz_admin_gate';
const MAX_AGE_SECONDS = 10 * 60;

async function verifyGateToken(
  token: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = token.split('.');

    if (parts.length !== 2) {
      return false;
    }

    const [issuedAt, signatureHex] = parts;

    if (!issuedAt || !signatureHex) {
      return false;
    }

    const issuedTime = Number(issuedAt);

    if (!Number.isFinite(issuedTime)) {
      return false;
    }

    const age = Date.now() - issuedTime;

    if (
      age < 0 ||
      age > MAX_AGE_SECONDS * 1000
    ) {
      return false;
    }

    if (!/^[0-9a-f]{64}$/i.test(signatureHex)) {
      return false;
    }

    const signatureBytes =
      new Uint8Array(
        signatureHex
          .match(/.{1,2}/g)!
          .map((byte) =>
            parseInt(byte, 16)
          )
      );

    const key =
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        {
          name: 'HMAC',
          hash: 'SHA-256',
        },
        false,
        ['verify']
      );

    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(issuedAt)
    );
  } catch {
    return false;
  }
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{
    slug?: string[];
  }>;
}) {
  const { slug } = await params;

  /*
   * Allow the admin login page to open
   * without the PIN gate.
   */
  if (
    slug?.length === 1 &&
    slug[0] === 'login'
  ) {
    return <AdminClient />;
  }

  const secret =
    process.env.ADMIN_GATE_CODE;

  if (!secret) {
    redirect(
      '/admin-gate?redirect=%2Fadmin%2Fslug'
    );
  }

  const cookieStore = await cookies();

  const token =
    cookieStore.get(COOKIE_NAME)?.value;

  /*
   * Validate the signed gate token.
   */
  const valid =
    !!token &&
    (await verifyGateToken(
      token,
      secret
    ));

  if (!valid) {
    redirect(
      '/admin-gate?redirect=%2Fadmin%2Fslug'
    );
  }

  /*
   * PIN gate passed.
   * Now load the actual admin dashboard.
   */
  return <AdminClient />;
}