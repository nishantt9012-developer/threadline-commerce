import { useEffect } from 'react';

/** This function is used for trapping dialog focus and restoring the previous control on close. */
export default function useDialogFocus(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return undefined;
    const container = ref.current;
    const opener = document.activeElement;
    const controls = () =>
      Array.from(
        container.querySelectorAll(
          'summary, button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        ),
      );
    controls()[0]?.focus();
    const handleTab = (event) => {
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0];
      const last = items.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first || !container.contains(document.activeElement))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !container.contains(document.activeElement))
      ) {
        event.preventDefault();
        first?.focus();
      }
    };
    container.addEventListener('keydown', handleTab);
    return () => {
      container.removeEventListener('keydown', handleTab);
      if (opener?.isConnected && !document.querySelector('[aria-modal="true"]')) opener.focus();
    };
  }, [active, ref]);
}
