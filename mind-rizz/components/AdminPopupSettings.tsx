'use client';

import {
  useEffect,
  useState,
} from 'react';

import { supabase } from '@/lib/supabase';

type PopupForm = {
  enabled: boolean;
  title: string;
  message: string;
  image_url: string;
  button_text: string;
  button_url: string;
};

const DEFAULT_FORM: PopupForm = {
  enabled: true,
  title: 'Welcome to Mind Rizz',
  message:
    'Join our official WhatsApp group for event updates.',
  image_url: '',
  button_text: 'JOIN WHATSAPP',
  button_url: '',
};

export default function AdminPopupSettings() {
  const [form, setForm] =
    useState<PopupForm>(DEFAULT_FORM);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    loadPopup();
  }, []);

  async function loadPopup() {
    setLoading(true);
    setMessage('');

    try {
      if (!supabase) {
        throw new Error(
          'Supabase is not configured.'
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          'You are not logged in.'
        );
      }

      /*
       * Verify admin account.
       */
      const { data: profile, error: profileError } =
        await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

      if (profileError) {
        throw profileError;
      }

      if (profile?.role !== 'admin') {
        throw new Error(
          'Administrator permission required.'
        );
      }

      const { data, error } =
        await supabase
          .from('welcome_popup')
          .select('*')
          .limit(1)
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setForm({
          enabled: Boolean(data.enabled),
          title:
            data.title ||
            DEFAULT_FORM.title,
          message:
            data.message ||
            DEFAULT_FORM.message,
          image_url:
            data.image_url || '',
          button_text:
            data.button_text ||
            DEFAULT_FORM.button_text,
          button_url:
            data.button_url || '',
        });
      }
    } catch (error) {
      console.error(
        'Popup settings load error:',
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load popup settings.'
      );
    } finally {
      setLoading(false);
    }
  }

  function update(
    key: keyof PopupForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function savePopup(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setMessage('');
    setSuccess(false);

    try {
      if (!supabase) {
        throw new Error(
          'Supabase is not configured.'
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          'You are not logged in.'
        );
      }

      /*
       * Double-check administrator permission.
       */
      const { data: profile, error: profileError } =
        await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

      if (profileError) {
        throw profileError;
      }

      if (profile?.role !== 'admin') {
        throw new Error(
          'Administrator permission required.'
        );
      }

      /*
       * Check whether a popup row already exists.
       */
      const { data: existing, error: existingError } =
        await supabase
          .from('welcome_popup')
          .select('id')
          .limit(1)
          .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      let error;

      if (existing?.id) {
        /*
         * Update existing popup.
         */
        const result = await supabase
          .from('welcome_popup')
          .update({
            enabled: form.enabled,
            title: form.title.trim(),
            message: form.message.trim(),
            image_url:
              form.image_url.trim(),
            button_text:
              form.button_text.trim(),
            button_url:
              form.button_url.trim(),
          })
          .eq('id', existing.id);

        error = result.error;
      } else {
        /*
         * Create popup if none exists.
         */
        const result = await supabase
          .from('welcome_popup')
          .insert({
            enabled: form.enabled,
            title: form.title.trim(),
            message: form.message.trim(),
            image_url:
              form.image_url.trim(),
            button_text:
              form.button_text.trim(),
            button_url:
              form.button_url.trim(),
          });

        error = result.error;
      }

      if (error) {
        throw error;
      }

      setSuccess(true);
      setMessage(
        'Welcome popup saved successfully.'
      );

      /*
       * Hide success message later.
       */
      window.setTimeout(() => {
        setSuccess(false);
        setMessage('');
      }, 3500);
    } catch (error) {
      console.error(
        'Popup settings save error:',
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save popup.'
      );

      setSuccess(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="admin-popup-settings">
        <div className="admin-popup-loading">
          Loading popup settings...
        </div>
      </section>
    );
  }

  return (
    <section className="admin-popup-settings">
      <div className="admin-popup-header">
        <div>
          <span className="admin-popup-eyebrow">
            HOME PAGE
          </span>

          <h2>
            Welcome Popup
          </h2>

          <p>
            Control the popup visitors see on
            their first visit to the home page.
          </p>
        </div>

        <div
          className={`admin-popup-status ${
            form.enabled
              ? 'is-enabled'
              : 'is-disabled'
          }`}
        >
          <span />
          {form.enabled
            ? 'POPUP ACTIVE'
            : 'POPUP DISABLED'}
        </div>
      </div>

      <form
        className="admin-popup-form"
        onSubmit={savePopup}
      >
        {/* ENABLE/DISABLE */}

        <div className="admin-popup-toggle-row">
          <div>
            <strong>
              Show Welcome Popup
            </strong>

            <small>
              Enable or disable the popup on
              the public home page.
            </small>
          </div>

          <button
            type="button"
            className={`admin-popup-toggle ${
              form.enabled
                ? 'active'
                : ''
            }`}
            onClick={() =>
              update(
                'enabled',
                !form.enabled
              )
            }
            aria-pressed={form.enabled}
          >
            <span />
          </button>
        </div>

        {/* TITLE */}

        <div className="admin-popup-field">
          <label htmlFor="popup-title">
            Popup Title
          </label>

          <input
            id="popup-title"
            type="text"
            value={form.title}
            onChange={(event) =>
              update(
                'title',
                event.target.value
              )
            }
            placeholder="Welcome to Mind Rizz"
            maxLength={100}
          />
        </div>

        {/* MESSAGE */}

        <div className="admin-popup-field">
          <label htmlFor="popup-message">
            Message
          </label>

          <textarea
            id="popup-message"
            value={form.message}
            onChange={(event) =>
              update(
                'message',
                event.target.value
              )
            }
            placeholder="Write your welcome message..."
            rows={5}
            maxLength={500}
          />

          <small>
            {form.message.length}/500
          </small>
        </div>

        {/* IMAGE URL */}

        <div className="admin-popup-field">
          <label htmlFor="popup-image">
            Image URL
          </label>

          <input
            id="popup-image"
            type="url"
            value={form.image_url}
            onChange={(event) =>
              update(
                'image_url',
                event.target.value
              )
            }
            placeholder="https://example.com/welcome.jpg"
          />

          <small>
            Use a publicly accessible image URL.
          </small>
        </div>

        {/* IMAGE PREVIEW */}

        {form.image_url && (
          <div className="admin-popup-preview">
            <span>
              IMAGE PREVIEW
            </span>

            <img
              src={form.image_url}
              alt="Popup preview"
              onError={(event) => {
                event.currentTarget.style.display =
                  'none';
              }}
            />
          </div>
        )}

        {/* BUTTON TEXT */}

        <div className="admin-popup-field">
          <label htmlFor="popup-button-text">
            Button Text
          </label>

          <input
            id="popup-button-text"
            type="text"
            value={form.button_text}
            onChange={(event) =>
              update(
                'button_text',
                event.target.value
              )
            }
            placeholder="JOIN WHATSAPP"
            maxLength={50}
          />
        </div>

        {/* BUTTON URL */}

        <div className="admin-popup-field">
          <label htmlFor="popup-button-url">
            Button URL
          </label>

          <input
            id="popup-button-url"
            type="url"
            value={form.button_url}
            onChange={(event) =>
              update(
                'button_url',
                event.target.value
              )
            }
            placeholder="https://chat.whatsapp.com/..."
          />
        </div>

        {/* LIVE PREVIEW */}

        <div className="admin-popup-live-preview">
          <div className="admin-popup-live-title">
            LIVE CONTENT
          </div>

          <div className="admin-popup-live-card">
            <span>
              {form.enabled
                ? '● ACTIVE'
                : '○ DISABLED'}
            </span>

            <h3>
              {form.title ||
                'Welcome to Mind Rizz'}
            </h3>

            <p>
              {form.message ||
                'Your popup message will appear here.'}
            </p>

            {form.button_url && (
              <div className="admin-popup-live-button">
                {form.button_text ||
                  'BUTTON'}
              </div>
            )}
          </div>
        </div>

        {/* SAVE */}

        <div className="admin-popup-actions">
          <button
            type="submit"
            className="admin-popup-save"
            disabled={saving}
          >
            {saving
              ? 'SAVING...'
              : 'SAVE POPUP'}
          </button>

          <button
            type="button"
            className="admin-popup-reset"
            onClick={loadPopup}
            disabled={saving}
          >
            RELOAD
          </button>
        </div>

        {message && (
          <div
            className={`admin-popup-message ${
              success
                ? 'success'
                : 'error'
            }`}
          >
            {success ? '✓' : '⚠'}{' '}
            {message}
          </div>
        )}
      </form>
    </section>
  );
}