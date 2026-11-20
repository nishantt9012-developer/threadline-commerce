import { useEffect, useRef } from 'react';

/** Calls `onEscape` when Escape is pressed while `active`. Safe to pass an inline function. */
export function useEscapeKey(onEscape, active = true) {
  const latest = useRef(onEscape);
  useEffect(() => {
    latest.current = onEscape;
  });

  useEffect(() => {
    if (!active) return undefined;
    const listener = (event) => {
      if (event.key === 'Escape') latest.current();
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [active]);
}
