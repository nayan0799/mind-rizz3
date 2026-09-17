'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { supabase } from '@/lib/supabase';

type WelcomePopupData = {
  enabled: boolean;
  title: string;
  message: string;
  image_url: string;
  button_text: string;
  button_url: string;
};

export default function WelcomePopup() {
  const pathname = usePathname();

  const [popup, setPopup] =
    useState<WelcomePopupData | null>(null);

  const [visible, setVisible] =
    useState(false);

  const [closing, setClosing] =
    useState(false);

  useEffect(() => {
    // -----------------------------------------
    // ONLY SHOW POPUP ON HOMEPAGE
    // -----------------------------------------

    if (pathname !== '/') {
      setVisible(false);
      return;
    }

    let cancelled = false;

    // -----------------------------------------
    // CHECK SUPABASE
    // -----------------------------------------

    if (!supabase) {
      console.error(
        'WELCOME POPUP: Supabase client is not available.'
      );

      return () => {
        cancelled = true;
      };
    }

    // IMPORTANT:
    // Create the client AFTER checking for null.
    // This prevents the TypeScript error:
    // "'supabase' is possibly 'null'"
    const client = supabase;

    // -----------------------------------------
    // DEBUG: CHECK SUPABASE CLIENT
    // -----------------------------------------

    console.log(
      'WELCOME POPUP: Supabase client available:',
      Boolean(client)
    );

    // -----------------------------------------
    // LOAD POPUP
    // -----------------------------------------

    async function loadPopup() {
      try {
        // -----------------------------------------
        // GET CURRENT SESSION
        // -----------------------------------------

        const {
          data: { session },
          error: sessionError,
        } = await client.auth.getSession();

        // -----------------------------------------
        // DEBUG SESSION ERROR
        // -----------------------------------------

        if (sessionError) {
          console.error(
            'WELCOME POPUP SESSION ERROR:',
            {
              message: sessionError.message,
              name: sessionError.name,
              status: sessionError.status,
            }
          );

          setVisible(false);
          return;
        }

        if (cancelled) {
          return;
        }

        // -----------------------------------------
        // USER IS LOGGED IN / SIGNED UP
        // DON'T SHOW POPUP
        // -----------------------------------------

        if (session?.user) {
          console.log(
            'WELCOME POPUP: User is logged in. Popup hidden.'
          );

          setVisible(false);
          return;
        }

        // -----------------------------------------
        // USER IS NOT LOGGED IN
        // GET POPUP FROM DATABASE
        // -----------------------------------------

        console.log(
          'WELCOME POPUP: Loading popup from Supabase...'
        );

        const {
          data,
          error,
        } = await client
          .from('welcome_popup')
          .select(
            'enabled,title,message,image_url,button_text,button_url'
          )
          .limit(1)
          .maybeSingle();

        if (cancelled) {
          return;
        }

        // -----------------------------------------
        // DATABASE ERROR
        // -----------------------------------------

        if (error) {
          console.error(
            'WELCOME POPUP SUPABASE ERROR:',
            {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            }
          );

          setVisible(false);

          return;
        }

        // -----------------------------------------
        // DEBUG DATABASE RESULT
        // -----------------------------------------

        console.log(
          'WELCOME POPUP DATABASE DATA:',
          data
        );

        // -----------------------------------------
        // NO POPUP OR POPUP DISABLED
        // -----------------------------------------

        if (!data || !data.enabled) {
          console.log(
            'WELCOME POPUP: No popup found or popup is disabled.'
          );

          setVisible(false);
          return;
        }

        // -----------------------------------------
        // SAVE POPUP DATA
        // -----------------------------------------

        setPopup({
          enabled: Boolean(data.enabled),

          title:
            data.title ||
            'Welcome to Mind Rizz',

          message:
            data.message ||
            'Join our WhatsApp group for the latest updates.',

          image_url:
            data.image_url || '',

          button_text:
            data.button_text ||
            'JOIN WHATSAPP',

          button_url:
            data.button_url || '',
        });

        // -----------------------------------------
        // SHOW POPUP
        // -----------------------------------------

        console.log(
          'WELCOME POPUP: Popup is enabled. Showing popup.'
        );

        setVisible(true);
      } catch (error) {
        // -----------------------------------------
        // UNEXPECTED ERROR
        // -----------------------------------------

        console.error(
          'WELCOME POPUP UNEXPECTED ERROR:',
          error
        );

        setVisible(false);
      }
    }

    // -----------------------------------------
    // LOAD POPUP ON PAGE LOAD
    // -----------------------------------------

    loadPopup();

    // -----------------------------------------
    // LISTEN FOR LOGIN / SIGNUP / LOGOUT
    // -----------------------------------------

    const {
      data: authListener,
    } = client.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) {
          return;
        }

        // -----------------------------------------
        // USER LOGGED IN OR SIGNED UP
        // CLOSE POPUP
        // -----------------------------------------

        if (session?.user) {
          console.log(
            'WELCOME POPUP: User logged in. Closing popup.'
          );

          setClosing(true);

          window.setTimeout(() => {
            if (cancelled) {
              return;
            }

            setVisible(false);
            setClosing(false);
          }, 180);

          return;
        }

        // -----------------------------------------
        // USER LOGGED OUT
        // CHECK POPUP AGAIN
        // -----------------------------------------

        console.log(
          'WELCOME POPUP: User logged out. Checking popup.'
        );

        loadPopup();
      }
    );

    // -----------------------------------------
    // CLEANUP
    // -----------------------------------------

    return () => {
      cancelled = true;

      authListener.subscription.unsubscribe();
    };
  }, [pathname]);

  // -----------------------------------------
  // CLOSE POPUP
  // -----------------------------------------

  function closePopup() {
    setClosing(true);

    window.setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 180);
  }

  // -----------------------------------------
  // DON'T RENDER
  // -----------------------------------------

  if (
    pathname !== '/' ||
    !popup ||
    !visible
  ) {
    return null;
  }

  // -----------------------------------------
  // POPUP
  // -----------------------------------------

  return (
    <div
      className={`welcome-popup-overlay ${
        closing
          ? 'welcome-popup-closing'
          : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
    >

      {/* BACKDROP */}

      <div
        className="welcome-popup-backdrop"
        onClick={closePopup}
        aria-hidden="true"
      />

      {/* POPUP CARD */}

      <div className="welcome-popup-card">

        {/* CLOSE BUTTON */}

        <button
          type="button"
          className="welcome-popup-close"
          onClick={closePopup}
          aria-label="Close welcome popup"
        >
          ×
        </button>

        {/* TOP LINE */}

        <div className="welcome-popup-top-line" />

        {/* OPTIONAL IMAGE */}

        {popup.image_url && (
          <div className="welcome-popup-image-wrap">
            <img
              src={popup.image_url}
              alt=""
              className="welcome-popup-image"
            />
          </div>
        )}

        {/* CONTENT */}

        <div className="welcome-popup-content">

          {/* EYEBROW */}

          <span className="welcome-popup-eyebrow">

            <span className="welcome-popup-dot" />

            MIND RIZZ • WELCOME

          </span>

          {/* TITLE */}

          <h2 id="welcome-popup-title">
            {popup.title}
          </h2>

          {/* MESSAGE */}

          <p>
            {popup.message}
          </p>

          {/* ACTIONS */}

          <div className="welcome-popup-actions">

            {/* JOIN BUTTON */}

            {popup.button_url && (
              <a
                href={popup.button_url}
                target="_blank"
                rel="noopener noreferrer"
                className="welcome-popup-button"
                onClick={closePopup}
              >

                <span>
                  {popup.button_text}
                </span>

                <span className="welcome-popup-arrow">
                  ↗
                </span>

              </a>
            )}

            {/* CONTINUE BUTTON */}

            <button
              type="button"
              className="welcome-popup-dismiss"
              onClick={closePopup}
            >
              CONTINUE TO EVENT
            </button>

          </div>
        </div>

        {/* FOOTER */}

        <div className="welcome-popup-bottom">

          <span>
            THINK • PLAY • CONQUER
          </span>

          <span>
            MIND RIZZ 2026
          </span>

        </div>

      </div>
    </div>
  );
}