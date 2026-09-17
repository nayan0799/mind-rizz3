'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import { supabase } from '@/lib/supabase';
import { emptyState } from '@/lib/defaults';
import { rankTeams } from '@/lib/ranking';
import type { State } from '@/lib/types';

type Payload = Record<string, any>;

type Context = {
  state: State;
  loading: boolean;
  demo: boolean;
  error: string;
  refresh: () => Promise<void>;
  act: (action: string, payload?: Payload) => Promise<void>;
  enterDemo: (role: 'student' | 'admin') => void;
  logout: () => Promise<void>;
  notify: (message: string) => void;
};

const C = createContext<Context | null>(null);

export function useApp() {
  const c = useContext(C);

  if (!c) {
    throw new Error('Provider missing');
  }

  return c;
}

export function Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<State>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const busy = useRef(false);

  /*
   * Load the application state from Supabase.
   *
   * IMPORTANT:
   * get_state() is available to both anonymous and
   * authenticated users, so DO NOT require login here.
   *
   * This allows the public website to receive the
   * configuration saved from the Admin Dashboard.
   */
  const refresh = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: rpcError } =
        await supabase.rpc('get_state');

      if (rpcError) {
        console.error('get_state error:', rpcError.message);
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      if (data) {
        setState(data as State);
      } else {
        setState(emptyState);
      }

      setError('');
    } catch (err) {
      console.error('Refresh error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load application state.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Initial load + automatic refresh.
   *
   * The 12-second refresh means changes made from the
   * Admin Dashboard will automatically reach an already
   * opened public page.
   */
  useEffect(() => {
    void refresh();

    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => {
        void refresh();
      }, 0);
    });

    const timer = setInterval(() => {
      void refresh();
    }, 12000);

    return () => {
      subscription.unsubscribe();
      clearInterval(timer);
    };
  }, [refresh]);

  /*
   * Hide toast after 5 seconds.
   */
  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(() => {
      setMessage('');
    }, 5000);

    return () => clearTimeout(timer);
  }, [message]);

  /*
   * Logout.
   */
  async function logout() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();

    /*
     * Refresh public state after logout instead of
     * replacing it with emptyState.
     *
     * This is important because public configuration
     * must remain visible after logout.
     */
    await refresh();

    setError('');
  }

  /*
   * Perform a Supabase mutation.
   * Used by Admin Dashboard and other authenticated actions.
   */
  async function act(
    action: string,
    payload: Payload = {},
  ) {
    if (busy.current) {
      throw new Error(
        'Please wait for the previous change.',
      );
    }

    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    busy.current = true;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Please login first.');
      }

      const { error: rpcError } =
        await supabase.rpc('mutate', {
          action,
          payload,
        });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      /*
       * Immediately reload the latest configuration
       * after Admin saves it.
       */
      await refresh();

      setMessage('Changes saved.');
    } finally {
      busy.current = false;
    }
  }

  /*
   * Demo mode has been removed.
   */
  const enterDemo = () => {
    throw new Error(
      'Demo mode has been removed. Please login with Supabase.',
    );
  };

  return (
    <C.Provider
      value={{
        state,
        loading,
        demo: false,
        error,
        refresh,
        act,
        enterDemo,
        logout,
        notify: setMessage,
      }}
    >
      {children}

      {message && (
        <div
          className="toast"
          role="status"
        >
          {message}
        </div>
      )}
    </C.Provider>
  );
}
