"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type SessionUser = { name: string; email: string; role: string } | null;

type SessionState = { user: SessionUser; loading: boolean; refresh: () => void };

const SessionContext = createContext<SessionState>({
  user: null,
  loading: true,
  refresh: () => {},
});

/**
 * Session state for the client shell.
 *
 * One fetch of /api/me per page load, shared by the header and the Dispatch gate, so the static
 * shell can still know who is signed in. `loading` is exposed so those components can hold
 * their ground instead of flashing a signed-out state and then correcting itself.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => {
        if (!cancelled) setUser(d.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return (
    <SessionContext.Provider value={{ user, loading, refresh: () => setNonce((n) => n + 1) }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
