import { NextResponse } from 'next/server';

const COOKIE_NAME = 'mindrizz_admin_gate';
const MAX_AGE_SECONDS = 10 * 60;

async function createGateToken(
  secret: string
): Promise<string> {
  const issuedAt = String(Date.now());

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(issuedAt)
  );

  const signatureBytes = new Uint8Array(signature);

  const signatureHex = Array.from(signatureBytes)
    .map((byte) =>
      byte.toString(16).padStart(2, '0')
    )
    .join('');

  return `${issuedAt}.${signatureHex}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const code =
      typeof body?.code === 'string'
        ? body.code.trim()
        : '';

    const correctCode =
      process.env.ADMIN_GATE_CODE;

    if (!correctCode) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Security code is not configured.',
        },
        { status: 500 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid security code.',
        },
        { status: 401 }
      );
    }

    if (code !== correctCode) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Incorrect security code.',
        },
        { status: 401 }
      );
    }

    // Correct PIN
    const token =
      await createGateToken(correctCode);

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(
      COOKIE_NAME,
      token,
      {
        httpOnly: true,

        // HTTPS in production, HTTP allowed locally
        secure:
          process.env.NODE_ENV === 'production',

        sameSite: 'lax',
        path: '/',
        maxAge: MAX_AGE_SECONDS,
      }
    );

    return response;
  } catch (error) {
    console.error(
      'Admin gate error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid request.',
      },
      { status: 400 }
    );
  }
}