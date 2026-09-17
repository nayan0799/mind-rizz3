'use client';

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

function getSafeRedirect(
  value: string | null
): string {
  if (!value) {
    return '/admin';
  }

  if (!value.startsWith('/admin')) {
    return '/admin';
  }

  if (
    value.startsWith('/admin-gate') ||
    value.startsWith('/admin-warning')
  ) {
    return '/admin';
  }

  return value;
}

export default function AdminGatePage() {
  const [redirectTo, setRedirectTo] =
    useState('/admin');

  const [code, setCode] = useState<string[]>([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);

  const [loading, setLoading] =
    useState(false);

  const inputs =
    useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const redirect =
      params.get('redirect');

    setRedirectTo(
      getSafeRedirect(redirect)
    );

    const timer = window.setTimeout(() => {
      inputs.current[0]?.focus();
    }, 100);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  function handleChange(
    value: string,
    index: number
  ) {
    const digit = value
      .replace(/\D/g, '')
      .slice(-1);

    setCode((previous) => {
      const next = [...previous];
      next[index] = digit;
      return next;
    });

    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    index: number
  ) {
    if (
      event.key === 'Backspace' &&
      !code[index] &&
      index > 0
    ) {
      inputs.current[index - 1]?.focus();
      return;
    }

    if (
      event.key === 'ArrowLeft' &&
      index > 0
    ) {
      inputs.current[index - 1]?.focus();
      return;
    }

    if (
      event.key === 'ArrowRight' &&
      index < 5
    ) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handlePaste(
    event: React.ClipboardEvent<HTMLInputElement>
  ) {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);

    if (!pasted) {
      return;
    }

    const next = [
      '',
      '',
      '',
      '',
      '',
      '',
    ];

    pasted
      .split('')
      .forEach((digit, index) => {
        next[index] = digit;
      });

    setCode(next);

    const focusIndex =
      Math.min(pasted.length, 5);

    window.setTimeout(() => {
      inputs.current[focusIndex]?.focus();
    }, 0);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const fullCode =
      code.join('');

    if (
      fullCode.length !== 6 ||
      loading
    ) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        '/api/admin-gate',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          credentials: 'include',
          cache: 'no-store',
          body: JSON.stringify({
            code: fullCode,
          }),
        }
      );

      let result: {
        success?: boolean;
        message?: string;
      } = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (
        response.ok &&
        result.success === true
      ) {
        /*
         * IMPORTANT:
         *
         * The API sets the admin authorization
         * cookie in its response.
         *
         * A full browser navigation gives the
         * browser a fresh request to /admin so
         * middleware can read that cookie.
         */
        window.location.assign(
          redirectTo
        );

        return;
      }

      window.location.assign(
        '/admin-warning'
      );
    } catch {
      window.location.assign(
        '/admin-warning'
      );
    }
  }

  const filledCount =
    code.filter(Boolean).length;

  return (
    <main className="admin-gate-page">
      <div className="admin-gate-background">
        <div className="gate-grid" />
        <div className="gate-scanlines" />

        <div className="gate-glow gate-glow-one" />
        <div className="gate-glow gate-glow-two" />
        <div className="gate-glow gate-glow-three" />

        <div className="gate-binary gate-binary-one">
          01010101
          <br />
          10101010
          <br />
          11001001
          <br />
          00110110
          <br />
          01010101
        </div>

        <div className="gate-binary gate-binary-two">
          10101010
          <br />
          01010101
          <br />
          11100011
          <br />
          00011010
          <br />
          10101010
        </div>

        <div className="gate-binary gate-binary-three">
          11001100
          <br />
          00110011
          <br />
          10101010
          <br />
          01010101
        </div>
      </div>

      <div className="gate-system-info">
        <div>
          <span />
        </div>

        <div>
          ENCRYPTION{' '}
          <span>ACTIVE</span>
        </div>

        <div>
          <span />
        </div>
      </div>

      <section className="admin-gate-card">
        <div className="gate-top-line">
          <span>
            ADMIN SECURITY PROTOCOL
          </span>

          <span>v3.7.1</span>
        </div>

        <div className="security-status">
          <span className="status-dot" />

          <span>
            SECURE ADMIN ACCESS
          </span>

          <span className="status-line" />

          <span>
            CONNECTION ENCRYPTED
          </span>
        </div>

        <div className="lock-wrapper">
          <div className="lock-outer-ring">
            <div className="lock-ring">
              <div className="lock-icon">
                🔐
              </div>
            </div>
          </div>
        </div>

        <div className="gate-heading">
          <p className="eyebrow">
            MINDRIZZ CONTROL PANEL
          </p>

          <h1>
            ADMIN
            <span> SECURITY</span>
          </h1>

          <div className="heading-line">
            <span />

            AUTHORIZED PERSONNEL ONLY

            <span />
          </div>

          <p className="gate-description">
            Enter your 6-digit security
            code to access the
            administrator control panel.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="admin-security-form"
        >
          <div className="pin-label">
            <span>
              SECURITY CODE
            </span>

            <span className="pin-counter">
              {String(
                filledCount
              ).padStart(2, '0')}
              /06
            </span>
          </div>

          <div className="pin-container">
            {code.map(
              (digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputs.current[index] =
                      element;
                  }}
                  className={`pin-input ${
                    digit
                      ? 'filled'
                      : ''
                  }`}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(event) =>
                    handleChange(
                      event.target.value,
                      index
                    )
                  }
                  onKeyDown={(event) =>
                    handleKeyDown(
                      event,
                      index
                    )
                  }
                  onPaste={handlePaste}
                  disabled={loading}
                  autoComplete="one-time-code"
                  aria-label={`Security code digit ${
                    index + 1
                  }`}
                />
              )
            )}
          </div>

          <div className="pin-status">
            <span
              className={
                filledCount === 6
                  ? 'active'
                  : ''
              }
            />

            {filledCount === 6
              ? 'CODE READY FOR VERIFICATION'
              : 'AWAITING SECURITY CODE'}
          </div>

          <button
            type="submit"
            className="verify-button"
            disabled={
              filledCount !== 6 ||
              loading
            }
          >
            <span className="button-icon">
              {loading ? '◌' : '✓'}
            </span>

            <span>
              {loading
                ? 'VERIFYING ACCESS...'
                : 'VERIFY & CONTINUE'}
            </span>

            {!loading && (
              <span className="button-arrow">
                →
              </span>
            )}
          </button>
        </form>

        <div className="security-info">
          <div className="security-info-item">
            <span className="info-icon">
              🛡
            </span>

            <div>
              <strong>
                PROTECTED ACCESS
              </strong>

              <small>
                ENCRYPTED SESSION
              </small>
            </div>
          </div>

          <div className="security-divider" />

          <div className="security-info-item">
            <span className="info-icon">
              🔒
            </span>

            <div>
              <strong>
                PRIVATE AREA
              </strong>

              <small>
                ADMINISTRATORS ONLY
              </small>
            </div>
          </div>
        </div>

        <div className="gate-footer">
          <span>
            ACCESS CONTROL SYSTEM
          </span>

          <span>•</span>

          <span>MINDRIZZ</span>

          <span>•</span>

          <span>
            SECURE CONNECTION
          </span>
        </div>
      </section>

      <div className="side-panel side-panel-left">
        <div className="side-title">
          SECURITY SYSTEM
        </div>

        <div>
          STATUS:
          <strong> ONLINE</strong>
        </div>

        <div>
          FIREWALL:
          <strong> ACTIVE</strong>
        </div>

        <div>
          ACCESS:
          <strong> RESTRICTED</strong>
        </div>

        <div className="side-line" />

        <div className="side-warning">
          ⚠ AUTHORIZED ACCESS ONLY
        </div>
      </div>

      <div className="side-panel side-panel-right">
        <div className="side-title">
          ACCESS CONTROL
        </div>

        <div>
          ENCRYPTION:
          <strong> AES-256</strong>
        </div>

        <div>
          SESSION:
          <strong> SECURE</strong>
        </div>

        <div>
          THREAT:
          <strong> LOW</strong>
        </div>

        <div className="side-line" />

        <div className="side-code">
          101010
          <br />
          010101
          <br />
          110011
        </div>
      </div>

      <div className="copyright">
        MINDRIZZ • ADMIN SECURITY SYSTEM
      </div>
    </main>
  );
}