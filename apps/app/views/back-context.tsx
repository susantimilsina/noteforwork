'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type BackHandler = () => void;

const Ctx = createContext<{ handler: BackHandler | null; set: (h: BackHandler | null) => void }>({
  handler: null,
  set: () => {},
});

export function BackProvider({ children }: { children: React.ReactNode }) {
  const [handler, setHandler] = useState<BackHandler | null>(null);
  // Stable `set` so useBack's effect runs once per step, not on every render.
  const set = useCallback((h: BackHandler | null) => setHandler(() => h), []);
  const value = useMemo(() => ({ handler, set }), [handler, set]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The header's Back action. */
export const useBackHandler = () => useContext(Ctx).handler;

/** Each step declares what "Back" means for it (previous step, previous question, website…). */
export function useBack(handler: BackHandler) {
  const { set } = useContext(Ctx);
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    set(() => ref.current());
    return () => set(null);
  }, [set]);
}
