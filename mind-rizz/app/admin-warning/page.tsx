'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminWarningPage() {
  const router = useRouter();

  const [seconds, setSeconds] = useState(10);
  const [currentTime, setCurrentTime] = useState('');

  // Live clock — starts only on the client to avoid hydration errors
  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateClock();

    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  // 10-second automatic redirect
  useEffect(() => {
    if (seconds <= 0) {
      router.replace('/');
      return;
    }

    const timer = setTimeout(() => {
      setSeconds((value) => value - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds, router]);

  const goHome = () => {
    router.replace('/');
  };

  // Fixed binary characters = no hydration mismatch
  const binaryColumns = [
    '01010101010101010101',
    '10101010101010101010',
    '00110101010110101010',
    '11001010101001010101',
    '01011010100101010101',
    '10100101010110101010',
    '01101010101001010101',
    '10010101010101011010',
    '01010110101010100101',
    '10101001010101010110',
    '00101010110101010101',
    '11010101001010101010',
    '01010101010110101010',
    '10101010101001010101',
    '01101001010101010110',
    '10010101010110101010',
  ];

  return (
    <main className="admin-warning-page">

      {/* ==================================================
          FALLING GREEN BINARY BACKGROUND
          ================================================== */}

      <div className="binary-rain" aria-hidden="true">
        {binaryColumns.map((column, index) => (
          <span
            key={index}
            className={`binary-column binary-column-${index + 1}`}
          >
            {column.split('').map((char, charIndex) => (
              <span key={charIndex}>{char}</span>
            ))}
          </span>
        ))}
      </div>

      {/* Red background glow */}
      <div className="warning-red-glow" />

      {/* ==================================================
          MAIN CONTENT
          ================================================== */}

      <div className="warning-page-content">

        {/* TOP SYSTEM BAR */}
        <div className="warning-top-bar">
          <span>
            SYSTEM ONLINE
          </span>

          <span>
            SECURITY PROTOCOL ACTIVE
          </span>

          <span>
            ADMIN PANEL
          </span>
        </div>

        {/* ==================================================
            MAIN WARNING CARD
            ================================================== */}

        <section className="danger-card">

          {/* Corner decorations */}
          <div className="danger-corner danger-corner-tl" />
          <div className="danger-corner danger-corner-tr" />
          <div className="danger-corner danger-corner-bl" />
          <div className="danger-corner danger-corner-br" />

          {/* Hazard stripe */}
          <div className="hazard-stripe">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          {/* ==================================================
              DANGER SYMBOL
              ================================================== */}

          <div className="danger-symbol-wrapper">
            <div className="danger-symbol">
              ⚠
            </div>
          </div>

          {/* ==================================================
              ACCESS DENIED
              ================================================== */}

          <div className="access-denied-title">
            <div>ACCESS</div>
            <div>DENIED</div>
          </div>

          {/* ==================================================
              UNAUTHORIZED MESSAGE
              ================================================== */}

          <div className="unauthorized-alert">
            <span className="alert-symbol">⚠</span>

            <span>
              UNAUTHORIZED ACCESS DETECTED
            </span>
          </div>

          <div className="security-message">
            <p>
              SECURITY PROTOCOL ACTIVATED.
            </p>

            <p>
              INVALID ADMINISTRATOR CREDENTIALS DETECTED.
            </p>

            <p>
              ACCESS TO THE CONTROL PANEL HAS BEEN BLOCKED.
            </p>
          </div>

          {/* ==================================================
              STATUS INFORMATION
              ================================================== */}

          <div className="security-status-grid">

            <div className="security-status-item">
              <span className="status-icon">
                ⚠
              </span>

              <div>
                <small>
                  THREAT LEVEL
                </small>

                <strong>
                  CRITICAL
                </strong>
              </div>
            </div>

            <div className="security-status-item">
              <span className="status-icon">
                ⛔
              </span>

              <div>
                <small>
                  ACCESS STATUS
                </small>

                <strong>
                  BLOCKED
                </strong>
              </div>
            </div>

            <div className="security-status-item">
              <span className="status-icon">
                🔒
              </span>

              <div>
                <small>
                  SYSTEM RESPONSE
                </small>

                <strong>
                  LOCKDOWN
                </strong>
              </div>
            </div>

          </div>

          {/* ==================================================
              FAKE IP
              ================================================== */}

          <div className="ip-panel">

            <div className="ip-label">
              YOUR IP
            </div>

            <div className="ip-address">
              192.168.1.105
            </div>

            <div className="ip-details">
              <span>
                LOCATION: UNKNOWN
              </span>

              <span>
                ISP: UNKNOWN
              </span>

              <span>
                STATUS: MONITORED
              </span>
            </div>

          </div>

          {/* ==================================================
              COUNTDOWN
              ================================================== */}

          <div className="countdown-area">

            <div className="countdown-ring">

              <div className="countdown-number">
                {seconds}
              </div>

              <div className="countdown-text">
                SECONDS
              </div>

            </div>

          </div>

          {/* ==================================================
              BACK TO EVENT
              ================================================== */}

          <button
            type="button"
            className="back-event-button"
            onClick={goHome}
          >
            <span>
              ←
            </span>

            <span>
              BACK TO EVENT
            </span>
          </button>

          {/* Current time */}
          <div className="warning-time">
            SYSTEM TIME:
            {' '}
            {currentTime || '--:--:--'}
          </div>

        </section>

        {/* ==================================================
            SECURITY LOG
            ================================================== */}

        <section className="security-log">

          <div className="security-log-header">
            SECURITY LOG
          </div>

          <div className="security-log-body">

            <div>
              <span>
                // ACCESS:
              </span>

              <strong>
                DENIED
              </strong>
            </div>

            <div>
              <span>
                // USER:
              </span>

              <strong>
                UNKNOWN
              </strong>
            </div>

            <div>
              <span>
                // SESSION:
              </span>

              <strong>
                BLOCKED
              </strong>
            </div>

            <div>
              <span>
                // IP:
              </span>

              <strong>
                192.168.1.105
              </strong>
            </div>

            <div>
              <span>
                // TIME:
              </span>

              <strong>
                {currentTime || '--:--:--'}
              </strong>
            </div>

            <div className="log-divider" />

            <div>
              <span>
                // SYSTEM:
              </span>

              <strong>
                MONITORING
              </strong>
            </div>

            <div>
              <span>
                // FIREWALL:
              </span>

              <strong>
                ACTIVE
              </strong>
            </div>

            <div>
              <span>
                // SECURITY:
              </span>

              <strong>
                ENABLED
              </strong>
            </div>

          </div>

        </section>

        {/* ==================================================
            FOOTER
            ================================================== */}

        <footer className="warning-footer">

          <span>
            SECURITY SYSTEM v3.7.1
          </span>

          <span>
            ● ACCESS FAILED
          </span>

          <span>
            IP: 192.168.1.105
          </span>

          <span>
            STATUS: BLOCKED
          </span>

        </footer>

      </div>
    </main>
  );
}